import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin client using the Service Role Key for server-to-server auth
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    // 1. Get raw body text for exact signature matching. 
    // Do NOT use req.json() here, as parsing and re-stringifying can alter the format and break the hash.
    const rawBody = await req.text();
    
    // 2. Extract Security Headers
    const signature = req.headers.get('x-signature');
    const timestamp = req.headers.get('x-timestamp');

    if (!signature || !timestamp) {
      return NextResponse.json({ error: 'Missing security headers' }, { status: 401 });
    }

    // 3. Replay Attack Protection (Reject requests older than 5 minutes)
    const requestTime = parseInt(timestamp, 10);
    const timeDifference = Date.now() - requestTime;
    
    if (timeDifference > 5 * 60 * 1000 || timeDifference < 0) {
      return NextResponse.json({ error: 'Request expired or invalid timestamp' }, { status: 401 });
    }

    // 4. Verify the HMAC Signature
    const secret = process.env.INTER_PLATFORM_SECRET!;
    const dataToVerify = `${timestamp}.${rawBody}`;
    
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(dataToVerify)
      .digest('hex');

    // Use crypto.timingSafeEqual to prevent timing attacks
    const isSignatureValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );

    if (!isSignatureValid) {
      console.error('CRITICAL: Signature mismatch detected.');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    // 5. Signature is valid! Safe to parse the payload
    const payload = JSON.parse(rawBody);
    const { secondary_tx_id, user_id, tx_type, amount } = payload;

    if (!secondary_tx_id || !user_id || !tx_type || !amount) {
      return NextResponse.json({ error: 'Malformed payload data' }, { status: 400 });
    }

    // 6. Insert the validated request into the Shadow Ledger
    const { data: shadowData, error: dbError } = await supabaseAdmin
      .from('secondary_request_shadow')
      .insert({
        secondary_tx_id: secondary_tx_id,
        user_id: user_id,
        tx_type: tx_type,
        amount: amount,
        payload_hash: signature, // Storing the valid signature as proof of authenticity
        status: 'pending_mpesa'
      })
      .select('id')
      .single();

    if (dbError) {
      // If the secondary_tx_id already exists, it means the Secondary platform retried a request we already have.
      if (dbError.code === '23505') { // Postgres unique violation code
        return NextResponse.json({ error: 'Duplicate transaction request' }, { status: 409 });
      }
      console.error('Shadow insertion error:', dbError);
      return NextResponse.json({ error: 'Database error on main hub' }, { status: 500 });
    }

    // 7. Success! Acknowledge receipt to the Secondary Platform
    return NextResponse.json({ 
      success: true, 
      message: 'Payload verified and securely logged.',
      shadow_id: shadowData.id 
    });

  } catch (error) {
    console.error('Gateway Receiver Error:', error);
    return NextResponse.json({ error: 'Internal gateway error' }, { status: 500 });
  }
}
