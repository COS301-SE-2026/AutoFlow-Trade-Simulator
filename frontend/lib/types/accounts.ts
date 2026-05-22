import { z } from "zod";
import {Currency} from "@/lib/types/currencies";

const currencies = Object.keys(Currency) as [string, ...string[]];

export const InternationalAccountSchema = z.object({
    id: z.number().int().nonnegative(),
    portfolio_id: z.number().int().nonnegative(),
    currency_id: z.number().int().nonnegative(),
    currency_code: z.enum(currencies),
    balance: z.string().regex(/^\d+$/),
    created_at: z.coerce.date(),
});

export const InternationalAccountsResponseSchema = z.object({
    accounts: z.array(InternationalAccountSchema),
});

export type InternationalAccount = z.infer<typeof InternationalAccountSchema>;
export type InternationalAccountsResponse = z.infer<typeof InternationalAccountsResponseSchema>;

export const RegisterLoginResponseSchema = z.object({
   access_token: z.string(),
   token_type: z.string(),
});

export type RegisterLoginResponse = z.infer<typeof RegisterLoginResponseSchema>;