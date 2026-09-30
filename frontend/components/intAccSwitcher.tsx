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
import Image from "next/image";

interface AccountSelectorProps {
    placeholder?: string;
    label?: string;
    onChange?: (account: InternationalAccount) => void;
    required?: boolean;
}

export function AccountSelector({ placeholder = "Select account", label, onChange, required }: AccountSelectorProps) {
    const { accounts, activeAccount, isLoading, update, refetchAccounts } = useAccount();

    function handleChange(id: string) {
        const selected = accounts?.find((a) => a.id === Number(id));
        if (selected) {
            update(selected);
            onChange?.(selected)
        }
    }

    return (
        <div>
            {label && (
                <label className="mb-1 block text-xs font-medium text-white/60">
                    {label}
                </label>
            )}
            <Select value={activeAccount?.id.toString()}
            key={activeAccount?.balance} 
            onValueChange={handleChange} 
            onOpenChange={(open) => {
                if (open) refetchAccounts();
            }}
            required={required} 
            disabled={isLoading || !accounts?.length}>
                <SelectTrigger aria-label="Active account" className="tabular-nums h-9 min-w-[160px] rounded-lg border border-white/10 bg-white/[0.04] px-3 text-[13.5px] font-semibold text-white transition-colors hover:border-white/20 hover:bg-white/[0.07]">
                    <SelectValue placeholder={isLoading ? "Loading..." : placeholder} />
                </SelectTrigger>
                <SelectContent className="rounded-xl border border-white/10 bg-[#12121c] text-white">
                    <SelectGroup>
                        {accounts?.map((account) => {
                            const formattedBalance = Number.parseFloat(account.balance).toFixed(2);
                            const flag = account.currency_code.substring(0, 2).toLocaleLowerCase();

                            return(
                            <SelectItem key={account.id} value={account.id.toString()} className="tabular-nums py-2.5 text-sm focus:bg-white/10">
                                <Image
                                    src={`https://flagcdn.com/w20/${flag}.png`}
                                    className="flag inline-block mr-2 w-5 h-auto"
                                    alt=""
                                    width={20}
                                    height={15}
                                />
                                {account.currency_code} {formattedBalance}
                            </SelectItem>
                            );
                    })}
                    </SelectGroup>
                </SelectContent>
            </Select>
        </div>
    );
}