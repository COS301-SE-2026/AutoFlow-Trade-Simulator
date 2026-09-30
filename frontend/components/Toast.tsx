'use client';

import { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

const typeStyles = {
    success: { cls: 'border-[rgba(0,148,68,0.5)]', icon: CheckCircle2, iconCls: 'text-[var(--green-light)]' },
    error: { cls: 'border-[rgba(237,28,36,0.5)]', icon: AlertCircle, iconCls: 'text-[#ff6b72]' },
    info: { cls: 'border-[rgba(28,117,188,0.5)]', icon: Info, iconCls: 'text-[#6fb4ea]' },
    warning: { cls: 'border-[rgba(247,148,29,0.5)]', icon: AlertTriangle, iconCls: 'text-[var(--orange)]' },
};

export default function Toast({ message, type = 'info', onClose }: {
    message: string;
    type?: ToastType;
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

    const { cls, icon: Icon, iconCls } = typeStyles[type];

    return (
        <div
            className={`fixed top-20 right-6 z-50 flex max-w-sm items-start gap-3 rounded-xl border ${cls} bg-[rgba(18,18,28,0.95)] px-4 py-3 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.7)] backdrop-blur-md transition-[opacity,transform] duration-300 ease-out ${
                visible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
            }`}
            role='alert'
        >
            <Icon aria-hidden="true" className={`mt-0.5 h-5 w-5 shrink-0 ${iconCls}`} />
            <p className="min-w-0 break-words text-sm text-white/90">{message}</p>
            <button
                type='button'
                aria-label="Dismiss notification"
                onClick={() => {
                    setVisible(false);
                    setTimeout(onClose, 300);
                }}
                className='-mr-1 shrink-0 rounded-md p-0.5 text-white/50 transition-colors hover:text-white'
            >
                <X aria-hidden="true" className="h-4 w-4" />
            </button>
        </div>
    );
}
