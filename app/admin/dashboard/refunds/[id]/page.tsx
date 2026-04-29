import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { 
  ArrowLeft, 
  Store, 
  User, 
  CheckCircle2, 
  XCircle, 
  RefreshCcw,
  Receipt,
  CreditCard,
  Clock
} from "lucide-react";

// Secure Server Client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Note: Using Promise<{ id: string }> for Next.js 15 compatibility
export default async function RefundDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  
  // 1. Await the params to unlock the ID!
  const resolvedParams = await params;

  // 2. Fetch the exact refund and linked data using the resolved ID
  const { data: refund, error } = await supabaseAdmin
    .from('refunds')
    .select(`
      *,
      stores ( name, paystack_subaccount_code ),
      orders ( customer_name, customer_email, payment_method )
    `)
    .eq('id', resolvedParams.id)
    .single();

  if (error || !refund) {
    return (
      <div className="p-10 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Refund not found.</h1>
        <Link href="/admin/dashboard/refunds" className="text-emerald-600 font-bold mt-4 inline-block hover:underline">
          &larr; Back to Refunds
        </Link>
      </div>
    );
  }

  // Formatting helpers
  const tDate = new Date(refund.created_at).toLocaleString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
  });
  const refundAmount = Number(refund.amount || 0);

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8">
      
      {/* Navigation & Header */}
      <div>
        <Link href="/admin/dashboard/refunds" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to all refunds
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
              Refund Details
              {refund.status === 'processed' ? (
                <span className="text-xs px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full flex items-center gap-1 font-bold tracking-wider uppercase">
                  <CheckCircle2 className="h-3 w-3" /> Processed
                </span>
              ) : refund.status === 'failed' ? (
                <span className="text-xs px-3 py-1 bg-red-100 text-red-700 rounded-full flex items-center gap-1 font-bold tracking-wider uppercase">
                  <XCircle className="h-3 w-3" /> Failed
                </span>
              ) : (
                <span className="text-xs px-3 py-1 bg-orange-100 text-orange-700 rounded-full flex items-center gap-1 font-bold tracking-wider uppercase">
                  <Clock className="h-3 w-3" /> Pending
                </span>
              )}
            </h1>
            <p className="text-slate-500 font-medium mt-1 font-mono text-sm">Ref: {refund.transaction_reference || refund.id}</p>
          </div>
          
          <div className="text-right bg-white px-6 py-3 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Refund Amount</p>
            <p className="text-2xl font-black text-slate-900">Ksh {refundAmount.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Refund Reason Banner */}
      {refund.reason && (
        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 flex items-start gap-4">
          <div className="p-3 bg-white border border-slate-100 shadow-sm rounded-xl shrink-0">
            <RefreshCcw className="h-6 w-6 text-slate-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Reason for Refund</h2>
            <p className="text-slate-900 font-medium">"{refund.reason}"</p>
          </div>
        </div>
      )}

      {/* Information Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Customer Info */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-50 rounded-xl"><User className="h-5 w-5 text-blue-600" /></div>
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Customer Details</h2>
          </div>
          <ul className="space-y-4">
            {/* @ts-ignore */}
            <li><p className="text-xs text-slate-400 font-bold uppercase">Name</p><p className="font-medium text-slate-900">{refund.orders?.customer_name || "Unknown"}</p></li>
            {/* @ts-ignore */}
            <li><p className="text-xs text-slate-400 font-bold uppercase">Email</p><p className="font-medium text-slate-900">{refund.orders?.customer_email || "N/A"}</p></li>
            {/* @ts-ignore */}
            <li><p className="text-xs text-slate-400 font-bold uppercase">Original Payment Method</p><p className="font-medium text-slate-900 capitalize flex items-center gap-2"><CreditCard className="h-4 w-4 text-slate-400" /> {refund.orders?.payment_method || "Card/Mobile Money"}</p></li>
          </ul>
        </div>

        {/* Store Info */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-indigo-50 rounded-xl"><Store className="h-5 w-5 text-indigo-600" /></div>
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Merchant Details</h2>
          </div>
          <ul className="space-y-4">
            {/* @ts-ignore */}
            <li><p className="text-xs text-slate-400 font-bold uppercase">Store Name</p><p className="font-medium text-slate-900">{refund.stores?.name || "Platform Direct"}</p></li>
            {/* @ts-ignore */}
            <li><p className="text-xs text-slate-400 font-bold uppercase">Subaccount Code</p><p className="font-medium font-mono text-slate-900">{refund.stores?.paystack_subaccount_code || "Main Account"}</p></li>
            <li><p className="text-xs text-slate-400 font-bold uppercase">Initiated On</p><p className="font-medium text-slate-900">{tDate}</p></li>
          </ul>
        </div>
      </div>

      {/* Status Footer */}
      <div className="mt-8 text-center bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        {refund.status === 'processed' ? (
          <>
            <Receipt className="h-8 w-8 text-emerald-400 mx-auto mb-3" />
            <h3 className="text-lg font-black text-slate-900">Funds Returned</h3>
            <p className="text-slate-500 font-medium text-sm mt-1 max-w-md mx-auto">
              This refund has been successfully processed. The funds have been returned to the customer's original payment method.
            </p>
          </>
        ) : (
           <>
            <Clock className="h-8 w-8 text-orange-400 mx-auto mb-3" />
            <h3 className="text-lg font-black text-slate-900">Processing Refund</h3>
            <p className="text-slate-500 font-medium text-sm mt-1 max-w-md mx-auto">
              This refund is currently being processed by the payment gateway. Depending on the bank, it may take 3-5 business days to reflect in the customer's account.
            </p>
          </>
        )}
      </div>

    </div>
  );
}