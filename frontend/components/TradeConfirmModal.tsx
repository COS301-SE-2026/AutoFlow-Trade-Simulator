interface TradeConfirmModalProps {
	side: "buy" | "sell";
	quantity: number;
	price: number;
	orderType: string;
	limitPrice?: number;
	onConfirm: () => void;
	onCancel: () => void;
}
export default function TradeConfirmModal({ side, quantity, price, orderType, limitPrice, onConfirm, onCancel }: TradeConfirmModalProps) {
	const effectivePrice = orderType === 'market' ? price : (limitPrice ?? price);
	const total = quantity * effectivePrice;
	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
			<div className="bg-white rounded-lg p-6 w-96 shadow-lg">
				<h3 className="text-lg font-semibold mb-4">
					Confirm {side === 'buy' ? 'Purchase' : 'Sale'}
				</h3>

				<div className="space-y-2 mb-6 text-sm">
					<div className="flex justify-between">
						<span className="text-gray-500">Quantity</span>
						<span>{quantity}</span>
					</div>
					<div className="flex justify-between">
						<span className="text-gray-500">Order type</span>
						<span className="capitalize">{orderType}</span>
					</div>
					<div className="flex justify-between">
						<span className="text-gray-500">Price</span>
						<span>${effectivePrice.toFixed(2)}</span>
					</div>
					<div className="flex justify-between font-medium">
						<span>Total</span>
						<span>${total.toFixed(2)}</span>
					</div>
				</div>

				<div className="flex gap-3">
					<button
						onClick={onCancel}
						className="flex-1 border rounded py-2"
					>
						Cancel
					</button>
					<button
						onClick={onConfirm}
						className={`flex-1 rounded py-2 text-white ${side === 'buy' ? 'bg-green-600' : 'bg-red-600'
							}`}
					>
						Confirm {side === 'buy' ? 'Buy' : 'Sell'}
					</button>
				</div>
			</div>
		</div>
	);

}
