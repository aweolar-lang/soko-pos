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

    // 4. Safely Parse Payload
    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload structure.' }, { status: 400 });
    }

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
    if (!secondary_tx_id || !user_id || !tx_type || amount === undefined || amount === null || !mpesa_number || !callback_url) {
      return NextResponse.json({ error: 'Missing required payload fields.' }, { status: 400 });
    }

    if (tx_type !== 'withdrawal') {
      return NextResponse.json({ error: 'Invalid tx_type for this endpoint. Expected "withdrawal".' }, { status: 400 });
    }

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return NextResponse.json({ error: 'Amount must be a positive number greater than 0.' }, { status: 400 });
    }

    // 5. Idempotent Shadow Ledger Insertion
    const { data: shadowData, error: dbError } = await supabaseAdmin
      .from('secondary_request_shadow')
      .insert({
        secondary_tx_id,
        user_id,
        tx_type,
        amount: numericAmount,
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
        // Postgres unique violation: Withdrawal already received
        return NextResponse.json({ 
          error: 'Withdrawal transaction already being processed',
          secondary_tx_id 
        }, { status: 409 });
      }

      if (dbError.code === '22P02') {
        return NextResponse.json({
          error: 'Invalid UUID format provided for user_id or secondary_tx_id.',
          details: dbError.message
        }, { status: 400 });
      }

      if (dbError.code === '23514') {
        return NextResponse.json({
          error: 'Database constraint violation.',
          details: dbError.message
        }, { status: 400 });
      }

      console.error('Shadow Ledger Insert Error:', dbError);
      return NextResponse.json({ error: `Shadow Ledger Insert Failed: ${dbError.message}` }, { status: 500 });
    }

    if (!shadowData || !shadowData.id) {
      return NextResponse.json({ error: 'Failed to initialize transaction record.' }, { status: 500 });
    }

    // 6. Trigger M-Pesa B2C API
    try {
      // Pass shadowData.id as the Occasion parameter so Safaricom returns it in the webhook
      const mpesaResponse = await initiateB2C(numericAmount, mpesa_number, shadowData.id);
      
      const trackingId = mpesaResponse.ConversationID || mpesaResponse.OriginatorConversationID;

      // 7. Update Shadow Ledger with Safaricom's Tracking ID
      const { error: updateError } = await supabaseAdmin
        .from('secondary_request_shadow')
        .update({ 
          mpesa_tracking_id: trackingId 
        })
        .eq('id', shadowData.id);

      if (updateError) {
        console.error(`🚨 CRITICAL B2C DESYNC: Failed to save ConversationID ${trackingId} for Shadow ID ${shadowData.id}. Error: ${updateError.message}`);
      }

      // 8. Return success to Platform B
      return NextResponse.json({ 
        success: true, 
        message: 'Withdrawal queued successfully by M-Pesa',
        mpesa_tracking_id: trackingId 
      });

    } catch (mpesaError: any) {
      console.error('M-Pesa B2C Initiation Failed:', mpesaError.message);

      if (shadowData?.id) {
        await supabaseAdmin
          .from('secondary_request_shadow')
          .update({ 
            status: 'failed',
            error_log: mpesaError.message || 'B2C rejected by Safaricom'
          })
          .eq('id', shadowData.id);
      }

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