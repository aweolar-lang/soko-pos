import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { initiateB2C } from '@/lib/mpesa'; // The utility we just created

// Initialize Supabase Admin client with Service Role Key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    // 1. Get raw body for exact signature matching
    const rawBody = await req.text();
    
    // 2. Extract and Validate Security Headers
    const signature = req.headers.get('x-signature');
    const timestamp = req.headers.get('x-timestamp');

    if (!signature || !timestamp) {
      return NextResponse.json({ error: 'Missing security headers' }, { status: 401 });
    }

    // 3. Replay Attack Protection (5-minute window)
    const requestTime = parseInt(timestamp, 10);
    if (Date.now() - requestTime > 5 * 60 * 1000 || Date.now() - requestTime < 0) {
      return NextResponse.json({ error: 'Request expired or invalid timestamp' }, { status: 401 });
    }

    // 4. Verify HMAC Signature (Timing-safe)
    const secret = process.env.INTER_PLATFORM_SECRET!;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${timestamp}.${rawBody}`)
      .digest('hex');

    const isSignatureValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );

    if (!isSignatureValid) {
      console.error('CRITICAL: HMAC Signature mismatch.');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    // 5. Parse and Validate Payload
    const payload = JSON.parse(rawBody);
    const { secondary_tx_id, user_id, tx_type, amount, mpesa_number } = payload;

    if (!secondary_tx_id || !user_id || !tx_type || !amount || !mpesa_number) {
      return NextResponse.json({ error: 'Malformed payload data. Missing required fields.' }, { status: 400 });
    }

    // 6. Idempotent Database Insertion (Shadow Ledger)
    const { data: shadowData, error: dbError } = await supabaseAdmin
      .from('secondary_request_shadow')
      .insert({
        secondary_tx_id,
        user_id,
        tx_type,
        amount,
        payload_hash: signature,
        status: 'pending_mpesa'
      })
      .select('id')
      .single();

    if (dbError) {
      if (dbError.code === '23505') { 
        // Postgres unique violation: We already received this transaction ID.
        return NextResponse.json({ message: 'Transaction already being processed' }, { status: 409 });
      }
      throw new Error(`Database insert failed: ${dbError.message}`);
    }

    // 7. Trigger M-Pesa B2C API
    try {
      // Pass the shadowData.id as the Occasion parameter so Safaricom returns it in the webhook
      const mpesaResponse = await initiateB2C(amount, mpesa_number, shadowData.id);
      
      // M-Pesa accepted the request. It is now in Safaricom's queue.
      // We will await the final status in the Webhook Receiver.
      return NextResponse.json({ 
        success: true, 
        message: 'Transaction verified and sent to M-Pesa queue.',
        shadow_id: shadowData.id,
        mpesa_conversation_id: mpesaResponse.ConversationID
      });

    } catch (mpesaError: any) {
      // 8. Handle Immediate M-Pesa Failure (e.g., Invalid Number, Insufficient Till Balance)
      console.error('M-Pesa Initiation Failed:', mpesaError);

      // Rollback the status in the shadow ledger so it doesn't stay 'pending' forever
      await supabaseAdmin
        .from('secondary_request_shadow')
        .update({ 
          status: 'failed', 
          // Storing a custom error column if we added one, otherwise update timestamp
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
