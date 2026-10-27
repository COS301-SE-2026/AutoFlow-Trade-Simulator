import Link from "next/link";
import {
    ExternalLink,
    Users,
    ArrowUpRight
} from "lucide-react";
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
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

function LinkedinIcon({className = "w-4 h-4"}: { className?: string }) {
    return (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24">
            <path
                d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
        </svg>
    );
}

interface TeamMember {
    name: string;
    role: string;
    bio: string;
    github: string;
    linkedin: string;
}

const teamMembers: TeamMember[] = [
    {
        name: "Michael Neto",
        role: "Full-Stack Developer",
        bio: "Information & Knowledge Systems student with focus on UX design & full-stack integration.",
        github: "https://github.com/u24641342",
        linkedin: "https://www.linkedin.com/in/michael-neto-0211563b9/",
    },
    {
        name: "Dillon Kung",
        role: "Backend Developer",
        bio: "Computer Science student specializing in trading transaction logic and database architecture.",
        github: "https://github.com/u24614582",
        linkedin: "https://www.linkedin.com/in/dillon-kung/",
    },
    {
        name: "Caitanya Singh",
        role: "Backend Developer",
        bio: "Focused on high-concurrency ingestion services, API provider adapters, and load performance.",
        github: "https://github.com/u24603199",
        linkedin: "https://www.linkedin.com/in/caitanya-krpa-narain-singh-4316393b6/",
    },
    {
        name: "Grant Nel",
        role: "Full-Stack Developer",
        bio: "Computer Science student focused on financial market simulation, LCG engines, and system devops.",
        github: "https://github.com/u24574547",
        linkedin: "https://www.linkedin.com/in/grant-nel-72a0573b5",
    },
    {
        name: "Finnley Wyllie",
        role: "Software Engineer",
        bio: "Final-year Computer Science student specializing in backend software engineering & cloud infrastructure.",
        github: "https://github.com/Finn-Wyll",
        linkedin: "https://za.linkedin.com/in/finnley-wyllie-1b24972a7",
    },
];

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

                <div className="flex items-center justify-between mb-6 border-b border-borderDark pb-3">
                    <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-emerald"/>
                        <h2 className="text-xl font-bold tracking-tight text-white">Software Engineering Team</h2>
                    </div>
                    <span className="text-xs font-mono font-bold text-greyText bg-card-surface px-2.5 py-1 rounded-md border border-borderDark">
                        5 DEVELOPERS
                    </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {teamMembers.map((member) => (
                        <Card
                            key={member.name}
                            className="bg-card-surface border-borderDark hover:border-emerald/40 transition-all duration-300 flex flex-col justify-between shadow-lg hover:shadow-xl hover:shadow-emerald/5"
                        >
                            <CardHeader className="p-5 pb-3">
                                <div className="flex items-center justify-between">
                                    <Badge
                                        className="bg-emerald/10 text-emerald border-none font-mono text-[10px] uppercase font-bold px-2 py-0.5 tracking-wider">
                                        {member.role}
                                    </Badge>
                                </div>
                                <CardTitle className="text-lg font-bold text-white mt-3">
                                    {member.name}
                                </CardTitle>
                                <CardDescription className="text-xs text-greyText leading-relaxed mt-1">
                                    {member.bio}
                                </CardDescription>
                            </CardHeader>

                            <CardFooter className="p-5 pt-3 border-t border-borderDark/60 flex gap-2">
                                <Button
                                    asChild
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 bg-canvas border-borderDark hover:border-emerald text-greyText hover:text-emerald font-mono text-xs"
                                >
                                    <Link href={member.github} target="_blank">
                                        <GithubIcon className="w-3.5 h-3.5 mr-1.5"/> GitHub
                                    </Link>
                                </Button>
                                <Button
                                    asChild
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 bg-canvas border-borderDark hover:border-emerald text-greyText hover:text-emerald font-mono text-xs"
                                >
                                    <Link href={member.linkedin} target="_blank">
                                        <LinkedinIcon className="w-3.5 h-3.5 mr-1.5 text-[#2b6cb0]"/> LinkedIn
                                    </Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </main>

            <footer
                className="w-full border-t border-borderDark/80 py-6 text-center text-xs text-greyText font-mono bg-canvas">
                <p>© 2026 Team CDT · Built for EPI-USE & University of Pretoria COS 301 Capstone</p>
            </footer>

        </div>
    );
}