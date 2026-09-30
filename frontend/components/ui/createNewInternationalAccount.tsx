"use client"
import { useState, useMemo, useEffect } from "react"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Field, FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Currency } from "@/lib/types/currencies"
import { useAccount } from "@/lib/hooks/accountContext"

import { convertCurrency } from "@/lib/currency"
import {useSandboxCap} from "@/hooks/useSandBoxCap";
import { Plus } from "lucide-react";

const fieldLabel = "mb-1.5 block text-xs font-medium text-white/60"
const fieldInput = "h-10 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm text-white transition-colors hover:border-white/20 focus:border-[var(--blue)] focus:outline-none focus:ring-2 focus:ring-[rgba(28,117,188,0.35)]"

export function CreateNewInternationalAccount() {
    const { create } = useAccount()
    const { zarCap, loading: capLoading } = useSandboxCap()
    const [currency, setCurrency] = useState<Currency | null>(null)
    const [initialBalance, setInitialBalance] = useState(100)
    const [open, setOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState<string | null>(null)

    const cap = useMemo(
        () => (currency ? convertCurrency(zarCap, "ZAR", currency) : null),
        [currency, zarCap]
    )
    const currencyUnsupported = currency !== null && cap === null
    const overCap = cap !== null && initialBalance > cap

    useEffect(() => {
        if (cap !== null) setInitialBalance((prev) => (prev > cap ? cap : prev))
    }, [cap])

    async function handleSubmit() {
        if (!currency || overCap || currencyUnsupported) return
        setIsSubmitting(true)
        setSubmitError(null)
        try { await create(currency, initialBalance); setOpen(false) }
        catch (err: any) { setSubmitError(err?.message ?? "Failed to create account") }
        finally { setIsSubmitting(false) }
    }

    return (
        <Dialog open={open} onOpenChange={(v) => {
            setOpen(v)
            if (!v) {
                setCurrency(null)
                setInitialBalance(100)
                setSubmitError(null)
            }
        }}>
            <DialogTrigger asChild>
                <button
                    type="button"
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[rgba(28,117,188,0.18)] px-3.5 text-[13.5px] font-semibold text-[#8cc4ef] ring-1 ring-inset ring-[rgba(28,117,188,0.4)] transition-colors hover:bg-[rgba(28,117,188,0.28)] hover:text-white active:scale-[0.98]"
                >
                    <Plus aria-hidden="true" className="h-4 w-4" strokeWidth={2.5} />
                    Add account
                </button>
            </DialogTrigger>

            <DialogContent className="rounded-2xl border border-white/10 bg-[#12121c] text-white shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)] sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-lg font-semibold text-white">Add international account</DialogTitle>
                    <DialogDescription className="text-sm text-[var(--muted)]">Open a demo account in a major world currency.</DialogDescription>
                </DialogHeader>

                <FieldGroup className="mt-2 flex flex-col gap-4">
                    <Field>
                        <Label id="new-acc-currency" className={fieldLabel}>Currency</Label>
                        <Select name="role" value={currency ?? undefined} onValueChange={(val) => setCurrency(val as Currency)}>
                            <SelectTrigger aria-labelledby="new-acc-currency" className={`${fieldInput} flex items-center`}>
                                <SelectValue placeholder="Select a currency" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border border-white/10 bg-[#12121c] text-white">
                                <SelectGroup>
                                    {Object.values(Currency)?.map((curr) => (
                                        <SelectItem key={curr} value={curr} className="text-sm focus:bg-white/10">{curr}</SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </Field>

                    <Field>
                        <Label htmlFor="new-acc-balance" className={fieldLabel}>Initial balance</Label>
                        <div className="flex gap-2">
                            <Input
                                id="new-acc-balance"
                                name="initial-balance"
                                type="number"
                                inputMode="decimal"
                                autoComplete="off"
                                value={initialBalance}
                                onChange={(e) => setInitialBalance(Number(e.target.value))}
                                max={cap ?? undefined}
                                min={0}
                                aria-invalid={overCap || undefined}
                                className={`${fieldInput} tabular-nums [color-scheme:dark] ${overCap ? 'border-[rgba(237,28,36,0.6)]' : ''}`}
                            />
                            {cap !== null && !capLoading && (
                                <button
                                    type="button"
                                    onClick={() => setInitialBalance(cap)}
                                    className="h-10 shrink-0 rounded-lg border border-white/10 px-3 text-xs font-semibold text-white/75 transition-colors hover:border-white/25 hover:text-white"
                                >
                                    Use max
                                </button>
                            )}
                        </div>
                        {currency && capLoading && (
                            <p className="mt-1.5 text-xs text-[var(--muted)]">Loading your unlocked limit…</p>
                        )}
                        {currency && !capLoading && cap !== null && (
                            <p className="tabular-nums mt-1.5 text-xs text-[var(--muted)]">
                                Max for {currency}: <strong className="text-white/85">{cap.toLocaleString()}</strong> ({zarCap.toLocaleString()} ZAR)
                            </p>
                        )}
                        {currencyUnsupported && (
                            <p role="alert" className="mt-1.5 text-xs text-[#ff6b72]">This currency is not yet supported for account creation.</p>
                        )}
                        {overCap && (
                            <p role="alert" className="mt-1.5 text-xs text-[#ff6b72]">Exceeds your unlocked maximum. Unlock higher tiers in the tech tree.</p>
                        )}
                    </Field>
                </FieldGroup>

                {submitError && (
                    <p role="alert" className="mt-1 text-xs text-[#ff6b72]">{submitError}</p>
                )}

                <DialogFooter className="mt-2 gap-2">
                    <DialogClose asChild>
                        <button type="button" className="h-10 rounded-lg border border-white/10 px-4 text-sm font-semibold text-white/80 transition-colors hover:bg-white/[0.05] hover:text-white">
                            Cancel
                        </button>
                    </DialogClose>
                    <button
                        type="button"
                        disabled={!currency || isSubmitting || overCap || currencyUnsupported || capLoading}
                        onClick={handleSubmit}
                        className="h-10 rounded-lg bg-[var(--blue)] px-5 text-sm font-semibold text-white transition-[background-color,transform,opacity] hover:bg-[#2385d1] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 disabled:active:scale-100"
                    >
                        {isSubmitting ? "Creating…" : "Confirm"}
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
