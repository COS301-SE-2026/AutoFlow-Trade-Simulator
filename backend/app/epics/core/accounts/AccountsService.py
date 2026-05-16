from re import A
from sqlmodel import Session, select

from backend.app.epics.auth.AuthDTOs import EpicStatusDTO
from .AccountsDTOs import AccountListResponse, AccountResponse
from ....models import InternationalAccount


class AccountsService:
    def __init__(self,session:Session):
        self.session=session

    def find_all(self)->AccountListResponse:

        results= self.session.exec(select(InternationalAccount))

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

