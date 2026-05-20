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
        <div className="space-y-2 w-full max-w-md">
            {label && <label className="text-lg font-medium">{label}</label>}

            <Select
                value={activeAccount?.id.toString()}
                onValueChange={handleChange}
                required={required}
                disabled={isLoading || !accounts?.length}
            >
                <SelectTrigger className="p-4 text-lg h-auto">
                    <SelectValue placeholder={isLoading ? "Loading..." : placeholder}/>
                </SelectTrigger>

                <SelectContent
                    style={{
                        backgroundColor: 'var(--accent-strong)',
                        color: 'var(--text)',
                    }}
                    className="min-w-[var(--radix-select-trigger-width)] text-lg"
                >
                    <SelectGroup>
                        {accounts?.map((account) => (
                            <SelectItem key={account.id} value={account.id.toString()} className="py-3 text-base">
                                <img
                                    src={`https://flagcdn.com/w20/${account.currency_code.substring(0, 2).toLowerCase()}.png`}
                                    className="flag inline-block mr-2 w-5 h-auto"
                                    alt=""
                                />
                                {account.currency_code} {account.balance}
                            </SelectItem>
                        ))}
                    </SelectGroup>
                </SelectContent>
            </Select>
        </div>
    );
}