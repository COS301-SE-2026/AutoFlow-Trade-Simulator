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
	return (
		<div className='z-50 flex items-center justify-center fixed inset-0 bg-black bg-opacity-70 p-6 backdrop-blur-sm'>
			<div className='card p-6 max-w-md w-full'>
				<h3 className='text-xl font-bold mb-4'>
					Confirm {side === 'buy' ? 'Buy' : 'Sell'}
				</h3>
				<div className='flex flex-col gap-3 mb-6'>
					<div className='flex justify-between'>
						<span>Order Type:</span>
						<span className='font-semibold capitalize'>{orderType}</span>
					</div>
					<div className='flex justify-between'>
						<span>Quantity:</span>
						<span className='font-semibold'>{quantity} units</span>
					</div>
					<div className='flex justify-between'>
						<span>Price per unit:</span>
						<span className='font-semibold'>{effectivePrice.toFixed(2)}</span>
					</div>
					<div className='flex justify-between'>
						<span>Total Cost:</span>
						<span className='font-semibold'>{total.toFixed(2)}</span>
					</div>
					<div className='border-b border-[var(--border)] p-2'></div>
					{orderType === 'limit' && limitPrice !== undefined && (
						<div className='flex justify-between text-yellow'>
							<span>Limit Price:</span>
							<span className='font-semibold'>{limitPrice.toFixed(2)}</span>
						</div>
					)}
				</div>
				<div className='flex gap-3 justify-between'>
					<button
						onClick={onCancel}
						className='px-4 py-2 flex rounded-xl font-bold border border-[var(--border)] disabled:opacity-50'
						type="button"
					>
						Cancel
					</button>
					<button
						onClick={onConfirm}
						className={`px-4 py-2 flex rounded-xl font-bold border
							border-[var(--border)] disabled:opacity-50
							${side === 'buy' ? 'bg-green-600' : 'bg-red-600'}`}
						type="button"
					>
						Confirm
					</button>
				</div>
			</div>
		</div>
	);
}
