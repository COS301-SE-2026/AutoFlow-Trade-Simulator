import { fetchAllInternationalAccounts, createAccount, register, login, loginWithGoogle } from '@/lib/api/accounts';
import { apiClient } from '@/lib/api';
import { Currency } from '@/lib/types/currencies';
import { InternationalAccount, RegisterLoginResponse } from '@/lib/types/accounts';

jest.mock("@/lib/api", () => ({
  apiClient: jest.fn()
}));

const mockApiClient = apiClient as jest.MockedFunction<typeof apiClient>;

describe("Accounts API Service", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    describe("FetchAllInternationalAccounts", () => {
        it('should fetch internatinal accounts', async () => {
          const mockApiResponse = { accounts: 
            [{
              id: 1,
              portfolio_id: 10,
              currency_id: 100,
              created_at: new Date(),
              currency_code: "USD" as Currency,
              balance: "1000",
            },
            {
              id: 2,
              portfolio_id: 10,
              currency_id: 101,
              created_at: new Date(),
              currency_code: "EUR" as Currency,
              balance: "500",
            }]
          }

          mockApiClient.mockResolvedValueOnce(mockApiResponse);

          const result = await fetchAllInternationalAccounts();

          expect(mockApiClient).toHaveBeenCalledWith("/accounts");
          expect(mockApiClient).toHaveBeenCalledTimes(1);
          expect(result).toEqual(mockApiResponse.accounts)
        });

        it("should throw a zod validation error if an invalid payload is sent", async () => {
          const invalidApiResponse = { accounts: "Goodbye World! "};

          mockApiClient.mockResolvedValueOnce(invalidApiResponse);

          await expect(fetchAllInternationalAccounts()).rejects.toThrow();
        });
    });

    describe("createAccount", () => {
        it("should post a new account payload and return parsed created account", async () => {
          const mockCurrency: Currency = "USD" as Currency;
          const initialBalance = 250;
          const mockCreatedAccount: InternationalAccount = {
              id: 123,
              portfolio_id: 10,
              currency_id: 100,
              created_at: new Date(),
              currency_code: mockCurrency,
              balance: "250",
          }

          mockApiClient.mockResolvedValueOnce(mockCreatedAccount);

          const result = await createAccount(mockCurrency, initialBalance);

          expect(mockApiClient).toHaveBeenCalledWith("/accounts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: {
              currency_code: mockCurrency,
              initial_balance: initialBalance
            }
          });

          expect(result).toEqual(mockCreatedAccount);

        });
    });

    describe("register", () => {
      it("should post registration data and return an auth response", async () => {
        const mockAuthResponse: RegisterLoginResponse = {
          access_token: "A tottally legit JWT token",
          token_type: "bearer"
        };

        mockApiClient.mockResolvedValueOnce(mockAuthResponse);

        const result = await register("John Doe", "test@example.com", "password123");

        expect(mockApiClient).toHaveBeenCalledWith("/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: {
            full_name: "John Doe",
            email: "test@example.com",
            password: "password123"
          }
        });
        expect(result).toEqual(mockAuthResponse);
      });
    });

    describe("login", () => {
      it("should post credentials and return auth response", async () => {
        const mockAuthResponse: RegisterLoginResponse = {
          //Click it if you want to
          access_token: "https://www.youtube.com/watch?v=xvFZjo5PgG0",
          token_type: "bearer"
        };

        mockApiClient.mockResolvedValueOnce(mockAuthResponse);

        const result = await login("test@example.com", "password123");

        expect(mockApiClient).toHaveBeenCalledWith("/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: {
            email: "test@example.com",
            password: "password123"
          }
        });
        expect(result).toEqual(mockAuthResponse);
      });
    });

    describe("loginWithGoogle", () => {
      it("should post Google ID token and return auth response", async () => {
        const mockAuthResponse: RegisterLoginResponse = {
          access_token: "google-jwt-token",
          token_type: "bearer"
        };

        mockApiClient.mockResolvedValueOnce(mockAuthResponse);

        const result = await loginWithGoogle("google-id-token-123");

        expect(mockApiClient).toHaveBeenCalledWith("/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: { id_token: "google-id-token-123" } 
        });
        expect(result).toEqual(mockAuthResponse);
      })
    });
});