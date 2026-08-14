'use client';

import { useState } from 'react';

export default function Toast({ message }: {
    message: string;
}) {
    const [visible, setVisible] = useState(false);

    const showTimer = setTimeout(() => setVisible(true), 50);
    const hideTimer = setTimeout(() => setVisible(false), 4000);

    return (
        <div
            className={`${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
        >
            <p>{message}</p>
            <button
                onClick={() => {
                    clearTimeout(showTimer);
                    setTimeout(() => {setVisible(false)}, 4000);
                }}
            >
                CLOSE
            </button>
        </div>
    )
}