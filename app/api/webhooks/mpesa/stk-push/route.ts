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

   // 3. Process Ledger Update (Must succeed before continuing)
    if (isSuccess && shadowTx.status !== 'completed') {
      const { error: ledgerError } = await supabaseAdmin.from('core_wallet_ledger').insert({
        user_id: shadowTx.user_id || 'UNKNOWN_SYSTEM_ORPHAN', // Fixed column reference
        amount: shadowTx.amount,
        tx_type: shadowTx.tx_type, 
        shadow_request_id: shadowTx.id,
        description: `M-Pesa STK Push Settlement - Ref: ${shadowTx.metadata?.account_reference || 'N/A'}`
      });

      if (ledgerError) {
        console.error('CRITICAL: Failed to write to core_wallet_ledger:', ledgerError);
        // Throwing forces a 500 response. Daraja will keep the webhook in its retry queue.
        throw new Error('Database transaction failed. Forcing Daraja retry.');
      }
    }

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
      console.error(`Network error reaching Platform B: ${bError.message}`);
      callbackErrorLog = bError.message;
    }

    // 5. Commit Final State to Shadow Ledger
    await supabaseAdmin
      .from('secondary_request_shadow')
      .update({ 
        status: finalStatus,
        mpesa_receipt: receiptNumber,
        callback_synced: callbackSuccessful,
        error_log: callbackErrorLog,
        updated_at: new Date().toISOString()
      })
      .eq('id', shadowTx.id);

    // 6. Acknowledge to Safaricom
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });

  } catch (error: any) {
    console.error('STK Push Webhook Fatal Error:', error);
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted with errors" });
  }
}
