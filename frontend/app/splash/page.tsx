'use client';

import Image from 'next/image';
import { Zap, ArrowRight, History, BookOpen, Shield, Triangle, ChartLine, BrainCircuit } from 'lucide-react';

interface SplashPageProps {
    onGetStarted: () => void;
    onLogin: () => void;
}

export default function SplashPage({ onGetStarted, onLogin }: SplashPageProps) {
    return (
        <>
        <div className='size-full bg-[var(--background)] overflow-auto'>
            <div className='mx-auto px-6 py-4 flex items-center justify-space'>
                <div className='w-10 h-10 rounded-lg flex flex-items-center justify-center'>
                    <Image
                        src='/logo.svg'
                        alt='Autoflow'
                        width={24}
                        height={24}
                        className='2-6 h-6'
                    />
                </div>
                <h1 className='text-2xl font-bold'>AutoFlow</h1>
            </div>
            <div className='flex items-center gap-3 m-2'>
                <button
                    onClick={onLogin}
                    className='px-6 py-2 hover:bg-blur-md border rounded-xl border-[var(--border)] hover:border-[var(--blue)]'
                >
                    Sign In
                </button>
                <button
                    onClick={onGetStarted}
                    className='px-6 py-2 hover:bg-blur-md border rounded-xl border-[var(--border)] hover:border-[var(--blue)]'
                >
                    Sign Up
                </button>
            </div>

            <div className='mx-auto px-6 py-24'>
                <div className='text-center mx-auto'>
                    <div className='inline-flex items-center gap-2 px-4 py-2 bg-[var(--blue)]/20 border border-[var(--blue)]/30 rounded-full text-[var(--blue)] text-sm font-medium mb-6'>
                        <Zap className='w-4 h-4' />
                        AI-Powered Educational Trading Platfrom
                    </div>
                    <h2 className='text-5xl md:text-6xl font-bold text-white mb-6'>
                        Master the markets with
                        <span className='bg-gradient-to-r from-[var(--blue)] to-[var(--purple)] bg-clip-text text-transparent'> Confidence</span>
                    </h2>
                    <p>
                        Learn trading strategies, understand options Greeks, and replay historical market events all in a risk-free environment designed to build real skills.
                    </p>
                    <div className='flex items-center justify-center gap-4 mt-4'>
                        <button
                            onClick={onGetStarted}
                            className='group px-8 py-4 bg-gradient-to-r from-[var(--blue)] to-[var(--purple)] text-white rounded-full font-medium flex items-center gap-2'
                        >
                            Start Learning Free
                            <ArrowRight className='w-4 h-4 group-hover:translate-x-1 transition-transform' />
                        </button>
                        <button className='px-8 py-4 bg-gradient-to-r from-[var(--blue)] to-[var(--purple)] text-white rounded-full font-medium'>
                            View Features
                        </button>
                    </div>
                </div>
            </div>

            <div className='max-w-7xl mx-auto px-6 py-20'>
                <div className='text-center mb-16'>
                    <h3 className='text-3xl font-bold text-white mb-4'>Everything You Need To Learn Trading</h3>
                    <p className='text-lg'>Powerful educational tools designed for aspiring traders</p>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <div>
                        <History className='w-6 h-6' />
                        <h4>Historical Replay</h4>
                        <p>
                            Replay real events like the COVID crash, NVIDIA AI Surge, and more. Trade them day-by-day and see how well you'd perform.
                        </p>
                    </div>

                    <div>
                        <BookOpen className='w-6 h-6' />
                        <h4>Strategy Library</h4>
                        <p>
                            Learn proven strategies from dollar-cost averaging to iron condors. Step-by-step guides with pros and cons.
                        </p>
                    </div>

                    <div>
                        <Shield className='w-6 h-6' />
                        <h4>Risk-Free Practice</h4>
                        <p>
                            Practice with virtual money in a sandbox environment. Build confidence before risking real capital.
                        </p>
                    </div>

                    <div>
                        <Triangle className='w-6 h-6' />
                        <h4>Options Greeks</h4>
                        <p>
                            Master Delta, Gamma, Theta, Vega, and Rho with interactice charts and real-world examples.
                        </p>
                    </div>

                    <div>
                        <ChartLine className='w-6 h-6' />
                        <h4>Live Charts</h4>
                        <p>
                            Watch the price unfold with real-time charts. See how your trades would have performed.
                        </p>
                    </div>

                    <div>
                        <BrainCircuit className='w-6 h-6' />
                        <h4>AI Insights</h4>
                        <p>
                            Get intelligent feedback on your trading decisions and learn from your mistakes with AI-powered analysis.
                        </p>
                    </div>
                </div>
            </div>

        </div>
        </>
    )
}