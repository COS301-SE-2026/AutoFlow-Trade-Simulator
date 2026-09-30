'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import TradeConfirmModal from './TradeConfirmModal';
import { Minus, Plus } from 'lucide-react';

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
            if (value === '' || /^\d+(?:\.\d{1,2})?$/.test(value)) {
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
                console.error(e);
            } finally {
                setIsSubmitting(false);
                setShowConfirm(false);
            }
        }

        const handleConfirmTrade = () => {
            setShowConfirm(false);
            handleConfirm();
        }

        const handleCancelTrade = () => {
            setShowConfirm(false);
        }

        const qtyNum = Number.parseFloat(quantity) || 0;
        const hasQuantity = qtyNum > 0;

        const step = (delta: number) => {
            const next = Math.max(0, Math.round((qtyNum + delta) * 100) / 100);
            setQuantity(next === 0 ? '' : String(next));
        };

        const tradeBtn =
            'inline-flex h-12 flex-1 items-center justify-center rounded-xl text-[15px] font-semibold text-white transition-[background-color,transform,opacity] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100';
        const chip =
            'tabular rounded-lg border border-white/10 px-2.5 py-1 text-xs font-medium text-white/70 transition-colors hover:border-white/25 hover:text-white disabled:opacity-30 disabled:hover:border-white/10';

        return (
            <>
            <div className="w-full rounded-2xl border border-[var(--border)] bg-[rgba(14,14,22,0.75)] p-5">
                <form onSubmit={handleSubmit} className="flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-8">
                    <div className="flex flex-col gap-4 lg:w-[380px] lg:shrink-0">
                        <div className="flex flex-col gap-2">
                            <label htmlFor="trade-quantity" className="text-sm font-medium text-white/80">Quantity</label>
                            <div className="flex h-12 items-center rounded-xl border border-white/10 bg-white/[0.04] transition-colors hover:border-white/20 focus-within:border-[var(--blue)] focus-within:ring-2 focus-within:ring-[rgba(28,117,188,0.35)]">
                                <button type="button" aria-label="Decrease quantity" onClick={() => step(-1)} disabled={!hasQuantity} className="flex h-full w-12 shrink-0 items-center justify-center text-white/70 transition-colors hover:text-white disabled:opacity-30">
                                    <Minus aria-hidden="true" className="h-4 w-4" />
                                </button>
                                <input
                                    id="trade-quantity"
                                    name="quantity"
                                    type="text"
                                    inputMode="decimal"
                                    autoComplete="off"
                                    placeholder="Enter Quantity"
                                    value={quantity}
                                    onChange={(e) => handleQuantityChange(e.target.value)}
                                    className="tabular h-full min-w-0 flex-1 bg-transparent text-center text-lg font-semibold text-white placeholder:text-[15px] placeholder:font-normal placeholder:text-white/35 focus:outline-none focus-visible:outline-none"
                                />
                                <button type="button" aria-label="Increase quantity" onClick={() => step(1)} className="flex h-full w-12 shrink-0 items-center justify-center text-white/70 transition-colors hover:text-white">
                                    <Plus aria-hidden="true" className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <button type="button" className={chip} disabled={maxBuyable <= 0} onClick={() => setQuantity(String(maxBuyable))}>
                                    Max buy {maxBuyable.toLocaleString()}
                                </button>
                                <button type="button" className={chip} disabled={maxSellable <= 0} onClick={() => setQuantity(String(maxSellable))}>
                                    Max sell {maxSellable.toLocaleString()}
                                </button>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                type='button'
                                disabled={!hasQuantity}
                                onClick={() => {setShowConfirm(true); setMode('buy'); }}
                                className={`${tradeBtn} bg-[var(--green)] hover:bg-[#00a84e]`}
                            >
                                Buy
                            </button>
                            <button
                                type='button'
                                disabled={!hasQuantity}
                                onClick={() => {setShowConfirm(true); setMode('sell'); }}
                                className={`${tradeBtn} bg-[#d4262d] hover:bg-[var(--red)]`}
                            >
                                Sell
                            </button>
                        </div>
                    </div>

                    <dl className="tabular grid flex-1 grid-cols-1 content-start gap-x-8 gap-y-3 rounded-xl border border-[var(--border)] bg-white/[0.02] p-4 text-[15px] sm:grid-cols-2">
                        <div className="flex items-baseline justify-between gap-4">
                            <dt className="text-white/60">Available Balance</dt>
                            <dd className="font-semibold text-[var(--green-light)]">{accountBalance?.toFixed(4)}</dd>
                        </div>
                        <div className="flex items-baseline justify-between gap-4">
                            <dt className="text-white/60">Current Holdings</dt>
                            <dd className="font-semibold text-[#6fb4ea]">{currentHoldings.toFixed(0)} units</dd>
                        </div>
                        <div className="flex items-baseline justify-between gap-4">
                            <dt className="text-white/60">Price per unit</dt>
                            <dd className="font-semibold">{currentPrice.toFixed(2)}</dd>
                        </div>
                        <div className="flex items-baseline justify-between gap-4">
                            <dt className="text-white/60">Estimated Total:</dt>
                            <dd className="font-semibold">{totalCost.toFixed(2)}</dd>
                        </div>
                        {hasQuantity && (
                            <div className="flex items-baseline justify-between gap-4">
                                <dt className="text-white/60">Quantity</dt>
                                <dd className="font-semibold text-[var(--green-light)]">{quantity} units</dd>
                            </div>
                        )}
                    </dl>
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