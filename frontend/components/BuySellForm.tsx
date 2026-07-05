'use client';

import { useState } from 'react';
import { usePrices } from '@/hooks/usePrices';
import { Button } from '@/components/ui/button';

interface BuySellFormProps {
    price: number;
    accountBalance: number;
    currentHoldings: number;
    onBuy?: (quantity: number, orderType: 'market' | 'limit' | 'stop-loss', limitPrice?: number) => void;
    onSell?: (quantity: number, orderType: 'market' | 'limit' | 'stop-loss', limitPrice?: number) => void;
}

export default function BuySellForm({
    price,
    accountBalance,
    currentHoldings,
    onBuy,
    onSell}: BuySellFormProps) {
        const [mode, setMode] = useState<'buy' | 'sell'>('buy');
        const [quantity, setQuantity] = useState('');
        const [orderType, setOrderType] = useState<'market' | 'limit' | 'stop-loss'>('market');
        const [limitPrice, setLimitPrice] = useState('');
        const [stopPrice, setStopPrice] = useState('');

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

        const handleSubmit = (e: React.SubmitEvent) => {
            e.preventDefault();
            const qty = parseFloat(quantity);
            if (!(qty) || qty <= 0) { return; }

            const limitPriceNum = limitPrice ? parseFloat(limitPrice) : undefined;
            const stopPriceNum = stopPrice ? parseFloat(stopPrice) : undefined;

            if (orderType === 'limit' && (!limitPriceNum || limitPriceNum <= 0)) {
                alert('Please enter a valid limit price');
                return;
            }

            if (orderType === 'stop-loss' && (!stopPriceNum || stopPriceNum <= 0)) {
                alert('Please enter a valid stop price');
                return;
            }

            if (mode === 'buy' && onBuy) {
                onBuy(qty, orderType, orderType === 'limit' ? limitPriceNum : undefined);
            } else if (mode === 'sell' && onSell) {
                onSell(qty, orderType, orderType === 'limit' ? limitPriceNum : undefined);
            }
        }

        const isValid = () => {
            const qty = parseFloat(quantity);
            if (!(qty) || qty <= 0) { return false; }
            
            if (orderType === 'limit') {
                const limitPriceNum = parseFloat(limitPrice);
                if (!limitPriceNum || limitPriceNum <= 0) { return false; }
            }

            if (orderType === 'stop-loss') {
                const stopPriceNum = parseFloat(stopPrice);
                if (!stopPriceNum || stopPriceNum <= 0) return false;
            }

            if (mode === 'buy') {
                return qty <= maxBuyable && qty * currentPrice <= accountBalance;
            } else {
                return qty <= maxSellable && qty > 0;
            }
        };

        const getOrderTypeDescription = () => {
            switch(orderType) {
                case 'market':
                    return 'Execute immediately at current market price';
                case 'limit':
                    return `Execute at ${limitPrice || 'specified'} price or better`;
                case 'stop-loss':
                    return `Trigger sell at ${stopPrice || 'specified'} stop price`;
                default:
                    return '';
            }
        };

        return (
            <>
            <div className="flex flex-col rounded-xl shadow-sm border border-white p-4 w-full">
                <form onSubmit={handleSubmit}>
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
                        className='rounded-xl px-10 py-3 m-2 bg-[var(--seafoam)]'
                        type='button'
                        onClick={handleMax}
                    >
                        MAX
                    </button>
                </div>
                <div className='flex flex-col'>
                    <div className='flex justify-evenly'>
                        <Button
                            type='button'
                            onClick={() => {
                                setOrderType('market');
                                setLimitPrice('');
                                setStopPrice('');
                            }}
                            className={`rounded-xl px-10 py-3 m-2 bg-red-500 text-white shadow-sm
                                ${orderType === 'market' ? 'bg-[var(--blue)]' : 'bg-[var(--accent)]'}`}
                        >
                            Market
                        </Button>
                        <Button
                            type='button'
                            onClick={() => {
                                setOrderType('limit');
                                setStopPrice('');
                            }}
                            className={`rounded-xl px-10 py-3 m-2 bg-red-500 text-white shadow-sm
                                ${orderType === 'limit' ? 'bg-[var(--blue)]' : 'bg-[var(--accent)]'}`}
                        >
                            Limit
                        </Button>
                        {mode === 'sell' && (
                            <Button
                                type='button'
                                onClick={() => {
                                    setOrderType('stop-loss');
                                    setLimitPrice('');
                                }}
                                className={`rounded-xl px-10 py-3 m-2 bg-red-500 text-white shadow-sm
                                    ${orderType === 'stop-loss' ? 'bg-[var(--blue)] border-[var(--border)]' : 'bg-[var(--accent)]'}`}
                            >
                                Stop Loss
                            </Button>
                        )}
                    </div>
                    <p className='card'>
                        {getOrderTypeDescription()}
                    </p>
                    {orderType === 'limit' && (
                        <div className='card flex justify-center items-center m-2 gap-2'>
                            <label>Limit Price:</label>
                            <input
                                type='text'
                                placeholder='Enter limit price'
                                value={limitPrice}
                                onChange={(e) => {
                                    if (e.target.value === '' || /[\d]+([.]\d+)?/.test(e.target.value)) {
                                        setLimitPrice(e.target.value);
                                    }
                                }}
                                className='ml-3 border border-[var(--border)] rounded-xl p-2 w-32'
                            >
                            </input>
                            <label>Current Price: {currentPrice.toFixed(2)}</label>
                        </div>
                    )}
                    {orderType === 'stop-loss' && mode === 'sell' && (
                        <div className='card flex justify-center items-center m-2 gap-2'>
                            <label>Stop Price:</label>
                            <input
                                type='text'
                                placeholder='Enter stop price'
                                value={limitPrice}
                                onChange={(e) => {
                                    if (e.target.value === '' || /[\d]+([.]\d+)?/.test(e.target.value)) {
                                        setStopPrice(e.target.value);
                                    }
                                }}
                                className='ml-3 border border-[var(--border)] rounded-xl p-2 w-32'
                            >
                            </input>
                            <label>Current: {currentPrice.toFixed(2)}</label>
                        </div>
                    )}
                    <div className='border border-[var(--border)] rounded-xl bg-[rgba(20,20,32,0.3)] p-4 m-3'>
                        <div className='flex flex-col gap-3'>
                            <div className='flex justify-between items-center'>
                                <span className='text-lg'>Available Balance</span>
                                <span className='text-xl font-bold text-green-400'>{accountBalance.toFixed(2)}</span>
                            </div>
                            <div className='flex justify-between items-center'>
                                <span className='text-lg'>Current Holdings</span>
                                <span className='text-xl font-bold text-blue-400'>{currentHoldings.toFixed(4)} units</span>
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
                            {quantity && parseFloat(quantity) > 0 && (
                                <div className='flex justify-between items-center'>
                                    <span className='text-lg'>Quantity</span>
                                    <span className='text-xl font-bold text-green-400'>{quantity} units</span>
                                </div>
                            )}
                            {!isValid() && quantity && parseFloat(quantity) > 0 && (
                                <div className='text-red-500 text-center mt-2'>
                                    {mode === 'buy' ? 'Insufficient Balance' : 'Insufficient holdings'}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className='flex justify-evenly'>
                        {orderType === 'stop-loss' && mode === 'sell' && stopPrice && (
                            <div className='text-center'>
                                Stop-Loss triggered at {parseFloat(stopPrice).toFixed(2)}
                            </div>
                        )}
                        {orderType === 'limit' && limitPrice && (
                            <div className='text-center'>
                                Limit order at {parseFloat(limitPrice).toFixed(2)}
                            </div>
                        )}
                        {orderType === 'market' && (
                            <div className='text-center'>
                                Market order at current price
                            </div>
                        )}
                    </div>
                    <button
                        type='submit'
                        className={`w-full p-2 self-center border border-[var(--border)] rounded-xl mt-3
                            ${mode === 'buy' ? 'bg-green-600' : 'bg-red-600'}
                            ${!isValid() ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={!isValid()}
                    >
                        {mode === 'buy' ? 'Buy' : 'Sell'} {quantity || '0'} units
                        {orderType !== 'market' && ` (${orderType})`}
                    </button>
                </div>
                </form>
            </div>
            </>
        )
    }