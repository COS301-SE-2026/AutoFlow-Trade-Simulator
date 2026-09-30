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
      <main className="mx-auto w-full max-w-5xl px-4 pt-10 pb-20 md:px-6">
        <h1 className="sr-only">Help</h1>

        <section aria-labelledby="tutorial-heading">
          <h2 id="tutorial-heading" className="mb-6 text-3xl font-semibold tracking-tight">Tutorial</h2>
          <div className="flex flex-col gap-6">
            {tutorials.map((t) => (
              <article
                key={`tutorials-${t.id}`}
                className="rounded-2xl border border-[var(--border)] bg-[rgba(14,14,22,0.7)] p-5 md:p-7"
              >
                <h3 className="tabular mb-5 text-lg font-semibold">{t.id}. {t.q}</h3>
                <ol className="flex flex-col gap-6">
                  {t.a.map((a) => (
                    <li key={`tutorials-${t.id}-step-${a.id}`} className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] md:gap-6">
                      <div className="flex gap-3">
                        <span
                          aria-hidden="true"
                          className="tabular mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/15 text-xs text-white/70"
                        >
                          {a.id}
                        </span>
                        <p className="text-[15px] leading-relaxed text-[var(--muted)]">{a.text}</p>
                      </div>
                      <div className="overflow-hidden rounded-xl border border-white/10 bg-[#1b1b22]">
                        <Image
                          src={a.image}
                          alt={a.text}
                          width={960}
                          height={540}
                          loading="lazy"
                          className="h-auto w-full"
                        />
                      </div>
                    </li>
                  ))}
                </ol>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="faq-heading" className="mt-16">
          <h2 id="faq-heading" className="mb-6 text-3xl font-semibold tracking-tight">FAQ</h2>
          <dl className="grid gap-4 md:grid-cols-2">
            {faq.map((f) => (
              <div key={`faq-${f.id}`} className="rounded-2xl border border-[var(--border)] bg-[rgba(14,14,22,0.7)] p-5">
                <dt className="tabular mb-2 font-semibold">{f.id}. {f.q}</dt>
                <dd className="text-[15px] leading-relaxed text-[var(--muted)]">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      </main>
    </>
  );
}
