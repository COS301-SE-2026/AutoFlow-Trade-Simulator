import {
    InternationalAccount, InternationalAccountSchema, InternationalAccountsResponseSchema, RegisterAccount,
    RegisterAccountSchema
} from "../types/accounts";
import {Currency} from "../types/currencies";
import {apiClient} from "@/lib/api";

export async function fetchAllInternationalAccounts(): Promise<InternationalAccount[]> {
    const res = await apiClient("/accounts");
    if (!res.ok) throw new Error(`Failed to fetch accounts: ${res.status}`);
    const data = InternationalAccountsResponseSchema.parse(await res.json());
    return data.accounts;
}

export async function createAccount(currencyCode:Currency, initialBalance:number): Promise<InternationalAccount> {
    const res = await apiClient("/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            "currency_code": currencyCode,
            "initial_balance": initialBalance,
        }),
    });

    if (!res.ok) throw new Error(`Failed to create international account: ${res.status}`);

    return InternationalAccountSchema.parse(await res.json());
}

export async function register(fullName:string, email:string, password:string): Promise<RegisterAccount>{
    const data = await apiClient('/auth/register', {
        method: 'POST',
        body: { full_name: fullName, email, password }
    });

    if(!data.ok)throw new Error(`Failed to register account: ${data.status}`);

    return RegisterAccountSchema.parse(await data.json());
}

export async function login(fullName:string, email:string, password:string): Promise<RegisterAccount>{
    const data = await apiClient('/auth/register', {
        method: 'POST',
        body: { full_name: fullName, email, password }
    });

    if(!data.ok)throw new Error(`Failed to register account: ${data.status}`);

    return RegisterAccountSchema.parse(await data.json());
}