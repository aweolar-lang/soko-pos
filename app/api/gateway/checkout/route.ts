import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyPlatformBRequest } from '@/lib/security';
import { initiateStkPush } from '@/lib/mpesa';

// Initialize Supabase Admin client with Service Role Key for secure DB access
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    // 1. Get raw body for exact cryptographic signature matching
    const rawBody = await req.text();
    
    // 2. Extract Security Headers
    const signature = req.headers.get('x-signature');
    const timestamp = req.headers.get('x-timestamp');
    const secret = process.env.INTER_PLATFORM_SECRET!;

    // 3. Verify Signature & Timing
    const securityCheck = verifyPlatformBRequest(rawBody, signature, timestamp, secret);
    if (!securityCheck.isValid) {
      console.error('Security Check Failed:', securityCheck.error);
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
      phone_number, 
      user_id,
      amount, 
      tx_type, 
      account_reference, 
      callback_url, 
      metadata 
    } = payload;

    const actualUserId = user_id || metadata?.user_id;

    if (!actualUserId) {
      return NextResponse.json({ error: 'Missing user_id.' }, { status: 400 });
    }

    // Validate required fields explicitly
    if (!secondary_tx_id || !phone_number || amount === undefined || amount === null || !tx_type || !account_reference || !callback_url) {
      return NextResponse.json({ error: 'Missing required payload fields.' }, { status: 400 });
    }

    // Validate amount is positive and numeric (matches DB check constraint)
    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return NextResponse.json({ error: 'Amount must be a positive number greater than 0.' }, { status: 400 });
    }

    // 5. Idempotent Shadow Ledger Insertion
    // We insert BEFORE hitting M-Pesa. Status defaults to 'pending_mpesa'.
    const { data: shadowData, error: dbError } = await supabaseAdmin
      .from('secondary_request_shadow')
      .insert({
        secondary_tx_id,
        user_id: actualUserId,
        tx_type,
        amount: numericAmount,
        payload_hash: signature, // Storing signature as an audit trail
        callback_url,
        metadata,
        status: 'pending_mpesa'
      })
      .select('id')
      .single();

    if (dbError) {
      // Postgres error check 1: Duplicate secondary_tx_id (Unique constraint violation)
      if (dbError.code === '23505') { 
        return NextResponse.json({ 
          error: 'Transaction already being processed',
          secondary_tx_id 
        }, { status: 409 });
      }

      // Postgres error check 2: Malformed UUID string format
      if (dbError.code === '22P02') {
        return NextResponse.json({
          error: 'Invalid UUID format provided for user_id or secondary_tx_id.',
          details: dbError.message
        }, { status: 400 });
      }

      // Postgres error check 3: Check constraint violation (e.g., amount <= 0)
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

    // 6. Trigger M-Pesa STK Push
    try {
      const mpesaResponse = await initiateStkPush(numericAmount, phone_number, account_reference);

      // 7. Update Shadow Ledger with M-Pesa Tracking ID
      const { error: updateError } = await supabaseAdmin
        .from('secondary_request_shadow')
        .update({ mpesa_tracking_id: mpesaResponse.CheckoutRequestID })
        .eq('id', shadowData.id);

      if (updateError) {
        console.error(`CRITICAL: Failed to save CheckoutRequestID ${mpesaResponse.CheckoutRequestID} for Shadow ID ${shadowData.id}. Error: ${updateError.message}`);
      }

      // 8. Return success to Platform B
      return NextResponse.json({ 
        success: true, 
        message: 'STK Push initiated successfully',
        mpesa_tracking_id: mpesaResponse.CheckoutRequestID 
      });

    } catch (mpesaError: any) {
      console.error('M-Pesa STK Push Failed:', mpesaError.message);

      // Rollback status so it doesn't stay 'pending_mpesa' forever
      await supabaseAdmin
        .from('secondary_request_shadow')
        .update({ 
          status: 'failed',
          error_log: mpesaError.message || 'STK Push rejected by Safaricom'
        })
        .eq('id', shadowData.id);

      return NextResponse.json({ 
        error: 'Safaricom M-Pesa API rejected the request', 
        details: mpesaError.message 
      }, { status: 502 });
    }

  } catch (error: any) {
    console.error('Gateway Receiver Fatal Error:', error);
    return NextResponse.json({ error: 'Internal gateway server error' }, { status: 500 });
  }
}