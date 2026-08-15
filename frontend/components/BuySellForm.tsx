'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import TradeConfirmModal from './TradeConfirmModal';

type OrderType = 'market' | 'limit';

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
        const [showConfirm, setShowConfirm] = useState(false);
        const [isSubmitting, setIsSubmitting] = useState(false);

        const currentPrice = price || 0;
        const totalCost = Number.parseFloat(quantity) * currentPrice || 0;
        const maxBuyable = currentPrice > 0 ? Math.floor(accountBalance / currentPrice) : 0;
        const maxSellable = currentHoldings;

        const handleQuantityChange = (value: string) => {
            if (value === '' || /^\d*\.?\d*$/.test(value)) {
                setQuantity(value);
            }
        }

        const handleSubmit = (e: React.SubmitEvent) => {
            e.preventDefault();
            const qty = Number.parseFloat(quantity);
            if (!(qty) || qty <= 0) { return; }

            setShowConfirm(true);
        }

        const handleConfirm = async () => {
            setIsSubmitting(true);
            const qty = Number.parseFloat(quantity);

            try {
                if (mode === 'buy' && onBuy) {
                    await onBuy(qty);
                } else if (mode === 'sell' && onSell) {
                    await onSell(qty);
                }
                setQuantity('');
            } catch (e: any) {
                throw e;
            } finally {
                setIsSubmitting(false);
                setShowConfirm(false);
            }
        }

        const isValid = () => {
            const qty = Number.parseFloat(quantity);
            if (!(qty) || qty <= 0) { return false; }

            if (mode === 'buy') {
                return qty <= maxBuyable && qty * currentPrice <= accountBalance;
            } else {
                return qty <= maxSellable && qty > 0;
            }
        };

        const handleConfirmTrade = () => {
            setShowConfirm(false);
            handleConfirm();
        }

        const handleCancelTrade = () => {
            setShowConfirm(false);
        }

        return (
            <>
            <div className="flex flex-col rounded-xl shadow-sm border border-white p-4 w-full">
                <form onSubmit={handleSubmit}>
                    <div className="m-3 border border-solid border-[var(--border)] bg-[rgba(20,20,32,0.6)] flex flex-row items-center justify-evenly rounded-xl">
                    <div className='m-4 flex flex-col items-center'>
                        <span className='mb-3'>Quantity</span>
                        <input
                            type="text"
                            placeholder='Enter Quantity'
                            value={quantity}
                            onChange={(e) => handleQuantityChange(e.target.value)}
                            className="border-white rounded-xl p-1 m-1"
                        ></input>
                    </div>
                    <button 
                        type='button'
                        disabled={!quantity || Number.parseFloat(quantity) <= 0}
                        onClick={() => {setShowConfirm(true); setMode('buy'); }} 
                        className={`rounded-xl px-10 py-3 m-2 bg-green-500 text-white shadow-sm hover:text-gray-900
                        ${quantity && Number.parseFloat(quantity) > 0 
                            ? 'bg-green-500 active:scale-95' 
                            : 'bg-slate-700 opacity-50 cursor-not-allowed'
                        }`}
                    >
                        Buy
                    </button>
                    <button 
                        type='button'
                        disabled={!quantity || Number.parseFloat(quantity) <= 0}
                        onClick={() => {setShowConfirm(true); setMode('sell'); }} 
                        className={`rounded-xl px-10 py-3 m-2 bg-red-500 text-white shadow-sm hover:text-gray-900
                        ${quantity && Number.parseFloat(quantity) > 0 
                            ? 'bg-green-500 active:scale-95' 
                            : 'bg-slate-700 opacity-50 cursor-not-allowed'
                        }`}
                    >
                        Sell
                    </button>
                </div>
                <div className='flex flex-col'>

                    <div className='border border-[var(--border)] rounded-xl bg-[rgba(20,20,32,0.3)] p-4 m-3'>
                        <div className='flex flex-col gap-3'>
                            <div className='flex justify-between items-center'>
                                <span className='text-lg'>Available Balance</span>
                                <span className='text-xl font-bold text-green-400'>{accountBalance?.toFixed(4)}</span>
                            </div>
                            <div className='flex justify-between items-center'>
                                <span className='text-lg'>Current Holdings</span>
                                <span className='text-xl font-bold text-blue-400'>{currentHoldings.toFixed(0)} units</span>
                            </div>
                            <div className='border-b border-[var(--border)] my-1'></div>
                            <div className='flex justify-between items-center'>
                                <span className='text-lg'>Price per unit</span>
                                <span className='text-xl font-bold'>{currentPrice.toFixed(2)}</span>
                            </div>
                            <div className='flex justify-between items-center'>
                                <span className='text-lg'>Estimated Total:</span>
                                <span className='text-xl font-bold'>{totalCost.toFixed(2)}</span>
                            </div>
                            {quantity && Number.parseFloat(quantity) > 0 && (
                                <div className='flex justify-between items-center'>
                                    <span className='text-lg'>Quantity</span>
                                    <span className='text-xl font-bold text-green-400'>{quantity} units</span>
                                </div>
                            )}
                        </div>
                    </div>
         
                </div>
                </form>
            </div>

            {showConfirm && (
                <TradeConfirmModal 
                    side={mode}
                    quantity={Number.parseFloat(quantity)}
                    price={price}
                    orderType={'market'}
                    limitPrice={10}
                    onConfirm={handleConfirmTrade}
                    onCancel={handleCancelTrade}
                />
            )}
            </>
        )
    }