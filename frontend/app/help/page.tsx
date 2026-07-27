'use client';

import { Navbar } from '@/components/navbar';
import Image from 'next/image';

export default function HelpMenu() {
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
    getTutorial('1', 'How to create an account',
      [
        { id: '1', text: 'After logging in, click on the "add accounts" button visible on the top right of the screen in the navigation bar.', image: '/help/create-account-0.png' },
        { id: '2', text: 'Choose a currency and set a starting amount.', image: '/help/create-account-1.png' },
        { id: '3', text: 'Then click confirm to create an account.', image: '/help/create-account-2.png' },
      ]
    ), getTutorial('2', 'How to buy and sell stocks',
      [
        { id: '1', text: 'Navigate to the market page using the navigation bar.', image: '/help/buy-sell-0.png' },
        { id: '2', text: 'Choose either select or buy and enter a quantity by either using the input box or MAX to sell or buy the maximum amount of stock.', image: '/help/buy-sell-1.png' },
        { id: '3', text: 'Click the buy or sell button at the bottom of the page.', image: '/help/buy-sell-2.png' },
      ]
    ), getTutorial('3', 'How to learn about strategies',
      [
        { id: '1', text: 'Go to the learning tab and select strategies.', image: '/help/strategy-learning-0.png' },
        { id: '2', text: 'Choose a strategy you wish to learn or filter them using the selectors.', image: '/help/strategylist.png' },
        { id: '3', text: 'Read about the strategies and practice them in the historical simulation page.', image: '/help/strategydetail.png' },
      ]
    ),
    getTutorial('4', 'How to view account details',
      [
        { id: '1', text: 'Navigate to the portfolio page using the navigation bar.', image: '/help/portfolio-0.png' },
        { id: '2', text: 'The cash balance, amount invested and total value are visible.', image: '/help/portfolio.png' },
      ]
    ),

  ];

  const faq = [
    { id: '1', q: 'Is my money real?', a: 'No, money on autoflow trading simulator does not hold any real value and exists the help you practice trading.' },
    { id: '2', q: 'How do I make more money?', a: 'You can make more money by investing in certain holdings which increase in value or create a new account with a starting amount of your choosing.' },
    { id: '3', q: 'What is stop loss?', a: 'Stop loss is an order to sell your stock when it reaches a specific price so you are protected from losing too much of your investment.' },
    { id: '4', q: 'Is the data real?', a: 'Yes, data on autoflow trading simulator uses historical and real time market data to make learning more engaging and effective.' },
  ];

  return (
    <>
      <Navbar />
      <div className="h-full p-6 max-w-7xl mx-auto">
        <div className='text-4xl flex justify-center mb-3'>Tutorial</div>
        <div className='space-2 bg-[var(--background)] border border-[var(--border)] rounded-xl p-6 hover:border-[var(--purple)] transition-colors'>
          {tutorials.map((t) => (
            <div key={`tutorials-${t.id}`}>
              <p className='text-1.5xl mb-3'>{t.id}. {t.q}</p>
              {t.a.map((a) => (
                <div key={`tutorials-${t.id}-step-${a.id}`}>
                  <p className='mb-4' style={{ color: 'var(--muted' }}>{a.text}</p>
                  <Image
                    src={a.image}
                    alt={a.text}
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
              <p className='text-1.5xl mb-3'>{f.id}. {f.q}</p>
              <p className='mb-4' style={{ color: 'var(--muted' }}>{f.a}</p>
            </div>
          ))}
        </div>
        <hr className='border-[#9ca3af] my-6' />
      </div >
    </>
  );
}
