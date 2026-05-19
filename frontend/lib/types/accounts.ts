import { z } from "zod";

export const InternationalAccountSchema = z.object({
    id: z.number().int().nonnegative(),
    portfolio_id: z.number().int().nonnegative(),
    currency_id: z.number().int().nonnegative(),
    balance: z.string().regex(/^\d+$/),
    created_at: z.string().datetime(),
});

export const InternationalAccountsResponseSchema = z.object({
    accounts: z.array(InternationalAccountSchema),
});

export type InternationalAccount = z.infer<typeof InternationalAccountSchema>;
export type InternationalAccountsResponse = z.infer<typeof InternationalAccountsResponseSchema>;