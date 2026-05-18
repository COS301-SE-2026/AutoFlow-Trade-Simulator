"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Currency } from "@/lib/types/currencies"
import { useAccount } from "@/lib/hooks/accountContext"

export function CreateNewInternationalAccount() {
    const { create } = useAccount()
    const [currency, setCurrency] = useState<Currency | null>(null)
    const [initialBalance, setInitialBalance] = useState(100)
    const [open, setOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    async function handleSubmit() {
        if (!currency) return

        setIsSubmitting(true)
        try {
            await create(currency, initialBalance)
            setOpen(false)
        } catch (err) {
            console.error("Failed to create account:", err)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline">Add new Account</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-sm hero">
                    <DialogHeader>
                        <DialogTitle>Add New International Account</DialogTitle>
                        <DialogDescription>
                            Here you can add demo accounts in different major world currencies.
                        </DialogDescription>
                    </DialogHeader>
                    <FieldGroup>
                        <Field>
                            <Label htmlFor="role-1">Currency</Label>
                            <Select name="role" onValueChange={(val) => setCurrency(val as Currency)}>
                                <SelectTrigger id="role-1" className="w-full">
                                    <SelectValue placeholder="Select a currency" />
                                </SelectTrigger>
                                <SelectContent style={{
                                    backgroundColor: 'var(--accent-strong)',
                                    color: 'var(--text)',
                                }}>
                                    <SelectGroup>
                                        {Object.values(Currency)?.map((curr) => (
                                            <SelectItem key={curr} value={curr}>
                                                {curr}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </Field>
                        <Field>
                            <Label htmlFor="initialBalance-1">Initial Balance</Label>
                            <Input
                                type="number"
                                id="initialBalance-1"
                                name="initialBalance"
                                defaultValue="100.00"
                                onChange={(e) => setInitialBalance(Number(e.target.value))}
                            />
                        </Field>
                    </FieldGroup>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button
                            type="button"
                            disabled={!currency || isSubmitting}
                            onClick={handleSubmit}
                        >
                            {isSubmitting ? "Creating..." : "Confirm"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
        </Dialog>
    )
}