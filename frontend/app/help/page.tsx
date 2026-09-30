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
        { id: '1', text: '1. Select the create account dropdown from the navigation bar.', image: '/help/help1/Untitled2.png' },
        { id: '2', text: '2. Select the desired currency for the account.', image: '/help/help1/Untitled3.png' },
        { id: '3', text: '3. Select a startin balance, higher balances can be unlocked with XP on the tech tree.', image: '/help/help1/Untitled4.png' },
        { id: '4', text: '4. Click confirm.', image: '/help/help1/Untitled5.png' },
      ]
    ),
    getTutorial('2', 'How to unlock strategies',
      [
        { id: '1', text: '1. Navigate to the learning page using the navbar', image: '/help/help2/Untitled.png' },
        { id: '2', text: '2. Navigate to the tech tree tab', image: '/help/help2/Untitled2.png' },
        { id: '3', text: '3. Use XP to unlock a strategy if you have its prerequisite unlocked already', image: '/help/help2/Untitled3.png' },
        { id: '4', text: '4. You cannot unlock strategies / account balances if you lack XP or preceding tech tree node', image: '/help/help2/Untitled4.png' },
      ]
    ),
    getTutorial('3', 'How to earn XP ',
      [
        { id: '1', text: '1. Navigate to the learning page using the navbar', image: '/help/help3/Untitled.png' },
        { id: '2', text: '2. Select an unlocked strategy and use the guided learning', image: '/help/help3/Untitled2.png' },
        { id: '3', text: '3. XP is awarded once complete', image: '/help/help3/Untitled3.png' },
        { id: '4', text: '4. XP is also awarded when completing puzzles', image: '/help/help3/Untitled4.png' },
      ]
    ),
    getTutorial('4', 'How to get holdings',
      [
        { id: '1', text: '1. Navigate to the live trading page', image: '/help/help4/Untitled.png' },
        { id: '2', text: '2. Select a holding and choose how much you want to buy', image: '/help/help4/Untitled1.png' },
        { id: '3', text: '3. Confirm the purchase', image: '/help/help4/Untitled2.png' },
        { id: '4', text: '4. Navigate to the portfolio page to select and view the holding', image: '/help/help4/Untitled3.png' },
      ]
    ),
  ];

  const faq = [
    { id: '1', q: 'Is my money real?', a: 'No, money on autoflow trading simulator does not hold any real value and exists the help you practice trading.' },
    { id: '2', q: 'What is a strategy?', a: 'A strategy is a common tactic employed in trading which discusses when and how to buy, sell and hold holdings.' },
    { id: '3', q: 'What are Greeks?', a: 'Greeks are also known as risk indicators and measure how likely a given holding is to change in value quickly.' },
    { id: '4', q: 'How does the tech tree work?', a: 'The tech tree provides a way to progressively unlock more complex strategies, greeks and higher account balances using XP.' },
    { id: '5', q: 'What are my holdings?', a: 'Holdings are simulated earnings using real time market data. they are not worth real money but allow practice within the real market.' },
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
