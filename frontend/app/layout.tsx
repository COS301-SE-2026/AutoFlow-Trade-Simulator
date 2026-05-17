import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Navbar } from '../components/navbar';
import "./globals.css";

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
    <html lang="en">
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  );
}