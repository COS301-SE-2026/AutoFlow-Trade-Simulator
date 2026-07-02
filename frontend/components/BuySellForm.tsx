'use client';

import { useState } from 'react';
import { usePrices } from '@/hooks/usePrices';

interface BuySellFormProps {
    price: number;
    onBuy?: (quantity: number) => void;
    onSell?: (quantity: number) => void;
}

export default function BuySellForm({
    price,
    onBuy,
    onSell}: BuySellFormProps) {
        const [mode, setMode] = useState<'buy' | 'sell'>('buy');
        const [quantity, setQuantity] = useState('');

        const currentPrice = price || 0;
        const totalCost = parseFloat(quantity) * currentPrice || 0;

        const handleQuantityChange = (value: string) => {
            if (value === '' || /[\d]+([.]\d+)?/.test(value)) {
                setQuantity(value);
            }
        }

        const handleSumbit = (e: React.SubmitEvent) => {
            e.preventDefault();
            const qty = parseFloat(quantity);
            if (!(qty) || qty <= 0) { return; }

            if (mode === 'buy' && onBuy) {
                onBuy(qty);
            } else if (mode === 'sell' && onSell) {
                onSell(qty);
            }
        }

        return (
            <>
            <div>
                <div>
                    <button onClick={() => setMode('buy')}>
                        Buy
                    </button>
                    <button onClick={() => setMode('sell')}>
                        Sell
                    </button>
                </div>

                <form onSubmit={handleSumbit}>
                    <div>
                        <label>Quantity</label>
                        <input
                            type="text"
                            placeholder='Enter Quantity'
                            value={quantity}
                            onChange={(e) => handleQuantityChange(e.target.value)}
                        ></input>
                    </div>
                    <div>
                        <label>Price: {currentPrice}</label>
                        <label>Total: {totalCost}</label>
                    </div>
                    <button type='submit'>{mode === 'buy' ? 'Buy' : 'Sell'}</button>
                </form>
            </div>
            </>
        )
    }