import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  // 1. Security Check: Ensure this is only triggered by your Cron provider
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 2. Fetch unprocessed webhook logs older than 5 minutes
    // The 5-minute buffer prevents us from processing webhooks that are currently running.
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const { data: unprocessedLogs, error: fetchError } = await supabaseAdmin
      .from('mpesa_webhook_logs')
      .select('*')
      .eq('processing_status', 'unprocessed')
      .lte('created_at', fiveMinutesAgo)
      .limit(30);

    if (fetchError) {
      throw new Error(`Failed to fetch unprocessed logs: ${fetchError.message}`);
    }

    if (!unprocessedLogs || unprocessedLogs.length === 0) {
      return NextResponse.json({ message: 'No pending reconciliations' });
    }

    let successCount = 0;
    let errorCount = 0;

    // 3. Process each orphaned log
    for (const log of unprocessedLogs) {
      try {
        const payload = log.raw_payload;
        let isSuccess = false;
        let finalStatus = 'failed';
        let description = '';

        // Safely extract data based on transaction type
        if (log.transaction_type === 'stk_push') {
          isSuccess = payload?.Body?.stkCallback?.ResultCode === 0;
          finalStatus = isSuccess ? 'completed' : 'failed';
          description = 'M-Pesa STK Push Settlement (Reconciled)';
        } else if (log.transaction_type === 'b2c_result') {
          isSuccess = payload?.Result?.ResultCode === 0;
          finalStatus = isSuccess ? 'completed' : 'failed';
          description = 'M-Pesa B2C Withdrawal (Reconciled)';
        } else if (log.transaction_type === 'b2c_timeout') {
          isSuccess = false;
          finalStatus = 'failed';
          description = 'M-Pesa B2C Timeout (Reconciled)';
        }

        // Locate the shadow transaction
        const { data: shadowTx } = await supabaseAdmin
          .from('secondary_request_shadow')
          .select('*')
          .eq('mpesa_tracking_id', log.mpesa_tracking_id)
          .single();

        if (!shadowTx) {
          // If there's no shadow transaction, mark log as orphaned so we stop retrying it
          await supabaseAdmin
            .from('mpesa_webhook_logs')
            .update({ processing_status: 'orphaned' })
            .eq('id', log.id);
          continue;
        }

        // Process Ledger Update only if not already completed
        if (isSuccess && shadowTx.status !== 'completed') {
          const { error: ledgerError } = await supabaseAdmin.from('core_wallet_ledger').insert({
            user_id: shadowTx.user_id, 
            amount: shadowTx.amount,
            tx_type: shadowTx.tx_type, 
            shadow_request_id: shadowTx.id,
            description: description
          });

          if (ledgerError) throw new Error(`Ledger insertion failed: ${ledgerError.message}`);
        }

        // Update the shadow ledger. 
        // Note: callback_synced stays false so the other cron job notifies Platform B!
        if (shadowTx.status !== 'completed') {
          await supabaseAdmin
            .from('secondary_request_shadow')
            .update({ 
              status: finalStatus,
              mpesa_receipt: log.mpesa_receipt_number,
              updated_at: new Date().toISOString()
            })
            .eq('id', shadowTx.id);
        }

        // Mark the log as safely processed
        await supabaseAdmin
          .from('mpesa_webhook_logs')
          .update({ processing_status: 'processed' })
          .eq('id', log.id);

        successCount++;
      } catch (err: any) {
        console.error(`Reconciliation failed for log ${log.id}:`, err.message);
        errorCount++;
      }
    }

    return NextResponse.json({
      message: 'Reconciliation sweep complete',
      processed: unprocessedLogs.length,
      successes: successCount,
      errors: errorCount
    });

  } catch (error: any) {
    console.error('Reconciliation Cron Error:', error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}