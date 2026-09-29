from fastapi import HTTPException, status
from sqlmodel import Session, select
from ..auth.AuthDTOs import EpicStatusDTO
from ...models import User, Portfolio
from ...models.currency import Currency
from .AccountsDTOs import AccountListResponse, AccountResponse, CreateAcountDTO
from ...models import InternationalAccount
from decimal import Decimal
from ..tech_tree.TechTreeService import TechTreeService

ZAR_TO_CURRENCY_RATES: dict[str, Decimal] = {
    "ZAR": Decimal("1"),
    "USD": Decimal("0.0610"),
    "EUR": Decimal("0.0536"),
    "GBP": Decimal("0.0460"),
    "JPY": Decimal("9.57"),
    "CNY": Decimal("0.4094"),
    "AUD": Decimal("0.0869"),
    "CAD": Decimal("0.0864"),
    "CHF": Decimal("0.0507"),
    "SGD": Decimal("0.0780"),
    "SEK": Decimal("0.6070"),
    "KRW": Decimal("82.84"),
    "NOK": Decimal("0.5800"),
    "NZD": Decimal("0.1076"),
    "INR": Decimal("5.86"),
    "MXN": Decimal("1.0840"),
    "TWD": Decimal("1.9600"),
    "BRL": Decimal("0.3173"),
    "DKK": Decimal("0.4020"),
}


class AccountsService:
    def __init__(self,session:Session):
        self.session=session


    def find_currency_code(self,currency_id)->str:
        currency= self.session.get(Currency,currency_id)
        assert currency is not None,"Should not have a currency id with no currency"
        return currency.code
        

    def find_all(self,current_user:User)->AccountListResponse:
        #see if user has a portfolio
        portfolio= self.session.exec(select(Portfolio).where(Portfolio.user_id==current_user.id)).first()
        assert portfolio is not None,"There is no connected portfolio"

        #list all accounts in users portfolio

        results= self.session.exec(select(InternationalAccount).where(InternationalAccount.portfolio_id==portfolio.id))

        accountsResponse:AccountListResponse= AccountListResponse(accounts=[])

        for result in results:

            assert result.id is not None

            account:AccountResponse= AccountResponse(id=result.id,portfolio_id=result.portfolio_id,currency_id=result.currency_id,balance=result.balance,created_at=result.created_at,currency_code=self.find_currency_code(result.currency_id))
            accountsResponse.accounts.append(account)

        return accountsResponse

    def find_by_id(self,account_id:int,current_user:User) -> AccountResponse:

        #get the account
        account = self.session.get(InternationalAccount,account_id)
        if account is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,detail="There is no account with specified id")
        assert account.id is not None

        # check account belongs to user
        
        portfolio= self.session.exec(select(Portfolio).where(Portfolio.user_id==current_user.id)).first()
        assert portfolio is not None,"User has no portfolios"

        if account.portfolio_id != portfolio.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,detail="Account does not belong to authenticated user")

        # return the account
        return AccountResponse(id=account.id,portfolio_id=account.portfolio_id,currency_id=account.currency_id,balance=account.balance,created_at=account.created_at,currency_code=self.find_currency_code(account.currency_id))

    def create(self, data: CreateAcountDTO, current_user: User) -> AccountResponse:
        portfolio = self.session.exec(select(Portfolio).where(Portfolio.user_id == current_user.id)).first()
        assert portfolio is not None, "There is no connected portfolio"
        assert portfolio.id is not None

        currency = self.session.exec(select(Currency).where(Currency.code == data.currency_code)).first()
        if currency is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unknown currency")
        assert currency.id is not None

        cap = self._zar_cap_in_currency(data.currency_code, current_user)
        if data.initial_balance > cap:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    f"Starting balance of {data.initial_balance} {data.currency_code} "
                    f"exceeds your unlocked maximum of {cap} {data.currency_code}"
                ),
            )

        account = InternationalAccount(
            portfolio_id=portfolio.id,
            currency_id=currency.id,
            balance=data.initial_balance,
        )
        self.session.add(account)
        self.session.commit()
        self.session.refresh(account)
        assert account.id is not None

        return AccountResponse(
            id=account.id,
            portfolio_id=account.portfolio_id,
            currency_id=account.currency_id,
            balance=account.balance,
            created_at=account.created_at,
            currency_code=self.find_currency_code(account.currency_id),
        )

    @staticmethod
    def get_status()-> EpicStatusDTO:
        return EpicStatusDTO(
                epic="International Accounts",
                status="Healthy"
                )

    @staticmethod
    def _zar_cap_in_currency(currency_code: str, user: User) -> Decimal:
        code = currency_code.upper()
        rate = ZAR_TO_CURRENCY_RATES.get(code)
        if rate is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"No exchange rate configured for currency '{code}'",
            )
        zar_cap = TechTreeService.max_sandbox_balance(user)
        return (zar_cap * rate).quantize(Decimal("0.01"))