import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Security Check: Ensure Platform B is the one asking
    // We expect Platform B to send: Authorization: Bearer <INTER_PLATFORM_SECRET>
    const authHeader = req.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.INTER_PLATFORM_SECRET}`;
    
    if (!authHeader || authHeader !== expectedAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const secondaryTxId = params.id;

    if (!secondaryTxId) {
      return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 });
    }

    // 2. Fetch the transaction from the shadow ledger
    const { data: shadowTx, error: fetchError } = await supabaseAdmin
      .from('secondary_request_shadow')
      .select('secondary_tx_id, status, amount, tx_type, mpesa_receipt, error_log, metadata, created_at, updated_at')
      .eq('secondary_tx_id', secondaryTxId)
      .single();

    if (fetchError || !shadowTx) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // 3. Return the standardized state matching the webhook payload structure
    return NextResponse.json({
      secondary_tx_id: shadowTx.secondary_tx_id,
      status: shadowTx.status,
      tx_type: shadowTx.tx_type,
      amount: shadowTx.amount,
      receipt_number: shadowTx.mpesa_receipt,
      message: shadowTx.error_log || 'Status retrieved successfully',
      metadata: shadowTx.metadata,
      timestamps: {
        created_at: shadowTx.created_at,
        updated_at: shadowTx.updated_at
      }
    });

  } catch (error: any) {
    console.error('Status Polling API Fatal Error:', error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}