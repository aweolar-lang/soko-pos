import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner"; // 1. Import the Toaster
import Footer from "@/components/Footer"; // Import the Footer component
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

// --- UPGRADED: Mobile Viewport & Theme Color ---
export const viewport: Viewport = {
  themeColor: "#10b981", 
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

// --- UPGRADED: Enterprise Global SEO Metadata ---
export const metadata: Metadata = {
  metadataBase: new URL("https://localsoko.com"),
  title: {
    default: "LocalSoko | Point of Sale & Online Store",
    template: "%s | LocalSoko", 
  },
  description: "Run your entire shop from your phone. Discover local merchants, buy digital goods globally, and securely route payments.",
  keywords: ["e-commerce", "kenya marketplace", "SokoPOS", "digital downloads", "paystack", "mpesa", "african commerce", "point of sale"],
  authors: [{ name: "LocalSoko" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://localsoko.com",
    siteName: "LocalSoko",
    title: "LocalSoko | Borderless Commerce & SokoPOS",
    description: "Empowering independent merchants with instant global payouts and beautiful digital storefronts.",
    images: [
      {
        url: "/og-image.jpg", // You will drop a 1200x630 image in your /public folder
        width: 1200,
        height: 630,
        alt: "LocalSoko Platform Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LocalSoko | Borderless Commerce",
    description: "The ultimate digital storefront and POS for independent sellers.",
    images: ["/og-image.jpg"],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
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