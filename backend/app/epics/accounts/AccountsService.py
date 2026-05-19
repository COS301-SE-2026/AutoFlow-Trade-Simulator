from fastapi import HTTPException, status
from sqlmodel import Session, select
from ..auth.AuthDTOs import EpicStatusDTO
from ...models import User, Portfolio
from ...models.currency import Currency
from .AccountsDTOs import AccountListResponse, AccountResponse, CreateAcountDTO
from ...models import InternationalAccount


class AccountsService:
    def __init__(self,session:Session):
        self.session=session

    def find_all(self,current_user:User)->AccountListResponse:
        #see if user has a portfolio
        portfolio= self.session.exec(select(Portfolio).where(Portfolio.user_id==current_user.id)).first()
        assert portfolio is not None,"There is no connected portfolio"

        #list all accounts in users portfolio

        results= self.session.exec(select(InternationalAccount).where(InternationalAccount.portfolio_id==portfolio.id))

        accountsResponse:AccountListResponse= AccountListResponse(accounts=[])

        for result in results:

            assert result.id is not None

            account:AccountResponse= AccountResponse(id=result.id,portfolio_id=result.portfolio_id,currency_id=result.currency_id,balance=result.balance,created_at=result.created_at,)
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
        return AccountResponse(id=account.id,portfolio_id=account.portfolio_id,currency_id=account.currency_id,balance=account.balance,created_at=account.created_at)


    
    def create(self,data:CreateAcountDTO,current_user:User)->AccountResponse:

        #get portfolio
        portfolio= self.session.exec(select(Portfolio).where(Portfolio.user_id==current_user.id)).first()
        assert portfolio is not None,"There is no connected portfolio"
        
        # there should be an id if there isnt there a big problem somewhere
        assert portfolio.id is not None

        # get currency

        currency= self.session.exec(select(Currency).where(Currency.code==data.currency_code)).first()

        if currency is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,detail="Unknown currency") 

        # there should be an id if there isnt there a big problem somewhere
        assert currency.id is not None

        #create the account
        account:InternationalAccount=InternationalAccount(portfolio_id=portfolio.id,currency_id=currency.id,balance=data.initial_balance)
        self.session.add(account)
        self.session.commit()
        self.session.refresh(account)

        #ensure it was created
        assert account.id is not None

        return AccountResponse(id=account.id,portfolio_id=account.portfolio_id,currency_id=account.currency_id,balance=account.balance,created_at=account.created_at)

    @staticmethod
    def get_status()-> EpicStatusDTO:
        return EpicStatusDTO(
                epic="International Accounts",
                status="Healthy"
                )

