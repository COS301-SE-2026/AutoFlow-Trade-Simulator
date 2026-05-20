"use client";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {useAccount} from "@/lib/hooks/accountContext";
import type {InternationalAccount} from "@/lib/types/accounts";

interface AccountSelectorProps {
    placeholder?: string;
    label?: string;
    onChange?: (account: InternationalAccount) => void;
    required?: boolean;
}

export function AccountSelector({
                                    placeholder = "Select account",
                                    label,
                                    onChange,
                                    required,
                                }: AccountSelectorProps) {
    const {accounts, activeAccount, isLoading, update} = useAccount();

    function handleChange(id: string) {
        const account = accounts?.find((a) => a.id === Number(id));
        if (account) {
            update(account);
            onChange?.(account);
        }
    }

    return (
        <div className="space-y-2">
            {label && <label>{label}</label>}

            <Select
                value={activeAccount?.id.toString()}
                onValueChange={handleChange}
                required={required}
                disabled={isLoading || !accounts?.length}
            >
                <SelectTrigger>
                    <SelectValue placeholder={isLoading ? "Loading..." : placeholder}/>
                </SelectTrigger>

                <SelectContent style={{
                    backgroundColor: 'var(--accent-strong)',
                    color: 'var(--text)',
                }}>
                    <SelectGroup>
                        {accounts?.map((account) => (
                            <SelectItem key={account.id} value={account.id.toString()}>
                                Acc #{account.id} - {account.balance}
                            </SelectItem>
                        ))}
                    </SelectGroup>
                </SelectContent>
            </Select>
        </div>
    );
}