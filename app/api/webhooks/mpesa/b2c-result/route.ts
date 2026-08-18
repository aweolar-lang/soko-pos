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
    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ ResultCode: 1, ResultDesc: "Rejected: Invalid JSON payload" });
    }

    // 1. Safaricom B2C Result Payload Structure
    const result = payload?.Result;
    if (!result) {
      console.error('Invalid B2C Webhook Payload:', rawBody);
      return NextResponse.json({ ResultCode: 1, ResultDesc: "Rejected: Malformed payload" });
    }

    const { 
      ResultCode, 
      ResultDesc, 
      ConversationID, 
      TransactionID 
    } = result;

    // ResultCode 0 means the money successfully left your till and hit the user's phone.
    const isSuccess = ResultCode === 0;
    const finalStatus = isSuccess ? 'completed' : 'failed';

    // 2. Log the raw webhook matching mpesa_webhook_logs schema
    const { data: logData } = await supabaseAdmin
      .from('mpesa_webhook_logs')
      .insert({
        transaction_type: 'b2c_result',
        mpesa_tracking_id: ConversationID,
        mpesa_receipt_number: TransactionID || null,
        raw_payload: payload,
        processing_status: 'unprocessed'
      })
      .select('id')
      .single();

    // 3. Find the original transaction in the shadow ledger
    const { data: shadowTx, error: fetchError } = await supabaseAdmin
      .from('secondary_request_shadow')
      .select('*')
      .eq('mpesa_tracking_id', ConversationID)
      .single();

    if (fetchError || !shadowTx) {
      console.warn(`B2C Transaction not found for ConversationID: ${ConversationID}`);
      // Return success to Safaricom so they clear it from their retry queue
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted but shadow record not found" });
    }

    // 4. Process Ledger Update (Idempotent execution using shadowTx.user_id)
    if (isSuccess && shadowTx.status !== 'completed') {
      const { error: ledgerError } = await supabaseAdmin.from('core_wallet_ledger').insert({
        user_id: shadowTx.user_id, // Valid UUID guaranteed by secondary schema
        amount: shadowTx.amount, // DB should handle this as a deduction based on tx_type='withdrawal'
        tx_type: shadowTx.tx_type, 
        shadow_request_id: shadowTx.id,
        description: `M-Pesa B2C Withdrawal - Phone: ${shadowTx.metadata?.mpesa_number || 'N/A'}`
      });

      if (ledgerError) {
        console.error('CRITICAL: Failed to write B2C deduction to core_wallet_ledger:', ledgerError);
        // Throwing forces a 500 response. Daraja will keep the webhook in its retry queue.
        throw new Error(`Database transaction failed: ${ledgerError.message}`);
      }
    }

    // 5. Build and Sign the payload to send back to Platform B
    const platformBPayload = {
      secondary_tx_id: shadowTx.secondary_tx_id,
      status: finalStatus,
      receipt_number: TransactionID || null, // e.g., QWE123RTY
      message: ResultDesc,
      metadata: shadowTx.metadata 
    };

    const secret = process.env.INTER_PLATFORM_SECRET!;
    const { signature, timestamp, stringifiedPayload } = signOutgoingPayload(platformBPayload, secret);

    let callbackSuccessful = false;
    let callbackErrorLog: string | null = null;

    // 6. Push the result to Platform B
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
      console.error(`Network error reaching Platform B for B2C sync: ${bError.message}`);
      callbackErrorLog = bError.message;
    }

    // 7. Commit Final State to Shadow Ledger
    await supabaseAdmin
      .from('secondary_request_shadow')
      .update({ 
        status: finalStatus,
        mpesa_receipt: TransactionID || null,
        callback_synced: callbackSuccessful,
        error_log: callbackErrorLog,
        updated_at: new Date().toISOString()
      })
      .eq('id', shadowTx.id);

    // 8. Update Webhook Log Processing Status
    if (logData?.id) {
      await supabaseAdmin
        .from('mpesa_webhook_logs')
        .update({ processing_status: 'processed' })
        .eq('id', logData.id);
    }

    // 9. Acknowledge receipt to Safaricom
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });

  } catch (error: any) {
    console.error('B2C Result Webhook Fatal Error:', error);
    // Returning 500 forces Safaricom to retry. DO NOT return ResultCode 0 on fatal app errors.
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}