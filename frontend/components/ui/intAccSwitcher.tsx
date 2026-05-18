"use client"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {useAccount} from "@/lib/hooks/accountContext"
import type {InternationalAccount} from "@/lib/types/accounts"

interface AccountSelectorProps {
    value?: number
    placeholder?: string
    label?: string
    onChange?: (account: InternationalAccount) => void
    required?: boolean
}

export function AccountSelector({
                                    value,
                                    placeholder = "Select account",
                                    label,
                                    onChange,
                                    required
                                }: AccountSelectorProps) {
    const {accounts, isLoading} = useAccount()

    function handleChange(id: string) {
        const account = accounts?.find((a) => a.id === Number(id))
        if (account) onChange?.(account)
    }

    return (
        <div className="space-y-2">
            {label && (
                <label>
                    {label}
                </label>
            )}

            <Select
                value={value?.toString()}
                onValueChange={handleChange}
                required={required}
                disabled={isLoading || !accounts?.length}
            >
                <SelectTrigger>
                    <SelectValue placeholder={isLoading ? "Loading..." : placeholder}/>
                </SelectTrigger>

                <SelectContent>
                    <SelectGroup>
                        {accounts?.map((account) => (
                            <SelectItem key={account.id} value={account.id.toString()}>
                                Account #{account.id} — {account.balance}
                            </SelectItem>
                        ))}
                    </SelectGroup>
                </SelectContent>
            </Select>
        </div>
    )
}