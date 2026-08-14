'use client';

import Image from 'next/image';
import { Zap, ArrowRight, History, BookOpen, Shield, Triangle, ChartLine, BrainCircuit } from 'lucide-react';
import Link from 'next/link';

import Toast from '@/components/Toast';
import { useState } from 'react';

export default function SplashPage() {

    const [toast, setToast] = useState<{ message: string } | null>(null);

    return (
        <div className='blurred-animated-bg relative'>
            <div className='size-full bg-[var(--background-glass)] backdrop-blur-md overflow-auto'>
                <nav className='border-b border-[var(--border)] bg-[var(--background)]'>
                    <div className='max-w-7xl mx-auto px-6 py-4'>
                        <div className='flex items-center gap-3 justify-between'>
                            <div className='flex items-center'>
                                <div className='w-10 h-10 rounded-lg flex self-center justify-center'>
                                    <Image
                                        src='/logo.svg'
                                        alt='Autoflow'
                                        width={24}
                                        height={24}
                                        className='w-6 w-6'
                                    />
                                </div>
                                <p className='text-2xl font-bold flex self-center'>AutoFlow</p>
                            </div>
                            <div className='flex items-center gap-3'>
                                <Link
                                    href='/login'
                                    className='px-6 py-2 hover:bg-blur-md border rounded-xl border-[var(--border)] hover:border-[var(--blue)]'
                                >
                                    Sign In
                                </Link>
                                <Link
                                    href='/register'
                                    className='px-6 py-2 hover:bg-blur-md border rounded-xl border-[var(--border)] hover:border-[var(--blue)]'
                                >
                                    Sign Up
                                </Link>
                            </div>
                        </div>
                    </div>
                </nav>

                <button
                    onClick={() => {setToast({ message: 'This is a toast!' })}}
                >
                    show the toast
                    {toast && (
                        <Toast
                            message={toast.message}
                        />
                    )}
                </button>

                <div className='mx-auto px-6 py-24'>
                    <div className='text-center mx-auto'>
                        <div className='inline-flex items-center gap-2 px-4 py-2 border border-[var(--blue)] rounded-full text-[var(--seafoam)] text-sm font-medium mb-6'>
                            <Zap className='w-4 h-4' />
                            AI-Powered Educational Trading Platform
                        </div>
                        <h2 className='text-5xl md:text-6xl font-bold text-white mb-6'>
                            Master the markets with
                            <span className='bg-gradient-to-r from-[var(--seafoam)] to-[var(--blue)] bg-clip-text text-transparent gap-1'> Confidence
                            </span>
                        </h2>
                        <p>
                            Learn trading strategies, understand options Greeks, and replay historical market events all in a risk-free environment designed to build real skills.
                        </p>
                        <div className='flex items-center justify-center gap-4 mt-4'>
                            <Link
                                href='/register'
                                className='group px-8 py-4 bg-gradient-to-r from-[var(--seafoam)] to-[var(--blue)] text-white rounded-full font-medium flex items-center gap-2'
                            >
                                Start Learning For Free
                                <ArrowRight className='w-4 h-4 group-hover:translate-x-1 transition-transform' />
                            </Link>
                            <button type='button' className='px-8 py-4 bg-gradient-to-r from-[var(--seafoam)] to-[var(--blue)] text-white rounded-full font-medium'>
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
                                Replay real events like the COVID crash, NVIDIA AI Surge, and more. Trade them day-by-day and see how well you&apos;d perform.
                            </p>
                        </div>

                        <div className='space-2 bg-[var(--background)] border border-[var(--border)] rounded-xl p-6 hover:border-[var(--green)] transition-colors'>
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
                                <p className='text-4xl font-bold text-white mb-2'>4+</p>
                                <p className='text-xl'>Active Learners</p>
                            </div>
                            <div>
                                <p className='text-4xl font-bold text-white mb-2'>10+</p>
                                <p className='text-xl'>Trading Strategies</p>
                            </div>
                            <div>
                                <p className='text-4xl font-bold text-white mb-2'>5+</p>
                                <p className='text-xl'>Historical Events</p>
                            </div>
                            <div>
                                <p className='text-4xl font-bold text-white mb-2'>No</p>
                                <p className='text-xl'>Cost to Start</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className='max-w-7xl mx-auto px-6 py-24'>
                    <div className='bg-gradient-to-r from-[var(--seafoam)] to-[var(--blue)] rounded-xl p-12 text-center'>
                        <h3 className='text-3xl font-bold text-white mb-4'>Ready To Start Your Trading Journey?</h3>
                        <p className='text-xl mb-8 max-w-2xl mx-auto'>
                            Join thousands of learners who are mastering the markets with AutoFlow&apos;s risk-free trading simulations.
                        </p>
                        <div className='flex items-center justify-center gap-4'>
                            <Link
                                href='/register'
                                className='px-8 py-4 text-white rounded-xl border border-white font-medium hover:bg-white hover:text-[var(--blue)] transition-colors'
                            >
                                Create Your Free Account
                            </Link>
                            <Link
                                href='/login'
                                className='px-8 py-4 text-white rounded-xl border border-white font-medium hover:bg-white hover:text-[var(--blue)] transition-colors'
                            >
                                Sign In
                            </Link>
                        </div>
                    </div>
                </div>

                <footer className='border-t border-[var(--border)] bg-[var(--background-glass)]'>
                    <div className='max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-3'>
                        <div className='flex items-center gap-3'>
                            <div className='w-8 h-8 bg-gradient-br from-[var(--blue)] to-[var(--green)] flex items-center justify-center overflow-hidden'>
                                <Image 
                                src='/logo.svg'
                                alt='AutoFlow'
                                width={20}
                                height={20}
                                className='w-5 h-5 flex self-center'
                                />
                            </div>
                            <span className='gap-1'>© 2026 AutoFlow. All rights reserved.</span>
                        </div>
                        <div className='flex gap-6'>
                            <button type='button' className='hover:text-blue-200'>Terms</button>
                            <button type='button' className='hover:text-blue-200'>Privacy</button>
                            <button type='button' className='hover:text-blue-200'>Support</button>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    )
}