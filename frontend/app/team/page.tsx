import Link from "next/link";
import {
    ExternalLink,
    ArrowUpRight
} from "lucide-react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import Image from "next/image";

function GithubIcon({className = "w-4 h-4"}: { className?: string }) {
    return (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24">
            <path
                d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
        </svg>
    );
}

export default function TeamPage() {
    return (
        <div
            className="min-h-screen bg-canvas text-white font-sans flex flex-col justify-between selection:bg-emerald selection:text-canvas">

            <header
                className="w-full border-b border-borderDark/80 bg-canvas/90 backdrop-blur-md sticky top-0 z-50 py-4 px-6">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Image src="/logo.svg" alt="" width={28} height={28} className="rounded-md"/>
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
                            LAUNCH APP <ArrowUpRight className="ml-1 w-3.5 h-3.5 stroke-[2.5]"/>
                        </Link>
                    </Button>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-10 flex-grow w-full">

                <Card className="bg-card-surface border-borderDark relative overflow-hidden mb-10 shadow-2xl">
                    <div
                        className="absolute -right-20 -top-20 w-64 h-64 bg-emerald/10 rounded-full blur-3xl pointer-events-none"/>
                    <CardHeader className="p-6 sm:p-8 pb-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Badge
                                variant="outline"
                                className="border-emerald/30 bg-emerald/10 text-emerald font-mono text-xs px-3 py-1 font-semibold rounded-full"
                            >
                                EPI-USE CAPSTONE PROJECT 2026
                            </Badge>
                        </div>
                        <CardTitle className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                            Meet Team CDT
                        </CardTitle>
                        <CardDescription className="text-greyText text-base max-w-2xl leading-relaxed mt-2">
                            Building a real-time financial market simulator powered by live multi-asset ingestion,
                            deterministic historical replay engines, and quantitative options analytics.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="p-6 sm:p-8 pt-0">
                        <div className="flex flex-wrap gap-3">
                            <Button asChild
                                    className="bg-emerald hover:bg-emerald-dark text-canvas font-bold text-sm rounded-xl">
                                <Link href="https://www.autoflowtradingsimulator.co.za" target="_blank">
                                    Live Trading Platform <ExternalLink className="ml-2 w-4 h-4"/>
                                </Link>
                            </Button>
                            <Button asChild variant="outline"
                                    className="border-borderDark bg-canvas hover:bg-canvas/80 text-white hover:text-emerald hover:border-emerald/50 rounded-xl font-medium text-sm">
                                <Link href="https://github.com/COS301-SE-2026/AutoFlow-Trade-Simulator" target="_blank">
                                    <GithubIcon className="mr-2 w-4 h-4 text-white"/> GitHub Repository
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>

            </main>

            <footer
                className="w-full border-t border-borderDark/80 py-6 text-center text-xs text-greyText font-mono bg-canvas">
                <p>© 2026 Team CDT · Built for EPI-USE & University of Pretoria COS 301 Capstone</p>
            </footer>

        </div>
    );
}