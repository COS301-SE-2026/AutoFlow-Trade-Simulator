'use client';

import { Navbar } from '@/components/navbar';

export default function LearningPage() {
  return (
    <>
      <Navbar />
      <div className="h-full p-6">
        <div className='text-4xl flex justify-center mb-3'>links</div>

        <div className='text-4xl flex justify-center mb-3'>tutorial</div>

        <div className='text-4xl flex justify-center mb-3'>FAQ</div>
        <div className='space-2 bg-[var(--background)] border border-[var(--border)] rounded-xl p-6 hover:border-[var(--purple)] transition-colors'>
          <div>
            <p className='text-1.5x1 mb-3'>1. what is AutoFlow Trade Simulator</p>
            <p style={{ color: 'var(--muted' }}>AutoFlow Trade Simulator is a learning program that seeks to teach trading in a stress free and intuitive way.</p>
          </div>
          <div>
            <p className='text-1.5x1 mb-3'>2. is the money real?</p>
            <p style={{ color: 'var(--muted' }}>no, the money and value shown in AutoFlow Trade Simulator exists purely for education. however, real market data is used for learning and allows users to practice in real world situations</p>
          </div>
          <div>
            <p className='text-1.5x1 mb-3'>3. how do i start learning?</p>
            <p style={{ color: 'var(--muted' }}>the learning tab at the <a href='/learning' className='text-blue-400'> learning tab</a> provides a list of typical trading strategies and an environment to practice their use in real historical situations.</p>
          </div>
          <div>
            <p className='text-1.5x1 mb-3'>4. what are greeks?</p>
            <p style={{ color: 'var(--muted' }}>greeks are risk metrics used in options trading. you can learn more by going to the <a href='/learning' className='text-blue-400'> learning tab</a> and selecting the greeks tab or by experimenting on the simulation tab found on the same page</p>
          </div>
          <div>
            <p className='text-1.5x1 mb-3'>5. how do i buy and sell stocks?</p>
            <p style={{ color: 'var(--muted' }}>create an account and go to the <a href='/#' className='text-blue-400'> market tab</a> to begin trading</p>
          </div>
          <div>
            <p className='text-1.5x1 mb-3'>6. how do i learn and practice strategies?</p>
            <p style={{ color: 'var(--muted' }}>go to the <a href='/learning' className='text-blue-400'> learning tab</a> and select the tab for strategies using the tab selector</p>
          </div>
          <div>
            <p className='text-1.5x1 mb-3'>7. where can i see all my money?</p>
            <p style={{ color: 'var(--muted' }}>you can track the value of your accounts on the <a href="/portfolio" className='text-blue-400'> portfolio page</a></p>
          </div>
          <div>
            <p className='text-1.5x1 mb-3'>8. how do i make an account?</p>
            <p style={{ color: 'var(--muted' }}>you can make a practice account by interacting with the dropdown on the top right of the screen and choosing a currency and starting amount.</p>
          </div>
        </div>
      </div >
    </>
  );
}