'use client';

import Image from 'next/image';
import { Zap, ArrowRight, History, BookOpen, Shield, Triangle, ChartLine, BrainCircuit } from 'lucide-react';
import Link from 'next/link';

const features = [
    {
        icon: History,
        title: 'Historical Replay',
        body: "Replay real events like the COVID crash, NVIDIA AI Surge, and more. Trade them day-by-day and see how well you'd perform.",
        span: '',
    },
    {
        icon: BookOpen,
        title: 'Strategy Library',
        body: 'Learn proven strategies from dollar-cost averaging to iron condors. Step-by-step guides with pros and cons.',
        image: '/help/strategylist.png',
        span: 'md:col-span-2 md:row-span-2',
    },
    {
        icon: Shield,
        title: 'Risk-Free Practice',
        body: 'Practice with virtual money in a sandbox environment. Build confidence before risking real capital.',
        span: '',
    },
    {
        icon: Triangle,
        title: 'Options Greeks',
        body: 'Master Delta, Gamma, Theta, Vega, and Rho with interactive charts and real-world examples.',
        image: '/help/greeks.png',
        span: 'md:col-span-2',
    },
    {
        icon: ChartLine,
        title: 'Live Charts',
        body: 'Watch the price unfold with real-time charts. See how your trades would have performed.',
        span: '',
    },
    {
        icon: BrainCircuit,
        title: 'Multiplayer Mode',
        body: 'Test your skills against fellow traders in exciting 1v1 pertured scenarios.',
        span: 'md:col-span-3',
        wide: true,
    },
];

const stats = [
    { value: '4+', label: 'Active Learners' },
    { value: '10+', label: 'Trading Strategies' },
    { value: '5+', label: 'Historical Events' },
    { value: 'No', label: 'Cost to Start' },
];

const primaryCta =
    'group inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[var(--blue)] px-6 py-3.5 text-[15px] font-semibold text-white transition-[background-color,transform] hover:bg-[#2385d1] active:scale-[0.98]';
const secondaryCta =
    'inline-flex items-center justify-center whitespace-nowrap rounded-xl border border-white/15 px-6 py-3.5 text-[15px] font-semibold text-white transition-[background-color,border-color,transform] hover:border-white/30 hover:bg-white/[0.05] active:scale-[0.98]';

export default function SplashPage() {
    return (
        <div className="blurred-animated-bg relative">
            <div className="size-full overflow-auto bg-[var(--background-glass)] backdrop-blur-md">
                <nav aria-label="Main" className="sticky top-0 z-50 border-b border-[var(--border)] bg-[rgba(8,8,15,0.82)] backdrop-blur-xl">
                    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 md:px-6">
                        <div className="flex items-center gap-2.5">
                            <Image src="/logo.svg" alt="Autoflow" width={26} height={26} />
                            <p className="text-lg font-semibold tracking-tight">AutoFlow</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Link
                                href="/login"
                                className="rounded-lg px-4 py-2 text-sm font-medium text-white/75 transition-colors hover:bg-white/[0.06] hover:text-white"
                            >
                                Sign In
                            </Link>
                            <Link
                                href="/signup"
                                className="rounded-lg bg-white/[0.08] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/[0.14]"
                            >
                                Sign Up
                            </Link>
                        </div>
                    </div>
                </nav>

                <section className="mx-auto grid max-w-7xl items-center gap-12 px-4 pt-16 pb-20 md:px-6 lg:grid-cols-[1fr_1.15fr] lg:pt-24">
                    <div className="max-w-xl">
                        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[rgba(28,117,188,0.4)] bg-[rgba(28,117,188,0.1)] px-3.5 py-1.5 text-[13px] font-medium text-[#6fb4ea]">
                            <Zap aria-hidden="true" className="h-3.5 w-3.5" />
                            AI-Powered Educational Trading Platform
                        </div>
                        <h1 className="mb-5 text-4xl font-semibold leading-[1.05] tracking-tight text-white md:text-5xl lg:text-6xl">
                            Master the markets with <span className="text-[#6fb4ea]">Confidence</span>
                        </h1>
                        <p className="mb-8 max-w-[52ch] text-[17px] leading-relaxed text-white/65">
                            Learn trading strategies, understand options Greeks, and replay historical market events all in a risk-free environment designed to build real skills.
                        </p>
                        <div className="flex flex-wrap items-center gap-3">
                            <Link href="/signup" className={primaryCta}>
                                Start Learning For Free
                                <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                            </Link>
                            <button
                                type="button"
                                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                                className={secondaryCta}
                            >
                                View Features
                            </button>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#1b1b22] shadow-[0_30px_80px_-20px_rgba(28,117,188,0.35)]">
                            <Image
                                src="/help/dashboard.png"
                                alt="The AutoFlow dashboard showing top movers and an AAPL price chart"
                                width={1721}
                                height={994}
                                priority
                                className="h-auto w-full"
                            />
                        </div>
                    </div>
                </section>

                <section id="features" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-20 md:px-6">
                    <div className="mb-12 max-w-2xl">
                        <h2 className="mb-3 text-3xl font-semibold tracking-tight text-white md:text-4xl">Everything You Need To Learn Trading</h2>
                        <p className="text-lg text-white/60">Powerful educational tools designed for aspiring traders</p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:auto-rows-[minmax(190px,auto)] md:grid-flow-dense">
                        {features.map(({ icon: Icon, title, body, image, span, wide }) => (
                            <article
                                key={title}
                                className={`group relative flex flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[rgba(14,14,22,0.85)] transition-colors hover:border-[rgba(28,117,188,0.45)] ${span} ${
                                    wide ? 'md:flex-row md:items-center' : ''
                                }`}
                            >
                                <div className={`relative z-10 p-6 ${wide ? 'md:max-w-[60%]' : ''}`}>
                                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(28,117,188,0.12)] text-[#6fb4ea]">
                                        <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={1.75} />
                                    </div>
                                    <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
                                    <p className="max-w-[48ch] text-[15px] leading-relaxed text-white/60">{body}</p>
                                </div>
                                {image && (
                                    <div className="relative mt-auto min-h-[160px] flex-1 overflow-hidden">
                                        <Image
                                            src={image}
                                            alt=""
                                            fill
                                            sizes="(min-width: 768px) 66vw, 100vw"
                                            className="object-cover object-left-top opacity-80 transition-[opacity,transform] duration-500 group-hover:scale-[1.02] group-hover:opacity-100"
                                        />
                                        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[rgba(14,14,22,0.2)] via-transparent to-[rgba(14,14,22,0.95)]" />
                                    </div>
                                )}
                                {wide && (
                                    <div
                                        aria-hidden="true"
                                        className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(ellipse_at_right,rgba(28,117,188,0.22),transparent_65%)] md:block"
                                    />
                                )}
                            </article>
                        ))}
                    </div>
                </section>

                <section aria-label="AutoFlow in numbers" className="border-y border-[var(--border)] bg-[rgba(8,8,15,0.7)]">
                    <dl className="mx-auto grid max-w-7xl grid-cols-2 gap-y-10 px-4 py-14 md:grid-cols-4 md:px-6">
                        {stats.map(({ value, label }) => (
                            <div key={label} className="flex flex-col-reverse gap-1 md:border-l md:border-[var(--border)] md:pl-6 md:first:border-l-0 md:first:pl-0">
                                <dt className="text-sm text-white/55">{label}</dt>
                                <dd className="tabular text-4xl font-semibold tracking-tight text-white">{value}</dd>
                            </div>
                        ))}
                    </dl>
                </section>

                <section className="mx-auto max-w-7xl px-4 py-24 md:px-6">
                    <div className="relative overflow-hidden rounded-3xl border border-[rgba(28,117,188,0.3)] bg-gradient-to-r from-[rgba(28,117,188,0.28)] to-[rgba(20,20,32,0.9)] px-6 py-14 md:px-14">
                        <div className="max-w-2xl">
                            <h2 className="mb-4 text-3xl font-semibold tracking-tight text-white md:text-4xl">Ready To Start Your Trading Journey?</h2>
                            <p className="mb-8 text-lg text-white/70">
                                Join thousands of learners who are mastering the markets with AutoFlow&apos;s risk-free trading simulations.
                            </p>
                            <div className="flex flex-wrap items-center gap-3">
                                <Link href="/signup" className={primaryCta}>
                                    Create Your Free Account
                                </Link>
                                <Link href="/login" className={secondaryCta}>
                                    Sign In
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                <footer className="border-t border-[var(--border)] bg-[var(--background-glass)]">
                    <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 md:flex-row md:px-6">
                        <div className="flex items-center gap-3 text-sm text-white/55">
                            <Image src="/logo.svg" alt="" width={20} height={20} />
                            <span>© 2026 AutoFlow. All rights reserved.</span>
                        </div>
                        <div className="flex gap-6 text-sm text-white/55">
                            <button type="button" className="transition-colors hover:text-white">Terms</button>
                            <button type="button" className="transition-colors hover:text-white">Privacy</button>
                            <button type="button" className="transition-colors hover:text-white">Support</button>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
}
