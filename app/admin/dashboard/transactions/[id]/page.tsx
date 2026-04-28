import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { 
  ArrowLeft, 
  Store, 
  User, 
  CheckCircle2, 
  XCircle, 
  CreditCard,
  Receipt,
  RotateCcw
} from "lucide-react";
import { processRefund } from "../../../actions"; 
import SubmitButton from "../../../components/SubmitButton";

// Secure Server Client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
  // 1. Update the type to Promise<{ id: string }>
export default async function TransactionDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  
  // 2. Await the params to unlock the ID!
  const resolvedParams = await params;

  // 3. Fetch the exact transaction and linked data using the resolved ID
  const { data: transaction, error } = await supabaseAdmin
    .from('transactions')
    .select(`
      *,
      stores ( name, paystack_subaccount_code ),
      orders ( customer_name, customer_email )
    `)
    .eq('id', resolvedParams.id) // 4. Use resolvedParams.id here!
    .single();

  if (error || !transaction) {
    return (
      <div className="p-10 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Transaction not found.</h1>
        <Link href="/admin/dashboard/transactions" className="text-emerald-600 font-bold mt-4 inline-block hover:underline">
          &larr; Back to Money Flow
        </Link>
      </div>
    );
  }

  // 2. Prepare the Server Action for Refunding
  // We pass the transaction reference and the total amount to our secure Paystack function
  const transactionAmount = Number(transaction.amount);
  const issueRefundAction = processRefund.bind(null, transaction.reference, transactionAmount);

  // Formatting helpers
  const tDate = new Date(transaction.created_at).toLocaleString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
  });

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8">
      
      {/* Navigation & Header */}
      <div>
        <Link href="/admin/dashboard/transactions" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to all transactions
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
              Transaction Receipt
              {transaction.status === 'success' ? (
                <span className="text-xs px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full flex items-center gap-1 font-bold tracking-wider uppercase">
                  <CheckCircle2 className="h-3 w-3" /> Paid
                </span>
              ) : (
                <span className="text-xs px-3 py-1 bg-red-100 text-red-700 rounded-full flex items-center gap-1 font-bold tracking-wider uppercase">
                  <XCircle className="h-3 w-3" /> Failed
                </span>
              )}
            </h1>
            <p className="text-slate-500 font-medium mt-1 font-mono text-sm">Ref: {transaction.reference}</p>
          </div>
          
          <div className="text-right bg-white px-6 py-3 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Paid</p>
            <p className="text-2xl font-black text-emerald-600">Ksh {transactionAmount.toLocaleString()}</p>
          </div>
        </div>
      </div>

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
            <li><p className="text-xs text-slate-400 font-bold uppercase">Name</p><p className="font-medium text-slate-900">{transaction.orders?.customer_name || "Unknown"}</p></li>
            {/* @ts-ignore */}
            <li><p className="text-xs text-slate-400 font-bold uppercase">Email</p><p className="font-medium text-slate-900">{transaction.orders?.customer_email || "N/A"}</p></li>
            <li><p className="text-xs text-slate-400 font-bold uppercase">Date & Time</p><p className="font-medium text-slate-900">{tDate}</p></li>
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
            <li><p className="text-xs text-slate-400 font-bold uppercase">Store Name</p><p className="font-medium text-slate-900">{transaction.stores?.name || "Platform Direct"}</p></li>
            {/* @ts-ignore */}
            <li><p className="text-xs text-slate-400 font-bold uppercase">Subaccount Code</p><p className="font-medium font-mono text-slate-900">{transaction.stores?.paystack_subaccount_code || "Main Account"}</p></li>
            <li><p className="text-xs text-slate-400 font-bold uppercase">Payment Channel</p><p className="font-medium text-slate-900 capitalize flex items-center gap-2"><CreditCard className="h-4 w-4 text-slate-400" /> {transaction.channel || "Card/Mobile Money"}</p></li>
          </ul>
        </div>
      </div>

      {/* ACTION PANEL: REFUNDS */}
      {transaction.status === 'success' ? (
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm mt-8 border-t-4 border-t-orange-400">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-orange-50 rounded-xl hidden sm:block">
              <RotateCcw className="h-6 w-6 text-orange-500" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-black text-slate-900 mb-2">Issue a Refund</h2>
              <p className="text-slate-500 font-medium mb-6 text-sm">
                This will immediately pull <span className="font-bold text-slate-800">Ksh {transactionAmount.toLocaleString()}</span> back from the merchant and return it to the customer's original payment method. This action cannot be undone.
              </p>
              
              <form 
                action={async () => { 
                  // We wrap it to ignore the return value and satisfy TS
                  await issueRefundAction(); 
                }}
              >
                <SubmitButton 
                  text="Process Full Refund" 
                  loadingText="Reversing Payment" 
                  variant="secondary" 
                />
              </form>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 text-center mt-8">
          <Receipt className="h-8 w-8 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">This transaction was not successful, so no refund can be issued.</p>
        </div>
      )}

    </div>
  );
}