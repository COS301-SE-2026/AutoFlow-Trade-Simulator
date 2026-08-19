"use client"

import { SignupForm } from "@/components/signup-form"
import { GalleryVerticalEndIcon } from "lucide-react"
import Image from "next/image"
export default function SignupPage() {
  return (
    <div className="grid min-h-svh">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="/" className="flex items-center gap-2 font-medium">
            <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Image src='/logo.svg' alt='Autoflow' width={24} height={24} className='w-6 w-6' />
            </div>
            Autoflow
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <SignupForm />
          </div>
        </div>
      </div>
    </div>
  )
}
