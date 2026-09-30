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

const actionStyle = {
    border: '1px solid rgba(105, 80, 161, 0.55)',
    background: 'rgba(38, 34, 98, 0.45)',
    color: '#fff',
    borderRadius: '12px',
} as const;

const glassInput = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#fff',
    borderRadius: '10px',
    padding: '9px 12px',
    fontSize: '14px',
    width: '100%',
    outline: 'none',
} as const;

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
                <button style={{ ...actionStyle, display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '9px 16px', fontSize: '13.5px', fontWeight: 700, cursor: 'pointer', transition: 'background 0.15s, border-color 0.15s' }}
                        className="hover:bg-[rgba(38,34,98,0.7)] hover:border-purple-500/60">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Add account
                </button>
            </DialogTrigger>

            <DialogContent style={{ background: 'rgba(20, 20, 38, 0.97)', border: '1px solid rgba(105, 80, 161, 0.35)', borderRadius: '20px', color: '#fff', backdropFilter: 'blur(20px)' }}>
                <DialogHeader>
                    <DialogTitle style={{ color: '#fff', fontWeight: 700, fontSize: '17px' }}>Add international account</DialogTitle>
                    <DialogDescription style={{ color: 'var(--muted)', fontSize: '13.5px' }}>Open a demo account in a major world currency.</DialogDescription>
                </DialogHeader>

                <FieldGroup style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
                    <Field>
                        <Label style={{ fontSize: '11px', color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Currency</Label>
                        <Select name="role" value={currency ?? undefined} onValueChange={(val) => setCurrency(val as Currency)}>
                            <SelectTrigger style={{ ...glassInput, display: 'flex', alignItems: 'center', height: 'auto' }} className="hover:border-white/20">
                                <SelectValue placeholder="Select a currency" />
                            </SelectTrigger>
                            <SelectContent style={{ background: 'rgba(20,20,38,0.97)', border: '1px solid rgba(105,80,161,0.35)', borderRadius: '12px', color: '#fff', backdropFilter: 'blur(20px)' }}>
                                <SelectGroup>
                                    {Object.values(Currency)?.map((curr) => (
                                        <SelectItem key={curr} value={curr} className="focus:bg-white/10" style={{ fontSize: '14px' }}>{curr}</SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </Field>

                    <Field>
                        <Label style={{ fontSize: '11px', color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Initial balance</Label>
                        <Input type="number" value={initialBalance} onChange={(e) => setInitialBalance(Number(e.target.value))} max={cap ?? undefined} min={0} style={glassInput} className="hover:border-white/20 focus:border-purple-500/50" />
                        {currency && capLoading && (
                            <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '6px' }}>Loading your unlocked limit…</p>
                        )}
                        {currency && !capLoading && cap !== null && (
                            <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '6px' }}>
                                Max for {currency}: <strong>{cap.toLocaleString()}</strong> ({zarCap.toLocaleString()} ZAR)
                            </p>
                        )}
                        {currencyUnsupported && (
                            <p style={{ fontSize: '12px', color: '#f87171', marginTop: '6px' }}>This currency is not yet supported for account creation.</p>
                        )}
                        {overCap && (
                            <p style={{ fontSize: '12px', color: '#f87171', marginTop: '6px' }}>Exceeds your unlocked maximum. Unlock higher tiers in the tech tree.</p>
                        )}
                    </Field>
                </FieldGroup>

                {submitError && (
                    <p style={{ fontSize: '12px', color: '#f87171', marginTop: '4px' }}>{submitError}</p>
                )}

                <DialogFooter style={{ gap: '8px', marginTop: '8px' }}>
                    <DialogClose asChild>
                        <button style={{ ...glassInput, width: 'auto', padding: '9px 18px', fontWeight: 600, cursor: 'pointer', borderRadius: '10px' }} className="hover:border-white/20">
                            Cancel
                        </button>
                    </DialogClose>
                    <button
                        disabled={!currency || isSubmitting || overCap || currencyUnsupported || capLoading}
                        onClick={handleSubmit}
                        style={{ ...actionStyle, padding: '9px 20px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', transition: 'background 0.15s', opacity: (!currency || isSubmitting || overCap || currencyUnsupported || capLoading) ? 0.45 : 1 }}
                        className="hover:bg-[rgba(38,34,98,0.7)]"
                    >
                        {isSubmitting ? "Creating..." : "Confirm"}
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}