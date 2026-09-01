import {
    InternationalAccount, InternationalAccountSchema, InternationalAccountsResponseSchema,
    RegisterLoginResponse,
    RegisterLoginResponseSchema
} from "../types/accounts";
import {Currency} from "../types/currencies";
import {apiClient} from "@/lib/api";

export async function fetchAllInternationalAccounts(): Promise<InternationalAccount[]> {
    const res = await apiClient("/accounts");
    //if (!res) throw new Error(`Failed to fetch accounts: ${res}`);
    const data = InternationalAccountsResponseSchema.parse(await res);
    return data.accounts;
}

export async function createAccount(currencyCode:Currency, initialBalance:number): Promise<InternationalAccount> {
    const res = await apiClient("/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: {
            "currency_code": currencyCode,
            "initial_balance": initialBalance,
        },
    });

    //if (!res.ok) throw new Error(`Failed to create international account: ${res.status}`);

    return InternationalAccountSchema.parse(await res);
}

export async function register(fullName:string, email:string, password:string): Promise<RegisterLoginResponse>{
    const data = await apiClient('/auth/register', {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: { full_name: fullName, email, password }
    });

    //if(!data.ok)throw new Error(`Failed to register account: ${data.status}`);

    return RegisterLoginResponseSchema.parse(await data);
}

export async function login(email:string, password:string): Promise<RegisterLoginResponse>{
    const data = await apiClient('/auth/login', {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: { email, password }
    });

    //if(!data.ok)throw new Error(`Failed to login to account: ${data.status}`);

    return RegisterLoginResponseSchema.parse(await data);
}

export async function loginWithGoogle(idToken:string): Promise<RegisterLoginResponse>{
    const data = await apiClient('/auth/google', {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: { id_token: idToken }
    });

    return RegisterLoginResponseSchema.parse(await data);
}