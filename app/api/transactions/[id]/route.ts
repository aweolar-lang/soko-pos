import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { timingSafeEqual } from 'node:crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const interPlatformSecret = process.env.INTER_PLATFORM_SECRET;

if (!supabaseUrl) {
  throw new Error(
    'Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL'
  );
}

if (!supabaseServiceRoleKey) {
  throw new Error(
    'Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY'
  );
}

if (!interPlatformSecret) {
  throw new Error(
    'Missing required environment variable: INTER_PLATFORM_SECRET'
  );
}

const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceRoleKey
);

function safeCompare(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return timingSafeEqual(aBuffer, bBuffer);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authenticate the requesting platform.
    const authHeader = req.headers.get('authorization');
    const expectedAuth = `Bearer ${interPlatformSecret}`;

    if (!authHeader || !safeCompare(authHeader, expectedAuth)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Resolve the dynamic route parameter.
    const { id: secondaryTxId } = await params;

    if (!secondaryTxId?.trim()) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    // 3. Fetch the transaction from the shadow ledger.
    const { data: shadowTx, error: fetchError } = await supabaseAdmin
      .from('secondary_request_shadow')
      .select(
        'secondary_tx_id, status, amount, tx_type, mpesa_receipt, error_log, metadata, created_at, updated_at'
      )
      .eq('secondary_tx_id', secondaryTxId)
      .maybeSingle();

    if (fetchError) {
      console.error('Transaction lookup error:', fetchError);

      return NextResponse.json(
        { error: 'Failed to retrieve transaction status' },
        { status: 500 }
      );
    }

    if (!shadowTx) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // 4. Return the standardized transaction state.
    return NextResponse.json({
      secondary_tx_id: shadowTx.secondary_tx_id,
      status: shadowTx.status,
      tx_type: shadowTx.tx_type,
      amount: shadowTx.amount,
      receipt_number: shadowTx.mpesa_receipt,
      message: shadowTx.error_log ?? 'Status retrieved successfully',
      metadata: shadowTx.metadata,
      timestamps: {
        created_at: shadowTx.created_at,
        updated_at: shadowTx.updated_at,
      },
    });
  } catch (error: unknown) {
    console.error('Status Polling API Fatal Error:', error);

    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
