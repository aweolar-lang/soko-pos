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
      TransactionID,
      ReferenceData
    } = result;

    // ResultCode 0 means the money successfully left your till and hit the user's phone.
    const isSuccess = ResultCode === 0;
    const finalStatus = isSuccess ? 'completed' : 'failed';

    // 2. Log the raw webhook immediately for financial audit trails
    await supabaseAdmin.from('mpesa_webhook_logs').insert({
      tracking_id: ConversationID,
      raw_payload: payload,
      webhook_type: 'b2c_result'
    });

    // 3. Find the original transaction in the shadow ledger
    // We look it up using the ConversationID we saved during initiation
    const { data: shadowTx, error: fetchError } = await supabaseAdmin
      .from('secondary_request_shadow')
      .select('*')
      .eq('mpesa_tracking_id', ConversationID)
      .single();

    if (fetchError || !shadowTx) {
      console.error(`B2C Transaction not found for ConversationID: ${ConversationID}`);
      // Return success to Safaricom so they clear it from their retry queue
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted but not found" });
    }


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
    // 4. Update the Shadow Ledger Status
    await supabaseAdmin
      .from('secondary_request_shadow')
      .update({ 
        status: finalStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', shadowTx.id);

    // 5. Build and Sign the payload to send back to Platform B
    const platformBPayload = {
      secondary_tx_id: shadowTx.secondary_tx_id,
      status: finalStatus,
      receipt_number: TransactionID || null, // TransactionID is the M-Pesa Receipt Number (e.g., QWE123RTY)
      message: ResultDesc,
      metadata: shadowTx.metadata // Includes the user_id and mpesa_number we injected earlier
    };

    const secret = process.env.INTER_PLATFORM_SECRET!;
    const { signature, timestamp, stringifiedPayload } = signOutgoingPayload(platformBPayload, secret);

    // 6. Push the result to Platform B's callback URL
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

      if (!bResponse.ok) {
        console.error(`Platform B B2C Webhook Delivery Failed with status: ${bResponse.status}`);
      }
    } catch (bError: any) {
      console.error(`Network error reaching Platform B for B2C sync: ${bError.message}`);
    }

    // 7. Acknowledge receipt to Safaricom
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });

  } catch (error: any) {
    console.error('B2C Result Webhook Fatal Error:', error);
    // Tell Safaricom we got it to prevent queue clogging
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted with internal errors" });
  }
}
