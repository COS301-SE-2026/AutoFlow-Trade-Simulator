'use client';

import { useState, useEffect } from 'react';

export default function Toast({ message, onClose }: {
    message: string;
    onClose: () => void;
}) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const showTimer = setTimeout(() => setVisible(true), 50);
        const hideTimer = setTimeout(() => {
            setVisible(false);
            setTimeout(onClose, 300); 
        }, 4000);

        return () => {
            clearTimeout(showTimer);
            clearTimeout(hideTimer);
        };
    }, [onClose]);

    return (
        <div
            className={`
                fixed top-6 right-6 z-50 flex bg-[var(--accent)] 
                border rounded-xl px-4 py-3 gap-3
                transition-all duration-300 ease-out shadow-lg
                ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
            `}
            role='alert'
        >
            <p>{message}</p>
            <button
                onClick={() => {
                    setVisible(false);
                    setTimeout(onClose, 300);
                }}
                className='text-white/70 hover:text-white transition-colors'
            >
                CLOSE
            </button>
        </div>
    );
}