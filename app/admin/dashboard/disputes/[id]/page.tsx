import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { 
  ArrowLeft, 
  ShieldAlert, 
  Store, 
  User, 
  CheckCircle2,
  AlertCircle,
  CreditCard
} from "lucide-react";
import { resolveDispute } from "../../../actions"; 
import SubmitButton from "../../../components/SubmitButton";

// Secure Server Client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// FIX 1: Update the type to Promise<{ id: string }> for Next.js 15 compatibility
export default async function DisputeDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  
  // FIX 2: Await the params to unlock the ID
  const resolvedParams = await params;

  // Fetch the exact dispute using the ID from the URL
  const { data: dispute, error } = await supabaseAdmin
    .from('disputes')
    .select(`
      *,
      stores ( name, paystack_subaccount_code ),
      orders ( customer_name, customer_email, payment_method, created_at )
    `)
    .eq('id', resolvedParams.id) // Use the awaited ID
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

  // Formatting helpers
  const tDate = new Date(dispute.created_at).toLocaleString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
  });
  const disputeAmount = Number(dispute.amount || 0);

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8">
      
      {/* HEADER */}
      <div>
        <Link href="/admin/dashboard/disputes" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to all disputes
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
              Dispute Details
              {dispute.status === 'resolved' ? (
                <span className="text-xs px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full flex items-center gap-1 font-bold tracking-wider uppercase">
                  <CheckCircle2 className="h-3 w-3" /> Resolved
                </span>
              ) : (
                <span className="text-xs px-3 py-1 bg-red-100 text-red-700 rounded-full flex items-center gap-1 font-bold tracking-wider uppercase">
                  <AlertCircle className="h-3 w-3" /> {dispute.status.replace('_', ' ')}
                </span>
              )}
            </h1>
            <p className="text-slate-500 font-medium mt-1 font-mono text-sm">Ref: {dispute.transaction_reference}</p>
          </div>
          
          <div className="text-right bg-white px-6 py-3 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Disputed Amount</p>
            <p className="text-2xl font-black text-red-600">Ksh {disputeAmount.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* DISPUTE REASON BANNER */}
      <div className="bg-red-50 p-6 rounded-3xl border border-red-100 flex items-start gap-4">
        <div className="p-3 bg-red-100 rounded-xl shrink-0">
          <ShieldAlert className="h-6 w-6 text-red-600" />
        </div>
        <div>
          <h2 className="text-lg font-black text-red-900 mb-1">Customer filed a chargeback</h2>
          <p className="text-red-700 font-medium text-sm">
            Reason: <span className="font-bold">"{dispute.reason || "Not provided by the customer's bank."}"</span>
          </p>
        </div>
      </div>

      {/* INFORMATION CARDS GRID (Restored from your original design) */}
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
            <li><p className="text-xs text-slate-400 font-bold uppercase">Dispute Date</p><p className="font-medium text-slate-900">{tDate}</p></li>
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
            <li><p className="text-xs text-slate-400 font-bold uppercase">Store Name</p><p className="font-medium text-slate-900">{dispute.stores?.name || "Platform Direct"}</p></li>
            {/* @ts-ignore */}
            <li><p className="text-xs text-slate-400 font-bold uppercase">Subaccount Code</p><p className="font-medium font-mono text-slate-900">{dispute.stores?.paystack_subaccount_code || "Main Account"}</p></li>
            {/* @ts-ignore */}
            <li><p className="text-xs text-slate-400 font-bold uppercase">Payment Channel</p><p className="font-medium text-slate-900 capitalize flex items-center gap-2"><CreditCard className="h-4 w-4 text-slate-400" /> {dispute.orders?.payment_method || "Card/Mobile Money"}</p></li>
          </ul>
        </div>
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
                // FIX 3: Correctly calling the action with the dispute ID and amount
                await resolveDispute(
                  dispute.id, 
                  "merchant-accepted", 
                  "Dispute accepted and refunded by platform admin.", 
                  disputeAmount
                );
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
                // FIX 4: Correctly calling the action to decline
                await resolveDispute(
                  dispute.id, 
                  "declined", 
                  "Dispute declined by platform admin."
                );
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