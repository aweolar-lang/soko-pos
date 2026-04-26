import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { ArrowLeft, AlertCircle, ShieldAlert, Store, User, DollarSign, CheckCircle2 } from "lucide-react";
import { resolveDispute } from "../../../actions"; 
import SubmitButton from "../../../components/SubmitButton";

// Secure Server Client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function DisputeDetailsPage({ params }: { params: { id: string } }) {
  // 1. Fetch the exact dispute using the ID from the URL
  const { data: dispute, error } = await supabaseAdmin
    .from('disputes')
    .select(`
      *,
      stores ( name, paystack_subaccount_code ),
      orders ( customer_name, customer_email, payment_method, created_at )
    `)
    .eq('id', params.id)
    .single();

  if (error || !dispute) {
    return (
      <div className="p-10 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Dispute not found.</h1>
        <Link href="/admin/dashboard/disputes" className="text-emerald-600 font-bold mt-4 inline-block hover:underline">
          &larr; Back to Disputes
        </Link>
      </div>
    );
  }

  // 2. Prepare our Server Actions with the specific Paystack dispute ID
  // Note: Paystack requires their own ID to resolve it, which is stored in the metadata webhook payload
  const paystackDisputeId = dispute.metadata?.id?.toString(); 
  const amountDisputed = Number(dispute.amount);

  // We "bind" the action so the form automatically passes these arguments securely
  const acceptDisputeAction = resolveDispute.bind(null, paystackDisputeId, "merchant-accepted", "Accepted by admin", amountDisputed);
  const declineDisputeAction = resolveDispute.bind(null, paystackDisputeId, "declined", "Service was provided properly");

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8">
      
      {/* Navigation & Header */}
      <div>
        <Link href="/admin/dashboard/disputes" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to all disputes
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
              Dispute Details
              {dispute.status === 'resolved' ? (
                <span className="text-xs px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full flex items-center gap-1 font-bold">
                  <CheckCircle2 className="h-3 w-3" /> RESOLVED
                </span>
              ) : (
                <span className="text-xs px-3 py-1 bg-red-100 text-red-700 rounded-full flex items-center gap-1 font-bold">
                  <AlertCircle className="h-3 w-3 animate-pulse" /> ACTION REQUIRED
                </span>
              )}
            </h1>
            <p className="text-slate-500 font-medium mt-1 font-mono text-sm">Ref: {dispute.transaction_reference}</p>
          </div>
          
          <div className="text-right bg-white px-6 py-3 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Disputed Amount</p>
            <p className="text-2xl font-black text-red-600">Ksh {amountDisputed.toLocaleString()}</p>
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
            <li><p className="text-xs text-slate-400 font-bold uppercase">Name</p><p className="font-medium text-slate-900">{dispute.orders?.customer_name || "Unknown"}</p></li>
            {/* @ts-ignore */}
            <li><p className="text-xs text-slate-400 font-bold uppercase">Email</p><p className="font-medium text-slate-900">{dispute.orders?.customer_email || "N/A"}</p></li>
            {/* @ts-ignore */}
            <li><p className="text-xs text-slate-400 font-bold uppercase">Payment Method</p><p className="font-medium text-slate-900">{dispute.orders?.payment_method || "Online"}</p></li>
          </ul>
        </div>

        {/* Store Info */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-emerald-50 rounded-xl"><Store className="h-5 w-5 text-emerald-600" /></div>
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Merchant Details</h2>
          </div>
          <ul className="space-y-4">
            {/* @ts-ignore */}
            <li><p className="text-xs text-slate-400 font-bold uppercase">Store Name</p><p className="font-medium text-slate-900">{dispute.stores?.name || "Platform Direct"}</p></li>
            {/* @ts-ignore */}
            <li><p className="text-xs text-slate-400 font-bold uppercase">Subaccount Code</p><p className="font-medium font-mono text-slate-900">{dispute.stores?.paystack_subaccount_code || "N/A"}</p></li>
          </ul>
        </div>
      </div>

      {/* The Dispute Reason */}
      <div className="bg-red-50 p-6 rounded-3xl border border-red-100">
        <h3 className="text-sm font-bold text-red-600 uppercase tracking-wider mb-2 flex items-center gap-2">
          <ShieldAlert className="h-4 w-4" /> Bank Reason for Dispute
        </h3>
        <p className="text-slate-900 font-medium text-lg leading-relaxed">
          "{dispute.reason || "No specific reason was provided by the customer's bank."}"
        </p>
      </div>

        {/* ACTION PANEL */}
        {dispute.status !== 'resolved' && (
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm mt-8">
            <h2 className="text-xl font-black text-slate-900 mb-2">Resolution Center</h2>
            <p className="text-slate-500 font-medium mb-8">
            How would you like to handle this chargeback?
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
            {/* Form 1: Accept the Dispute */}
            <form 
                action={async () => {
                "use server";
                await acceptDisputeAction();
                }} 
                className="w-full"
            >
                <SubmitButton 
                text="Accept Dispute (Refund Buyer)" 
                loadingText="Processing Refund" 
                variant="success" 
                />
            </form>

            {/* Form 2: Decline the Dispute */}
            <form 
                action={async () => {
                "use server";
                await declineDisputeAction();
                }} 
                className="w-full"
            >
                <SubmitButton 
                text="Decline Dispute (Fight Chargeback)" 
                loadingText="Submitting Rejection" 
                variant="danger" 
                />
            </form>
            </div>
        </div>
        )}
    </div>
  );
}