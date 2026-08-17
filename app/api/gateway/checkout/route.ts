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

    // 4. Parse Payload
    const payload = JSON.parse(rawBody);
    const { 
      secondary_tx_id, 
      phone_number, 
      amount, 
      tx_type, 
      account_reference, 
      callback_url, 
      metadata 
    } = payload;

    // Validate required fields explicitly
    if (!secondary_tx_id || !phone_number || !amount || !tx_type || !account_reference || !callback_url) {
      return NextResponse.json({ error: 'Missing required payload fields' }, { status: 400 });
    }

    // 5. Idempotent Shadow Ledger Insertion
    // We insert BEFORE hitting M-Pesa. Status defaults to 'pending_mpesa'.
    const { data: shadowData, error: dbError } = await supabaseAdmin
      .from('secondary_request_shadow')
      .insert({
        secondary_tx_id,
        tx_type,
        amount,
        payload_hash: signature, // Storing the signature acts as an extra audit trail
        callback_url,
        metadata,
        status: 'pending_mpesa'
      })
      .select('id')
      .single();

    if (dbError) {
      if (dbError.code === '23505') { 
        // Postgres unique violation: Platform B retried an already existing request
        return NextResponse.json({ 
          error: 'Transaction already being processed',
          secondary_tx_id 
        }, { status: 409 });
      }
      throw new Error(`Shadow Ledger Insert Failed: ${dbError.message}`);
    }

    // 6. Trigger M-Pesa STK Push
    try {
      const mpesaResponse = await initiateStkPush(amount, phone_number, account_reference);
      
      // 7. Update Shadow Ledger with M-Pesa Tracking ID
      // This is crucial: We need this ID to match Safaricom's webhook later.
      await supabaseAdmin
        .from('secondary_request_shadow')
        .update({ 
          mpesa_tracking_id: mpesaResponse.CheckoutRequestID 
        })
        .eq('id', shadowData.id);

      // 8. Return success to Platform B
      return NextResponse.json({ 
        success: true, 
        message: 'STK Push initiated successfully',
        mpesa_tracking_id: mpesaResponse.CheckoutRequestID 
      });

    } catch (mpesaError: any) {
      console.error('M-Pesa STK Push Failed:', mpesaError.message);

      // Rollback the status so it doesn't stay 'pending' forever
      await supabaseAdmin
        .from('secondary_request_shadow')
        .update({ status: 'failed' })
        .eq('id', shadowData.id);

      return NextResponse.json({ 
        error: 'Safaricom M-Pesa API rejected the request', 
        details: mpesaError.message 
      }, { status: 502 }); // 502 Bad Gateway indicates the upstream (M-Pesa) failed
    }

  } catch (error: any) {
    console.error('Gateway Receiver Fatal Error:', error);
    return NextResponse.json({ error: 'Internal gateway server error' }, { status: 500 });
  }
}
