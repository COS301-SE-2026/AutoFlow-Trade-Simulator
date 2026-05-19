import {InternationalAccount, InternationalAccountSchema, InternationalAccountsResponseSchema} from "../types/accounts";
import {Currency} from "../types/currencies";


export async function fetchAllInternationalAccounts(): Promise<InternationalAccount[]> {
    const res = await fetch("api/accounts");
    if (!res.ok) throw new Error(`Failed to fetch accounts: ${res.status}`);
    const data = InternationalAccountsResponseSchema.parse(await res.json());
    return data.accounts;
}

export async function createAccount(currencyCode:Currency, initialBalance:number): Promise<InternationalAccount> {
    const res = await fetch("api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            "currency_code": currencyCode,
            "initial_balance": initialBalance,
        }),
    });

    if (!res.ok) throw new Error(`Failed to create account: ${res.status}`);

    return InternationalAccountSchema.parse(await res.json());
}