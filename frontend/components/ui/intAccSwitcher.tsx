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

const actionStyle = {
    border: '1px solid rgba(105, 80, 161, 0.55)',
    background: 'rgba(38, 34, 98, 0.45)',
    color: '#fff',
    borderRadius: '12px',
    fontSize: '13.5px',
    fontWeight: 700,
} as const;

export function AccountSelector({ placeholder = "Select account", label, onChange, required }: AccountSelectorProps) {
    const { accounts, activeAccount, isLoading, update } = useAccount();

    function handleChange(id: string) {
        const account = accounts?.find((a) => a.id === Number(id));
        if (account) { update(account); onChange?.(account); }
    }

    return (
        <div>
            {label && (
                <label style={{ fontSize: '11px', color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                    {label}
                </label>
            )}
            <Select value={activeAccount?.id.toString()} onValueChange={handleChange} required={required} disabled={isLoading || !accounts?.length}>
                <SelectTrigger style={{ ...actionStyle, padding: '9px 14px', height: 'auto', minWidth: '160px' }} className="hover:border-purple-500/60">
                    <SelectValue placeholder={isLoading ? "Loading..." : placeholder} />
                </SelectTrigger>
                <SelectContent style={{
                    background: 'rgba(20, 20, 38, 0.95)',
                    border: '1px solid rgba(105, 80, 161, 0.4)',
                    backdropFilter: 'blur(16px)',
                    color: '#fff',
                    borderRadius: '12px',
                }}>
                    <SelectGroup>
                        {accounts?.map((account) => (
                            <SelectItem key={account.id} value={account.id.toString()} className="py-3 text-base">
                                <Image
                                    src={`https://flagcdn.com/w20/${account.currency_code.substring(0, 2).toLowerCase()}.png`}
                                    className="flag inline-block mr-2 w-5 h-auto"
                                    alt=""
                                    width={20}
                                    height={15}
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