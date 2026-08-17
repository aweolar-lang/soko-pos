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

    const stkCallback = payload?.Body?.stkCallback;
    if (!stkCallback) {
      return NextResponse.json({ ResultCode: 1, ResultDesc: "Rejected: Malformed payload" });
    }

    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = stkCallback;
    const isSuccess = ResultCode === 0;
    const finalStatus = isSuccess ? 'completed' : 'failed';

    let receiptNumber = null;
    if (isSuccess && CallbackMetadata?.Item) {
      const receiptItem = CallbackMetadata.Item.find((item: any) => item.Name === 'MpesaReceiptNumber');
      receiptNumber = receiptItem ? receiptItem.Value : null;
    }

    // 1. Log the webhook event
    await supabaseAdmin.from('mpesa_webhook_logs').insert({
      tracking_id: CheckoutRequestID,
      raw_payload: payload,
      webhook_type: 'stk_push'
    });

    // 2. Locate the shadow transaction
    const { data: shadowTx, error: fetchError } = await supabaseAdmin
      .from('secondary_request_shadow')
      .select('*')
      .eq('mpesa_tracking_id', CheckoutRequestID)
      .single();

    if (fetchError || !shadowTx) {
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted but not found" });
    }

    // 3. Process Ledger and Shadow Updates
    if (isSuccess && shadowTx.status !== 'completed') {
      // For production safety, updating both tables should ideally be an RPC call for atomic transactions.
      // Doing it sequentially here: Ledger first, then shadow status.
      const { error: ledgerError } = await supabaseAdmin.from('core_wallet_ledger').insert({
        user_id: shadowTx.metadata?.user_id || 'PLATFORM_B_SYSTEM',
        amount: shadowTx.amount,
        tx_type: shadowTx.tx_type, // 'checkout' or 'subscription'
        shadow_request_id: shadowTx.id,
        description: `M-Pesa STK Push Settlement - Ref: ${shadowTx.metadata?.account_reference || 'N/A'}`
      });

      if (ledgerError) {
        console.error('CRITICAL: Failed to write to core_wallet_ledger:', ledgerError);
        // We do not stop execution. We must still notify Platform B and update the shadow table.
      }
    }

    await supabaseAdmin
      .from('secondary_request_shadow')
      .update({ 
        status: finalStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', shadowTx.id);

    // 4. Notify Platform B
    const platformBPayload = {
      secondary_tx_id: shadowTx.secondary_tx_id,
      status: finalStatus,
      receipt_number: receiptNumber,
      message: ResultDesc,
      metadata: shadowTx.metadata
    };

    const secret = process.env.INTER_PLATFORM_SECRET!;
    const { signature, timestamp, stringifiedPayload } = signOutgoingPayload(platformBPayload, secret);

    try {
      await fetch(shadowTx.callback_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-signature': signature,
          'x-timestamp': timestamp,
        },
        body: stringifiedPayload,
      });
    } catch (bError: any) {
      console.error(`Network error reaching Platform B: ${bError.message}`);
    }

    // 5. Acknowledge to Safaricom
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });

  } catch (error: any) {
    console.error('STK Push Webhook Fatal Error:', error);
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted with errors" });
  }
}
