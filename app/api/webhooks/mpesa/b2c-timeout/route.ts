import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { signOutgoingPayload } from '@/lib/security';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const payload = JSON.parse(rawBody);

    const conversationId = payload?.Result?.ConversationID || payload?.ConversationID;

    // 1. Log the timeout raw event
    await supabaseAdmin.from('mpesa_webhook_logs').insert({
      tracking_id: conversationId || 'TIMEOUT_UNKNOWN',
      raw_payload: payload,
      webhook_type: 'b2c_timeout'
    });

    if (!conversationId) {
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    // 2. Locate and update transaction as failed in shadow ledger
    const { data: shadowTx } = await supabaseAdmin
      .from('secondary_request_shadow')
      .update({ status: 'failed', updated_at: new Date().toISOString() })
      .eq('mpesa_tracking_id', conversationId)
      .select('secondary_tx_id, callback_url, metadata')
      .single();

    // 3. Notify Platform B of the timeout so it can refund the user's balance
    if (shadowTx) {
      const platformBPayload = {
        secondary_tx_id: shadowTx.secondary_tx_id,
        status: 'failed',
        receipt_number: null,
        message: 'M-Pesa system timeout during withdrawal processing',
        metadata: shadowTx.metadata
      };

      const secret = process.env.INTER_PLATFORM_SECRET!;
      const { signature, timestamp, stringifiedPayload } = signOutgoingPayload(platformBPayload, secret);

      await fetch(shadowTx.callback_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-signature': signature,
          'x-timestamp': timestamp,
        },
        body: stringifiedPayload,
      }).catch((err) => console.error('Failed notifying Platform B of timeout:', err));
    }

    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  } catch (error) {
    console.error('B2C Timeout Error:', error);
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted with internal errors" });
  }
}
