import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner"; // 1. Import the Toaster
import Footer from "@/components/Footer"; // Import the Footer component
import Navbar from "@/components/Navbar";


const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SokoPOS | Point of Sale & Online Store",
  description: "Run your entire shop from your phone.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navbar />
        {children}
        {/* 2. Add it right before the closing body tag */}
        <Toaster richColors position="top-center" /> 
        <Footer />
      </body>
    </html>
  );
}