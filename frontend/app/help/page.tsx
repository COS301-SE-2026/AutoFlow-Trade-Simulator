'use client';

import { Navbar } from '@/components/navbar';
import Image from 'next/image';

export default function LearningPage() {
  return (
    <>
      <Navbar />
      <div className="h-full p-6">
        <div className='text-4xl flex justify-center mb-3'>links</div>
        <div className='space-2 bg-[var(--background)] border border-[var(--border)] rounded-xl p-6 hover:border-[var(--purple)] transition-colors'>
          placehodler
        </div>
        <hr className='border-[#9ca3af] my-6' />

        <div className='text-4xl flex justify-center mb-3'>tutorial</div>
        <div className='space-2 bg-[var(--background)] border border-[var(--border)] rounded-xl p-6 hover:border-[var(--purple)] transition-colors'>
          {[
            // array containing tutorial objects. objects contain question string and answer array. answer array holds answer objects. answer objects contain answer and image reference strings
            {
              q: 'how to create an account', a: [
                { text: '', image: '/logo.svg' },
                { text: '', image: '/logo.svg' },
                { text: '', image: '/logo.svg' },
              ]
            },
            {
              q: 'how to buy and sell stocks', a: [
                { text: '', image: '/logo.svg' },
                { text: '', image: '/logo.svg' },
                { text: '', image: '/logo.svg' },
              ]
            },
            {
              q: 'how to learn about strategies', a: [
                { text: '', image: '/logo.svg' },
                { text: '', image: '/logo.svg' },
                { text: '', image: '/logo.svg' },
              ]
            },
            {
              q: 'how to view account details', a: [
                { text: '', image: '/logo.svg' },
                { text: '', image: '/logo.svg' },
                { text: '', image: '/logo.svg' },
              ]
            },
          ].map((f, index) => (
            // mapping array to divs
            <div key={`empty-${index}`}>
              <p className='text-1.5x1 mb-3'>{index + 1}. {f.q}</p>
              {f.a.map((a, index) => (
                // mapping answer array to text image pairs
                <div key={`empty-${index}`}>
                  <p className='mb-4' style={{ color: 'var(--muted' }}>{a.text}</p>
                  {a.image !== '' && (
                    <Image
                      src={a.image}
                      alt='Autoflow'
                      width={24}
                      height={24}
                    />
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
        <hr className='border-[#9ca3af] my-6' />

        <div className='text-4xl flex justify-center mb-3'>FAQ</div>
        <div className='space-2 bg-[var(--background)] border border-[var(--border)] rounded-xl p-6 hover:border-[var(--purple)] transition-colors'>
          {[
            { q: 'is my money real?', a: 'no, money on autoflow trading simulator does not hold any real value and exists the help you practice trading.' },
            { q: 'how do i make more money?', a: 'you can make more money by investing in certain holdings which increase in value or create a new account with a starting amount of your choosing.' },
            { q: 'what is stop loss?', a: 'stop loss is an order to sell your stock when it reaches a specific price so you are protected from losing too much of your investment.' },
            { q: 'is the data real?', a: 'yes, data on autoflow trading simulator uses historical and real time market data to make learning more engaging and effective.' },
          ].map((f, index) => (
            <div key={`empty-${index}`}>
              <p className='text-1.5x1 mb-3'>{index + 1}. {f.q}</p>
              <p className='mb-4' style={{ color: 'var(--muted' }}>{f.a}</p>
            </div>
          ))}
        </div>
        <hr className='border-[#9ca3af] my-6' />
      </div >
    </>
  );
}