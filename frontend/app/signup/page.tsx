"use client"

import { SignupForm } from "@/components/signup-form"
import Image from "next/image"
import Link from "next/link"
export default function SignupPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link href="/" className="flex items-center gap-2.5 self-center rounded-lg text-lg font-semibold tracking-tight">
          <Image src='/logo.svg' alt='Autoflow' width={26} height={26} />
          Autoflow
        </Link>
        <SignupForm />
      </div>
    </div>
  )
}
