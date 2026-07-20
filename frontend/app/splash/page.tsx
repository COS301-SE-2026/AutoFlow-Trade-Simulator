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
                    <div className='space-2 bg-[var(--background)] border border-[var(--border)] rounded-xl p-6 hover:border-[var(--blue)] transition-colors'>
                        <History className='w-6 h-6 text-[var(--blue)]' />
                        <h4 className='text-xl font-bold mt-2 mb-2'>Historical Replay</h4>
                        <p>
                            Replay real events like the COVID crash, NVIDIA AI Surge, and more. Trade them day-by-day and see how well you'd perform.
                        </p>
                    </div>

                    <div className='space-2 bg-[var(--background)] border border-[var(--border)] rounded-xl p-6 hover:border-[var(--purple)] transition-colors'>
                        <BookOpen className='w-6 h-6 text-[var(--purple)]' />
                        <h4 className='text-xl font-bold mt-2 mb-2'>Strategy Library</h4>
                        <p>
                            Learn proven strategies from dollar-cost averaging to iron condors. Step-by-step guides with pros and cons.
                        </p>
                    </div>

                    <div className='space-2 bg-[var(--background)] border border-[var(--border)] rounded-xl p-6 hover:border-[var(--green)] transition-colors'>
                        <Shield className='w-6 h-6 text-[var(--green)]' />
                        <h4 className='text-xl font-bold mt-2 mb-2'>Risk-Free Practice</h4>
                        <p>
                            Practice with virtual money in a sandbox environment. Build confidence before risking real capital.
                        </p>
                    </div>

                    <div className='space-2 bg-[var(--background)] border border-[var(--border)] rounded-xl p-6 hover:border-[var(--red)] transition-colors'>
                        <Triangle className='w-6 h-6 text-[var(--red)]' />
                        <h4 className='text-xl font-bold mt-2 mb-2'>Options Greeks</h4>
                        <p>
                            Master Delta, Gamma, Theta, Vega, and Rho with interactice charts and real-world examples.
                        </p>
                    </div>

                    <div className='space-2 bg-[var(--background)] border border-[var(--border)] rounded-xl p-6 hover:border-[var(--orange)] transition-colors'>
                        <ChartLine className='w-6 h-6 text-[var(--orange)]' />
                        <h4 className='text-xl font-bold mt-2 mb-2'>Live Charts</h4>
                        <p>
                            Watch the price unfold with real-time charts. See how your trades would have performed.
                        </p>
                    </div>

                    <div className='space-2 bg-[var(--background)] border border-[var(--border)] rounded-xl p-6 hover:border-[var(--seafoam)] transition-colors'>
                        <BrainCircuit className='w-6 h-6 text-[var(--seafoam)]' />
                        <h4 className='text-xl font-bold mt-2 mb-2'>AI Insights</h4>
                        <p>
                            Get intelligent feedback on your trading decisions and learn from your mistakes with AI-powered analysis.
                        </p>
                    </div>
                </div>
            </div>

            <div className='bg-[var(--background)] border-y border-[var(--border)]'>
                <div className='max-w-7xl mx-auto px-6 py-16'>
                    <div className='grid grid-cols-1 md:grid-cols-4 gap-8 text-center'>
                        <div>
                            <p className='text-4xl font-bold text-white mb-2'>50K+</p>
                            <p className='text-xl'>Active Learners</p>
                        </div>
                        <div>
                            <p className='text-4xl font-bold text-white mb-2'>20+</p>
                            <p className='text-xl'>Trading Strategies</p>
                        </div>
                        <div>
                            <p className='text-4xl font-bold text-white mb-2'>10+</p>
                            <p className='text-xl'>Historical Events</p>
                        </div>
                        <div>
                            <p className='text-4xl font-bold text-white mb-2'>R0</p>
                            <p className='text-xl'>Cost to Start</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className='max-w-7xl mx-auto px-6 py-24'>
                <div className='bg-gradient-to-r from-[var(--blue)] to-[var(--purple)] rounded-xl p-12 text-center'>
                    <h3 className='text-3xl font-bold text-white mb-4'>Ready To Start Your Trading Journey?</h3>
                    <p className='text-xl mb-8 max-w-2xl mx-auto'>
                        Join thousands of learners who are mastering the markets with AutoFlow's risk-free trading simulations.
                    </p>
                    <div className='flex items-center justify-center gap-4'>
                        <button
                            onClick={onGetStarted}
                            className='px-8 py-4 bg-white text-[var(--blue)] rounded-xl font-medium hover:bg-gray-300 transition-colors'
                        >
                            Create Your Free Account
                        </button>
                        <button
                            onClick={onLogin}
                            className='px-8 py-4 bg-white text-[var(--blue)] rounded-xl font-medium hover:bg-gray-200 transition-colors'
                        >
                            Sign In
                        </button>
                    </div>
                </div>
            </div>

            <footer className='border-t border-[var(--border)] bg-[var(--background-light)]'>
                <div className='max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-3'>
                    <div className='flex items-center gap-3'>
                        <div className='w-8 h-8 bg-gradient-br from-[var(--blue)] to-[var(--purple)] flex items-center justify-center overflow-hidden'>
                            <Image 
                            src='/logo.svg'
                            alt='AutoFlow'
                            width={20}
                            height={20}
                            className='w-5 h-5 flex self-center'
                            />
                        </div>
                        <span>© 2026 AutoFlow. All rights reserved.</span>
                    </div>
                    <div className='flex gap-6'>
                        <a href='#' className='hover:text-blue-200'>Terms</a>
                        <a href='#' className='hover:text-blue-200'>Privacy</a>
                        <a href='#' className='hover:text-blue-200'>Support</a>
                    </div>
                </div>
            </footer>
        </div>
        </>
    )
}