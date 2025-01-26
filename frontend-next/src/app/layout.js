"use client";
import "./globals.css";
import AppWalletProvider from "@/components/AppWalletProvider";
import Navbar from "@/components/Navbar";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Toaster } from "sonner";
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen">
        <AppWalletProvider>
          <Toaster />
          <Navbar />
          <main className="flex-grow">{children}</main>
        </AppWalletProvider>
      </body>
    </html>
  );
}
