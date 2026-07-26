'use client';

import { Navbar } from '@/components/navbar';
import Image from 'next/image';

export default function LearningPage() {
  const getTutorial = (id: string, q: string, a: { id: string, text: string, image: string }[]) => ({
    id: id,
    q: q,
    a: a.map((step) => ({
      id: step.id,
      text: step.text,
      image: step.image,
    }))
  })

  const tutorials = [
    // array containing tutorial objects. objects contain question string and answer array. answer array holds answer objects. answer objects contain answer and image reference strings
    getTutorial('1', 'how to create an account',
      [
        { id: '1', text: 'after logging in, click on the "add accounts" button visible on the top right of the screen in the navigation bar', image: '/help/create-account-0.png' },
        { id: '2', text: 'choose a currency and set a starting amount', image: '/help/create-account-1.png' },
        { id: '3', text: 'then click confirm to create an account', image: '/help/create-account-2.png' },
      ]
    ), getTutorial('2', 'how to buy and sell stocks',
      [
        { id: '1', text: 'navigate to the market page using the navigation bar', image: '/help/buy-sell-0.png' },
        { id: '2', text: 'choose either select or buy and enter a quantity by either using the input box or MAX to sell or buy the maximum amount of stock', image: '/help/buy-sell-1.png' },
        { id: '3', text: 'click the buy or sell button at the bottom of the page', image: '/help/buy-sell-2.png' },
      ]
    ), getTutorial('3', 'how to learn about strategies',
      [
        { id: '1', text: 'go to the learning tab and select strategies', image: '/help/strategy-learning-0.png' },
        { id: '2', text: 'choose a strategy you wish to learn or filter them using the selectors', image: '/help/strategylist.png' },
        { id: '3', text: 'read about the strategies and practice them in the historical simulation page', image: '/help/strategydetail.png' },
      ]
    ),
    getTutorial('4', 'how to view account details',
      [
        { id: '1', text: 'navigate to the portfolio page using the navigation bar', image: '/help/portfolio-0.png' },
        { id: '2', text: 'the cash balance, amount invested and total value are are visible', image: '/help/portfolio.png' },
      ]
    ),

  ];

  const faq = [
    { id: '1', q: 'is my money real?', a: 'no, money on autoflow trading simulator does not hold any real value and exists the help you practice trading.' },
    { id: '2', q: 'how do i make more money?', a: 'you can make more money by investing in certain holdings which increase in value or create a new account with a starting amount of your choosing.' },
    { id: '3', q: 'what is stop loss?', a: 'stop loss is an order to sell your stock when it reaches a specific price so you are protected from losing too much of your investment.' },
    { id: '4', q: 'is the data real?', a: 'yes, data on autoflow trading simulator uses historical and real time market data to make learning more engaging and effective.' },
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
          {tutorials.map((t) => (
            <div key={`tutorials-${t.id}`}>
              <p className='text-1.5x1 mb-3'>{t.id}. {t.q}</p>
              {t.a.map((a) => (
                <div key={`tutorials-${t.id}-step-${a.id}`}>
                  <p className='mb-4' style={{ color: 'var(--muted' }}>{a.text}</p>
                  <Image
                    src={a.image}
                    alt='Autoflow'
                    width={960}
                    height={540}
                    style={{ width: 'auto', height: 'auto' }}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
        <hr className='border-[#9ca3af] my-6' />

        <div className='text-4xl flex justify-center mb-3'>FAQ</div>
        <div className='space-2 bg-[var(--background)] border border-[var(--border)] rounded-xl p-6 hover:border-[var(--purple)] transition-colors'>
          {faq.map((f) => (
            <div key={`faq-${f.id}`}>
              <p className='text-1.5x1 mb-3'>{f.id}. {f.q}</p>
              <p className='mb-4' style={{ color: 'var(--muted' }}>{f.a}</p>
            </div>
          ))}
        </div>
        <hr className='border-[#9ca3af] my-6' />
      </div >
    </>
  );
}