from re import A
from fastapi import HTTPException, status
from sqlmodel import Session, select

from backend.app.epics.auth.AuthDTOs import EpicStatusDTO
from backend.app.models import User,Portfolio
from .AccountsDTOs import AccountListResponse, AccountResponse
from ...models import InternationalAccount


class AccountsService:
    def __init__(self,session:Session):
        self.session=session

    def find_all(self,current_user:User)->AccountListResponse:
        #see if user has a portfolio
        portfolio= self.session.exec(select(Portfolio).where(Portfolio.user_id==current_user.id)).first()
        if portfolio is None:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,detail="There is no portfolio connected to user") 

        #list all accounts in users portfolio

        results= self.session.exec(select(InternationalAccount).where(InternationalAccount.portfolio_id==portfolio.id))

        accountsResponse:AccountListResponse= AccountListResponse(accounts=[])

        for result in results:

            assert result.id is not None

            account:AccountResponse= AccountResponse(id=result.id,portfolio_id=result.portfolio_id,currency_id=result.currency_id,balance=result.balance,created_at=result.created_at,)
            accountsResponse.accounts.append(account)

        return accountsResponse

    @staticmethod
    def get_status()-> EpicStatusDTO:
        return EpicStatusDTO(
                epic="International Accounts",
                status="Healthy"
                )

