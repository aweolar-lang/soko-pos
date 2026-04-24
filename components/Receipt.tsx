"use client";

import { useRef, useState } from "react";
import { Printer, Download, Store, Loader2 } from "lucide-react";
import html2canvas from "html2canvas";

interface ReceiptProps {
  storeName: string;
  reference: string;
  date: string;
  items: { name: string; qty: number; price: number }[];
  total: number;
  currency?: string;
}

export default function Receipt({
  storeName,
  reference,
  date,
  items,
  total,
  currency = "KES",
}: ReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // --- 1. THE WHATSAPP DOWNLOAD LOGIC ---
  const handleDownloadImage = async () => {
    if (!receiptRef.current) return;
    setIsDownloading(true);

    try {
      // Take a high-quality snapshot of the receipt div
      const canvas = await html2canvas(receiptRef.current, { scale: 2 });
      const image = canvas.toDataURL("image/png");

      // Create a fake link to trigger the download
      const link = document.createElement("a");
      link.href = image;
      link.download = `Receipt_${reference}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Failed to generate receipt image", error);
    } finally {
      setIsDownloading(false);
    }
  };

  // --- 2. THE THERMAL PRINTER LOGIC ---
  const handlePrint = () => {
    window.print();
  };

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);

  return (
    <div className="flex flex-col items-center gap-6">
      
      {/* THE RECEIPT TICKET 
        We use font-mono for that classic POS terminal look.
      */}
      <div
        ref={receiptRef}
        className="w-full max-w-[320px] bg-white text-slate-900 p-6 shadow-xl border border-slate-200 print:shadow-none print:border-none print:max-w-full font-mono text-sm relative"
      >
        {/* Zig-zag top edge (optional design flair) */}
        <div className="absolute -top-1 left-0 right-0 h-2 bg-[url('/zigzag.png')] bg-repeat-x print:hidden opacity-20"></div>

        {/* Header */}
        <div className="text-center flex flex-col items-center mb-6">
          <div className="h-10 w-10 bg-slate-900 text-white rounded-full flex items-center justify-center mb-2 print:border print:border-black print:bg-white print:text-black">
            <Store className="h-5 w-5" />
          </div>
          <h2 className="font-bold text-lg uppercase">{storeName}</h2>
          <p className="text-xs text-slate-500 print:text-black mt-1">Thank you for your purchase!</p>
        </div>

        <div className="border-b-2 border-dashed border-slate-300 print:border-black mb-4"></div>

        {/* Meta Data */}
        <div className="mb-4 text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-500 print:text-black">Ref:</span>
            <span className="font-bold">{reference}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 print:text-black">Date:</span>
            <span>{date}</span>
          </div>
        </div>

        <div className="border-b-2 border-dashed border-slate-300 print:border-black mb-4"></div>

        {/* Items List */}
        <div className="mb-4 space-y-3">
          <div className="flex justify-between text-xs font-bold uppercase mb-2">
            <span>Item</span>
            <span>Total</span>
          </div>
          {items.map((item, idx) => (
            <div key={idx} className="flex justify-between text-xs">
              <div className="flex flex-col">
                <span className="font-bold truncate max-w-[160px]">{item.name}</span>
                <span className="text-slate-500 print:text-black text-[10px]">
                  {item.qty} x {formatPrice(item.price)}
                </span>
              </div>
              <span className="font-bold">{formatPrice(item.price * item.qty)}</span>
            </div>
          ))}
        </div>

        <div className="border-b-2 border-dashed border-slate-300 print:border-black mb-4"></div>

        {/* Total */}
        <div className="flex justify-between items-center text-lg font-black mb-6">
          <span>TOTAL</span>
          <span>{formatPrice(total)}</span>
        </div>

        {/* Footer */}
        <div className="text-center text-[10px] text-slate-400 print:text-black uppercase">
          <p>Powered by LocalSoko</p>
          <p>www.localsoko.com</p>
        </div>
      </div>

      {/* ACTION BUTTONS 
        Hidden during print using Tailwind's `print:hidden` utility 
      */}
      <div className="flex w-full max-w-[320px] gap-3 print:hidden">
        <button
          onClick={handlePrint}
          className="flex-1 flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl transition-all"
        >
          <Printer className="h-4 w-4" /> Print
        </button>
        
        <button
          onClick={handleDownloadImage}
          disabled={isDownloading}
          className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-xl transition-all disabled:opacity-70"
        >
          {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          WhatsApp
        </button>
      </div>

    </div>
  );
}