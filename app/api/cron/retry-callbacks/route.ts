import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { signOutgoingPayload } from '@/lib/security';

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
    // 2. Fetch pending retries (Limit to 50 per run to prevent timeouts)
    // We only want records that are definitively completed or failed, but not synced.
    const { data: unsyncedTx, error: fetchError } = await supabaseAdmin
      .from('secondary_request_shadow')
      .select('*')
      .in('status', ['completed', 'failed'])
      .eq('callback_synced', false)
      .limit(50);

    if (fetchError) {
      throw new Error(`Failed to fetch unsynced transactions: ${fetchError.message}`);
    }

    if (!unsyncedTx || unsyncedTx.length === 0) {
      return NextResponse.json({ message: 'No pending callbacks to process' });
    }

    let successCount = 0;
    let failCount = 0;
    const secret = process.env.INTER_PLATFORM_SECRET!;

    // 3. Process each unsynced transaction
    for (const tx of unsyncedTx) {
      const platformBPayload = {
        secondary_tx_id: tx.secondary_tx_id,
        status: tx.status,
        receipt_number: tx.mpesa_receipt,
        message: tx.status === 'completed' ? 'Settled (Delayed Sync)' : 'Failed (Delayed Sync)',
        metadata: tx.metadata
      };

      const { signature, timestamp, stringifiedPayload } = signOutgoingPayload(platformBPayload, secret);
      
      let callbackSuccessful = false;
      let callbackErrorLog: string | null = null;

      try {
        const bResponse = await fetch(tx.callback_url, {
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
          successCount++;
        } else {
          callbackErrorLog = `Retry failed: Platform B returned HTTP ${bResponse.status}`;
          failCount++;
        }
      } catch (bError: any) {
        callbackErrorLog = `Retry network error: ${bError.message}`;
        failCount++;
      }

      // 4. Update the shadow record with the retry attempt result
      await supabaseAdmin
        .from('secondary_request_shadow')
        .update({
          callback_synced: callbackSuccessful,
          error_log: callbackErrorLog,
          updated_at: new Date().toISOString()
        })
        .eq('id', tx.id);
    }

    return NextResponse.json({
      message: 'Retry sweep complete',
      processed: unsyncedTx.length,
      successes: successCount,
      failures: failCount
    });

  } catch (error: any) {
    console.error('Callback Retry Cron Error:', error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}