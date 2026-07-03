'use client';

import { useState } from 'react';
import { usePrices } from '@/hooks/usePrices';

interface BuySellFormProps {
    price: number;
    accountBalance: number;
    currentHoldings: number;
    onBuy?: (quantity: number) => void;
    onSell?: (quantity: number) => void;
}

export default function BuySellForm({
    price,
    accountBalance,
    currentHoldings,
    onBuy,
    onSell}: BuySellFormProps) {
        const [mode, setMode] = useState<'buy' | 'sell'>('buy');
        const [quantity, setQuantity] = useState('');

        const currentPrice = price || 0;
        const totalCost = parseFloat(quantity) * currentPrice || 0;
        const maxBuyable = Math.floor(accountBalance / currentPrice);
        const maxSellable = currentHoldings;

        const handleQuantityChange = (value: string) => {
            if (value === '' || /[\d]+([.]\d+)?/.test(value)) {
                setQuantity(value);
            }
        }

        const handleMax = () => {
            if (mode === 'buy') {
                setQuantity(maxBuyable.toString());
            } else {
                setQuantity(maxSellable.toString());
            }
        };

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

        const isValid = () => {
            const qty = parseFloat(quantity);
            if (!(qty) || qty <= 0) { return false; }
            if (mode === 'buy') {
                return qty <= maxBuyable && qty * currentPrice <= accountBalance;
            } else {
                return qty <= maxSellable && qty > 0;
            }
        };

        return (
            <>
            <div className="flex flex-col rounded-xl shadow-sm border border-white p-4 w-full">
                <form onSubmit={handleSumbit}>
                    <div className="border border-solid border-[var(--border)] bg-[rgba(20,20,32,0.6)] flex flex-row items-center justify-evenly rounded-xl">
                    <button onClick={() => setMode('buy')} 
                        className={`rounded-xl px-10 py-3 m-2 bg-green-500 text-white shadow-sm
                        ${mode === 'buy' ? '' 
                                         : 'text-gray-600 hover:text-gray-900'}`}
                    >
                        Buy
                    </button>
                    <button onClick={() => setMode('sell')} 
                        className={`rounded-xl px-10 py-3 m-2 bg-red-500 text-white shadow-sm
                        ${mode === 'sell' ? '' 
                                          : 'text-gray-600 hover:text-gray-900'}`}
                    >
                        Sell
                    </button>
                    <div className='m-4 flex flex-col items-center'>
                        <label className='mb-3'>Quantity</label>
                        <input
                            type="text"
                            placeholder='Enter Quantity'
                            value={quantity}
                            onChange={(e) => handleQuantityChange(e.target.value)}
                            className="border-white rounded-xl p-1 m-1"
                        ></input>
                    </div>
                    <button 
                        className='rounded-xl px-10 m-2 bg-[var(--seafoam)]'
                        type='button'
                        onClick={handleMax}
                    >
                        MAX
                    </button>
                </div>
                <div className='flex flex-col'>
                    <div className='flex justify-evenly'>
                        <label className='text-xl m-3'>Price: {currentPrice}</label>
                        <label className='text-xl m-3'>Total: {totalCost}</label>
                    </div>
                    <button
                        type='submit'
                        className={`w-full p-2 self-center border border-[var(--border)] rounded-xl
                            ${mode === 'buy' ? 'bg-green-600' : 'bg-red-600'}
                            ${!isValid() ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={!isValid()}
                    >
                        {mode === 'buy' ? 'Buy' : 'Sell'} {quantity || '0'} units
                    </button>
                </div>
                </form>
            </div>
            </>
        )
    }