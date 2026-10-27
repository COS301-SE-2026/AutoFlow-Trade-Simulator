import Link from "next/link";
import {
    ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function TeamPage() {
    return (
        <div className="min-h-screen bg-canvas text-white font-sans flex flex-col justify-between selection:bg-emerald selection:text-canvas">

            <header className="w-full border-b border-borderDark/80 bg-canvas/90 backdrop-blur-md sticky top-0 z-50 py-4 px-6">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                            <Image src="/logo.svg" alt="" width={28} height={28} className="rounded-md" />
                        <div>
                            <h1 className="text-xl font-extrabold tracking-tight leading-none text-white">AutoFlow</h1>
                            <p className="text-[11px] text-greyText font-mono tracking-wider">TEAM CDT · COS 301</p>
                        </div>
                    </div>
                    <Button
                        asChild
                        className="bg-emerald hover:bg-emerald-dark text-canvas font-mono font-bold text-xs tracking-wide shadow-lg shadow-emerald/20"
                    >
                        <Link href="https://www.autoflowtradingsimulator.co.za" target="_blank">
                            LAUNCH APP <ArrowUpRight className="ml-1 w-3.5 h-3.5 stroke-[2.5]" />
                        </Link>
                    </Button>
                </div>
            </header>



        </div>
    );
}