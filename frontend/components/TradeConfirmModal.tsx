'use client';

import { useEffect, useRef } from 'react';

interface TradeConfirmModalProps {
	side: "buy" | "sell";
	quantity: number;
	price: number;
	orderType: string;
	limitPrice?: number;
	onConfirm: () => void;
	onCancel: () => void;
}

export default function TradeConfirmModal({ side, quantity, price, orderType, limitPrice, onConfirm, onCancel }: Readonly<TradeConfirmModalProps>) {
	const effectivePrice = orderType === 'market' ? price : (limitPrice ?? price);
	const total = quantity * effectivePrice;
	const confirmRef = useRef<HTMLButtonElement>(null);
	const isBuy = side === 'buy';

	useEffect(() => {
		confirmRef.current?.focus();
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onCancel();
		};
		globalThis.addEventListener('keydown', onKey);
		return () => globalThis.removeEventListener('keydown', onKey);
	}, [onCancel]);

	const rows: [string, string, boolean?][] = [
		['Order Type:', orderType],
		['Quantity:', `${quantity} units`],
		['Price per unit:', effectivePrice.toFixed(2)],
	];

	return (
		<div
			className='fixed inset-0 z-50 flex items-center justify-center overscroll-contain bg-[rgba(4,4,10,0.72)] p-6 backdrop-blur-sm'
			onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
		>
			<div
				role='dialog'
				aria-modal='true'
				aria-labelledby='trade-confirm-title'
				className='w-full max-w-md rounded-2xl border border-white/10 bg-[#12121c] p-6 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]'
			>
				<div className='mb-5 flex items-center gap-3'>
					<span className={`h-2.5 w-2.5 rounded-full ${isBuy ? 'bg-[var(--green)]' : 'bg-[var(--red)]'}`} aria-hidden='true' />
					<h3 id='trade-confirm-title' className='text-xl font-semibold'>
						Confirm {isBuy ? 'Buy' : 'Sell'}
					</h3>
				</div>

				<dl className='tabular mb-6 flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-white/[0.02] p-4 text-[15px]'>
					{rows.map(([label, value]) => (
						<div key={label} className='flex justify-between gap-4'>
							<dt className='text-white/60'>{label}</dt>
							<dd className='font-semibold capitalize'>{value}</dd>
						</div>
					))}
					{orderType === 'limit' && limitPrice !== undefined && (
						<div className='flex justify-between gap-4 text-[var(--yellow)]'>
							<dt>Limit Price:</dt>
							<dd className='font-semibold'>{limitPrice.toFixed(2)}</dd>
						</div>
					)}
					<div className='mt-1 flex justify-between gap-4 border-t border-[var(--border)] pt-3'>
						<dt className='font-medium text-white/80'>Total Cost:</dt>
						<dd className='text-lg font-semibold'>{total.toFixed(2)}</dd>
					</div>
				</dl>

				<div className='flex gap-3'>
					<button
						onClick={onCancel}
						className='h-11 flex-1 rounded-xl border border-white/10 font-semibold text-white/80 transition-colors hover:bg-white/[0.05] hover:text-white'
						type="button"
					>
						Cancel
					</button>
					<button
						ref={confirmRef}
						onClick={onConfirm}
						className={`h-11 flex-1 rounded-xl font-semibold text-white transition-[background-color,transform] active:scale-[0.98] ${
							isBuy ? 'bg-[var(--green)] hover:bg-[#00a84e]' : 'bg-[#d4262d] hover:bg-[var(--red)]'
						}`}
						type="button"
					>
						Confirm
					</button>
				</div>
			</div>
		</div>
	);
}
