'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

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
        const [mode, setMode] = useState<'buy' | 'sell'>();
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

        const handleMax = () => {
            if (mode === 'buy') {
                setQuantity(maxBuyable.toString());
            } else {
                setQuantity(maxSellable.toString());
            }
        };

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
                                <span className='text-xl font-bold text-green-400'>{accountBalance.toFixed(4)}</span>
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

            {/* This will be the buy and sell pop up model toast thingy */}
            { showConfirm == true ?
                <div className='z-50 flex items-center justify-center fixed inset-0 bg-black bg-opacity-40 p-6 backdrop-blur-sm'>
                    <form onSubmit={handleSubmit} className="border-4 border-slate-600 rounded-2xl p-8 card">

                        {/* Card Header */}
                        <p className="font-semibold text-5xl"> Confirmation of { mode === 'buy' ? 'Purchase'  : 'Sale' } </p>

                        {/* Card Body */}
                        <ul className="flex justify-center flex-col gap-2 rounded-xl outline-transparent p-4">
                            <li className="flex justify-between"> 
                                <span className="text-slate-400"> Stock Price: </span>
                                <span className="font-semibold text-white"> { price } </span>
                            </li>
                            <li className="flex justify-between"> 
                                <span className="text-slate-400"> Amount being purchased: </span>
                                <span className="font-semibold text-white"> { quantity } </span>
                            </li>
                            <li className="flex justify-between"> 
                                <span className="text-slate-400"> Total Cost: </span>
                                <span className="font-semibold text-green-400"> {((price || 0) * Number(quantity ||0)).toFixed(2)} </span>
                            </li>
                            <li className="border-b border-slate-700/50 my-1"> </li>
                            <li className="flex justify-between"> 
                                <span className="text-slate-400"> Balance after transaction: </span>
                                { mode === 'buy' ?
                                    <span className="font-semibold text-white"> {(accountBalance - ( (price || 0) * Number(quantity || 0))).toFixed(2)} </span>
                                    :
                                    <span className="font-semibold text-white"> {(accountBalance + ( (price || 0) * Number(quantity || 0))).toFixed(2)} </span>
                                }
                            </li>
                        </ul>


                        {/* Card Footer */}
                        <button
                        onClick={handleConfirm}
                            className={`w-full p-2 self-center border border-[var(--border)] rounded-xl mt-3
                                ${mode === 'buy' ? 'bg-green-600' : 'bg-red-600'}
                                ${!isValid() ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={!isValid()}
                        >
                            {mode === 'buy' ? 'Buy' : 'Sell'} {quantity || '0'} units
                        </button>

                        {!isValid() && quantity && Number.parseFloat(quantity) > 0 && (
                            <div className='text-red-500 text-center mt-2'>
                                {mode === 'buy' ? 'Insufficient Balance' : 'Insufficient holdings'}
                            </div>
                        )}

                        <button 
                            type='button'
                            onClick={() => setShowConfirm(false)} 
                            className="w-full p-2 self-center border border-[var(--border)] rounded-xl mt-3"
                        >
                            Cancel
                        </button>
                    </form>
                </div>
                    
                :

                <div> </div>
            }
            {/* {showConfirm && (
                <div className='z-50 flex items-center justify-center fixed inset-0 bg-black bg-opacity-70 p-6 backdrop-blur-sm'>
                    <div className='card p-6 max-w-md w-full'>
                        <h3 className='text-xl font-bold mb-4'>
                            Confirm {mode === 'buy' ? 'Buy' : 'Sell'}
                        </h3>
                        <div className=' flex flex-col gap-3 mb-6'>
                            <div className='flex justify-between'>
                                <span>Quantity:</span>
                                <span className='font-semibold'>{quantity} units</span>
                            </div>
                            <div className='flex justify-between'>
                                <span>Price per unit:</span>
                                <span className='font-semibold'>{currentPrice.toFixed(2)}</span>
                            </div>
                            <div className='flex justify-between'>
                                <span>Total Cost:</span>
                                <span className='font-semibold'>{totalCost.toFixed(2)}</span>
                            </div>
                            <div className='border-b border-[var(--border)] p-2'></div>
                            <div className='flex justify-between text-gray-400'>
                                <span>Balance <b>after</b> trade:</span>
                                <span className='font-bold text-white'>{mode === 'buy' ? (accountBalance - totalCost).toFixed(2)
                                                       : (accountBalance + totalCost).toFixed(2)}
                                </span>
                            </div>
                            <div className='flex justify-between text-gray-400'>
                                <span>Holdings <b>after</b> trade:</span>
                                <span className='font-bold text-white'>{(mode === 'buy' ? currentHoldings + Number.parseFloat(quantity)
                                                       : currentHoldings - Number.parseFloat(quantity)).toFixed(4)} units
                                </span>
                            </div>
                        </div>
                        <div className='flex gap-3 justify-between'>
                            <button
                                onClick={() => setShowConfirm(false)}
                                disabled={isSubmitting}
                                className='px-4 py-2 flex rounded-xl font-bold border border-[var(--border)] disabled:opacity-50'
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={isSubmitting}
                                className={`px-4 py-2 flex rounded-xl font-bold border 
                                    border-[var(--border)] disabled:opacity-50 
                                    ${mode === 'buy' ? 'bg-green-600' : 'bg-red-600'}`}
                            >
                                {isSubmitting ? 'Processing...' : `Confirm`}
                            </button>
                        </div>
                    </div>
                </div>
            )} */}
            </>
        )
    }