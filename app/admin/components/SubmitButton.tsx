"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

interface SubmitButtonProps {
  text: string;
  loadingText: string;
  variant?: "danger" | "success" | "secondary";
}

export default function SubmitButton({ text, loadingText, variant = "success" }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  const baseStyle = "flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all text-sm w-full sm:w-auto disabled:opacity-70 disabled:cursor-not-allowed";
  
  const variants = {
    success: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md",
    danger: "bg-red-600 hover:bg-red-700 text-white shadow-md",
    secondary: "bg-slate-800 hover:bg-slate-900 text-white shadow-md"
  };

  return (
    <button 
      type="submit" 
      disabled={pending}
      className={`${baseStyle} ${variants[variant]}`}
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" /> {loadingText}...
        </>
      ) : (
        text
      )}
    </button>
  );
}