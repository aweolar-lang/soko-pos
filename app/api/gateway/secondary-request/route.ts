import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyPlatformBRequest } from '@/lib/security';
import { initiateB2C } from '@/lib/mpesa';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    // 1. Get raw body for cryptographic signature matching
    const rawBody = await req.text();
    
    // 2. Extract Security Headers
    const signature = req.headers.get('x-signature');
    const timestamp = req.headers.get('x-timestamp');
    const secret = process.env.INTER_PLATFORM_SECRET!;

    // 3. Verify Signature & Timing
    const securityCheck = verifyPlatformBRequest(rawBody, signature, timestamp, secret);
    if (!securityCheck.isValid) {
      console.error('B2C Security Check Failed:', securityCheck.error);
      return NextResponse.json({ error: securityCheck.error }, { status: 403 });
    }

    // 4. Parse Payload
    const payload = JSON.parse(rawBody);
    const { 
      secondary_tx_id, 
      user_id, 
      tx_type, 
      amount, 
      mpesa_number, 
      callback_url,
      metadata
    } = payload;

    // Validate required fields explicitly
    if (!secondary_tx_id || !user_id || !tx_type || !amount || !mpesa_number || !callback_url) {
      return NextResponse.json({ error: 'Missing required payload fields' }, { status: 400 });
    }

    if (tx_type !== 'withdrawal') {
      return NextResponse.json({ error: 'Invalid tx_type for this endpoint' }, { status: 400 });
    }

    // 5. Idempotent Shadow Ledger Insertion
    const { data: shadowData, error: dbError } = await supabaseAdmin
      .from('secondary_request_shadow')
      .insert({
        secondary_tx_id,
        user_id,
        tx_type,
        amount,
        payload_hash: signature,
        callback_url,
        // We inject the user_id into metadata so it is passed back to Platform B seamlessly
        metadata: { ...metadata, user_id, mpesa_number },
        status: 'pending_mpesa'
      })
      .select('id')
      .single();

    if (dbError) {
      if (dbError.code === '23505') { 
        // Postgres unique violation: We already received this transaction ID.
        return NextResponse.json({ 
          error: 'Withdrawal transaction already being processed',
          secondary_tx_id 
        }, { status: 409 });
      }
      throw new Error(`Shadow Ledger Insert Failed: ${dbError.message}`);
    }

    // 6. Trigger M-Pesa B2C API
    try {
      // Pass the shadowData.id as the Occasion parameter so Safaricom returns it in the webhook
      const mpesaResponse = await initiateB2C(amount, mpesa_number, shadowData.id);
      
        // 7. Update Shadow Ledger with Safaricom's Tracking ID
        // B2C uses ConversationID as the primary identifier
      const { error: updateError } = await supabaseAdmin
        .from('secondary_request_shadow')
        .update({ 
          mpesa_tracking_id: mpesaResponse.ConversationID 
        })
        .eq('id', shadowData.id);

      if (updateError) {
        // CRITICAL: M-Pesa queued the withdrawal, but DB update failed.
        console.error(`🚨 CRITICAL B2C DESYNC: Failed to save ConversationID ${mpesaResponse.ConversationID} for Shadow ID ${shadowData.id}. Error: ${updateError.message}`);
      }

      // 8. Return success to Platform B
      return NextResponse.json({ 
        success: true, 
        message: 'Withdrawal queued successfully by M-Pesa',
        mpesa_tracking_id: mpesaResponse.ConversationID 
      });

    } catch (mpesaError: any) {
      // 9. Handle Immediate M-Pesa Failure (e.g., Insufficient Till Balance)
      console.error('M-Pesa B2C Initiation Failed:', mpesaError.message);

      await supabaseAdmin
        .from('secondary_request_shadow')
        .update({ 
          status: 'failed',
          error_log: mpesaError.message || 'B2C rejected by Safaricom'
        })
        .eq('id', shadowData.id);

      return NextResponse.json({ 
        error: 'Safaricom M-Pesa API rejected the B2C request', 
        details: mpesaError.message 
      }, { status: 502 });
      
    }

  } catch (error: any) {
    console.error('B2C Gateway Fatal Error:', error);
    return NextResponse.json({ error: 'Internal gateway server error' }, { status: 500 });
  }
}
