import type { Metadata } from "next";
import { Outfit, DM_Serif_Display } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";
import { ToastProvider } from "@/components/ui/Toast";

const outfit = Outfit({ 
  subsets: ["latin"],
  variable: "--font-outfit",
});

const dmSerif = DM_Serif_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-dm-serif",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Aura — Capturing the Essence of You",
  description:
    "AI-powered photo sharing for every occasion. Find and deliver photos instantly using premium facial recognition technology.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${outfit.variable} ${dmSerif.variable}`}>
      <body className={outfit.className} suppressHydrationWarning>
        <ToastProvider>
          <AuthProvider>{children}</AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
