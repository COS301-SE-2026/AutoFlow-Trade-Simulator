import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Navbar } from '../components/navbar';
import { AuthProvider } from '../context/AuthContext';
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import {AccountProvider} from "@/lib/hooks/accountContext";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "AutoFlow Trade Simulator",
  description: "Local-first starter for the AutoFlow trading simulator stack.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body>
        <AuthProvider>
          <AccountProvider>
            <Navbar />
            {children}
          </AccountProvider>
        </AuthProvider>
      </body>
    </html>
  );
}