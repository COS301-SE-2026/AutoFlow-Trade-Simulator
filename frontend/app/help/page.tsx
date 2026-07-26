'use client';

import { Navbar } from '@/components/navbar';
import Image from 'next/image';

export default function LearningPage() {
  const tutorial = [
    // array containing tutorial objects. objects contain question string and answer array. answer array holds answer objects. answer objects contain answer and image reference strings
    {
      q: 'how to create an account', a: [
        { text: 'after logging in, click on the "add accounts" button visible on the top right of the screen in the navigation bar', image: '/help/create-account-0.png' },
        { text: 'choose a currency and set a starting amount', image: '/help/create-account-1.png' },
        { text: 'then click confirm to create an account', image: '/help/create-account-2.png' },
      ]
    },
    {
      q: 'how to buy and sell stocks', a: [
        { text: 'navigate to the market page using the navigation bar', image: '/help/buy-sell-0.png' },
        { text: 'choose either select or buy and enter a quantity by either using the input box or MAX to sell or buy the maximum amount of stock', image: '/help/buy-sell-1.png' },
        { text: 'click the buy or sell button at the bottom of the page', image: '/help/buy-sell-2.png' },
      ]
    },
    {
      q: 'how to learn about strategies', a: [
        { text: 'go to the learning tab and select strategies', image: '/help/strategy-learning-0.png' },
        { text: 'choose a strategy you wish to learn or filter them using the selectors', image: '/help/strategylist.png' },
        { text: 'read about the strategies and practice them in the historical simulation page', image: '/help/strategydetail.png' },
      ]
    },
    {
      q: 'how to view account details', a: [
        { text: 'navigate to the portfolio page using the navigation bar', image: '/help/portfolio-0.png' },
        { text: 'the cash balance, amount invested and total value are are visible', image: '/help/portfolio.png' },
      ]
    },
  ];

  const faq = [
    { q: 'is my money real?', a: 'no, money on autoflow trading simulator does not hold any real value and exists the help you practice trading.' },
    { q: 'how do i make more money?', a: 'you can make more money by investing in certain holdings which increase in value or create a new account with a starting amount of your choosing.' },
    { q: 'what is stop loss?', a: 'stop loss is an order to sell your stock when it reaches a specific price so you are protected from losing too much of your investment.' },
    { q: 'is the data real?', a: 'yes, data on autoflow trading simulator uses historical and real time market data to make learning more engaging and effective.' },
  ];

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
          {tutorial.map((t, i) => (
            <div key={`empty-${`tutorial-${i}`}`}>
              <p className='text-1.5x1 mb-3'>{i + 1}. {t.q}</p>
              {t.a.map((a, j) => (
                <div key={`empty-${`tutorial-${i} step-${j}`}`}>
                  <p className='mb-4' style={{ color: 'var(--muted' }}>{a.text}</p>
                  <Image
                    src={a.image}
                    alt='Autoflow'
                    width={960}
                    height={540}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
        <hr className='border-[#9ca3af] my-6' />

        <div className='text-4xl flex justify-center mb-3'>FAQ</div>
        <div className='space-2 bg-[var(--background)] border border-[var(--border)] rounded-xl p-6 hover:border-[var(--purple)] transition-colors'>
          {faq.map((f, index) => (
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