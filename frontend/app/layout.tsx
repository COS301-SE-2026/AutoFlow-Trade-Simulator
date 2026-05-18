import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Navbar } from '../components/navbar';
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

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
        <Navbar />
        {children}
      </body>
    </html>
  );
}