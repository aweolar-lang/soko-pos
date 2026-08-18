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

    // 2. Locate the transaction in the shadow ledger FIRST
    const { data: shadowTx, error: fetchError } = await supabaseAdmin
      .from('secondary_request_shadow')
      .select('*')
      .eq('mpesa_tracking_id', conversationId)
      .single();

    if (fetchError || !shadowTx) {
      console.error(`Timeout tx not found for ConversationID: ${conversationId}`);
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted but not found" });
    }

    // Protection against race conditions: Don't fail an already completed/failed tx
    if (shadowTx.status === 'completed' || shadowTx.status === 'failed') {
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    // 3. Notify Platform B of the timeout
    const platformBPayload = {
      secondary_tx_id: shadowTx.secondary_tx_id,
      status: 'failed',
      receipt_number: null,
      message: 'M-Pesa system timeout during withdrawal processing',
      metadata: shadowTx.metadata
    };

    const secret = process.env.INTER_PLATFORM_SECRET!;
    const { signature, timestamp, stringifiedPayload } = signOutgoingPayload(platformBPayload, secret);

    let callbackSuccessful = false;
    let callbackErrorLog = null;

    try {
      const bResponse = await fetch(shadowTx.callback_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-signature': signature,
          'x-timestamp': timestamp,
        },
        body: stringifiedPayload,
      });

      if (bResponse.ok) {
        callbackSuccessful = true;
      } else {
        callbackErrorLog = `Platform B returned HTTP ${bResponse.status}`;
      }
    } catch (bError: any) {
      console.error(`Network error reaching Platform B for timeout sync: ${bError.message}`);
      callbackErrorLog = bError.message;
    }

    // 4. Update the shadow ledger LAST
    // This securely records whether Platform B actually received the failure notice.
    await supabaseAdmin
      .from('secondary_request_shadow')
      .update({ 
        status: 'failed', 
        callback_synced: callbackSuccessful,
        error_log: callbackErrorLog || 'M-Pesa system timeout',
        updated_at: new Date().toISOString() 
      })
      .eq('id', shadowTx.id);

    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  } catch (error: any) {
    console.error('B2C Timeout Webhook Fatal Error:', error);
    // Returning 500 forces Daraja to retry the timeout notification
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
