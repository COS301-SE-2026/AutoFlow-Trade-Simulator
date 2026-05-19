from decimal import Decimal
from fastapi import HTTPException, status
from sqlmodel import Session, select
from typing import List, Dict
from collections import defaultdict

from ..market_data.MarketDataService import MarketDataService
from ..market_data.MarketDataDTOs import AssetSummary
from ...models.transaction import Direction
from ...models import Asset,InternationalAccount,User,Portfolio,Transaction,Currency
from .PortfolioDTOs import EpicStatusDTO, ExecuteTradeDTO, ExecuteTradeResponseDTO, TradeHistoryResponse, TransactionResponse, HoldingResponse, Holding


class PortfolioService:

    # Common error messages
    ERROR_NO_ACCOUNT = "There is no account with specified id"
    ERROR_USER_NO_PORTFOLIO = "User should have a portfolio"
    ERROR_ACCOUNT_NOT_OWNER = "This account does not belong to the current user"

    def __init__(self,session:Session):
        self.session=session

    def _get_position_quantity(self, account_id: int, asset_id: int) -> float:
        transactions = self.session.exec(
            select(Transaction).where(
                Transaction.account_id == account_id,
                Transaction.asset_id == asset_id,
            )
        ).all()

        quantity = 0.0
        for transaction in transactions:
            if transaction.direction == Direction.Buy:
                quantity += transaction.quantity
            elif transaction.direction == Direction.Sell:
                quantity -= transaction.quantity

        return quantity

    def execute_trade(self,data:ExecuteTradeDTO,account_id:int,current_user:User)->ExecuteTradeResponseDTO:
        account = self.session.get(InternationalAccount,account_id)
        if account is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,detail=self.ERROR_NO_ACCOUNT)

        assert account.id is not None,"Asset ID should not be none"
        account_id = account.id

        # if acount does not belong to user throw unauthorized
        portfolio = self.session.exec(select(Portfolio).where(Portfolio.user_id==current_user.id)).first()
        assert portfolio is not None, self.ERROR_USER_NO_PORTFOLIO

        if account.portfolio_id!= portfolio.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,detail=self.ERROR_ACCOUNT_NOT_OWNER)

        #get account balance
        balance:Decimal =account.balance
        
        # get asset price   
        
        market_service:MarketDataService= MarketDataService()
        asset_summary:AssetSummary= market_service.get_asset_summary_data(data.ticker)
        asset_price:Decimal=Decimal(asset_summary.current_price)
        total_cost = asset_price * Decimal(str(data.quantity))

         # get asset based on ticker
        asset=self.session.exec(select(Asset).where(Asset.ticker==data.ticker)).first()
        if asset is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,detail="There is no asset with specified ticker")
        
        assert asset.id is not None,"Asset ID should not be none"


        if data.direction== Direction.Buy:
            #buy asset
            if balance < total_cost:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,detail="Account balance is too low")

            account.balance = balance - total_cost
            buy_transaction:Transaction = Transaction(account_id=account_id,asset_id=asset.id,direction=data.direction,quantity=data.quantity,price_at_execution=asset_price)
            self.session.add(account)
            self.session.add(buy_transaction)
            self.session.commit()
            self.session.refresh(account)
            self.session.refresh(buy_transaction)

            new_position_quantity = self._get_position_quantity(account_id, asset.id)

            assert buy_transaction.id is not None, "Transaction id should not be none"

            return ExecuteTradeResponseDTO(transaction_id=buy_transaction.id,account_id=account.id,ticker=asset.ticker,direction=buy_transaction.direction,new_position_quantity=new_position_quantity,quantity=data.quantity,price_at_execution=float(asset_price),total_cost=float(total_cost),executed_at=buy_transaction.executed_at,new_cash_balance=float(account.balance))
        


        elif data.direction == Direction.Sell:
            #sell asset
            owned_quantity = self._get_position_quantity(account_id, asset.id)
            if owned_quantity < data.quantity:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,detail="You do not have enough of this asset to sell")

            account.balance = balance + total_cost
            sell_transaction:Transaction = Transaction(account_id=account_id,asset_id=asset.id,direction=data.direction,quantity=data.quantity,price_at_execution=asset_price)
            self.session.add(account)
            self.session.add(sell_transaction)
            self.session.commit()
            self.session.refresh(account)
            self.session.refresh(sell_transaction)

            assert sell_transaction.id is not None, "Transaction id should not be none"

            new_position_quantity = self._get_position_quantity(account_id, asset.id)
            return ExecuteTradeResponseDTO(transaction_id=sell_transaction.id,account_id=account.id,ticker=asset.ticker,direction=sell_transaction.direction,new_position_quantity=new_position_quantity,quantity=data.quantity,price_at_execution=float(asset_price),total_cost=float(total_cost),executed_at=sell_transaction.executed_at,new_cash_balance=float(account.balance))

        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,detail="Unsupported trade direction")
        
    def get_transaction_history(self,account_id:int,current_user:User)->TradeHistoryResponse:

        account = self.session.get(InternationalAccount,account_id)
        if account is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,detail=self.ERROR_NO_ACCOUNT)

        assert account.id is not None,"Asset ID should not be none"

        # if acount does not belong to user throw unauthorized
        portfolio = self.session.exec(select(Portfolio).where(Portfolio.user_id==current_user.id)).first()
        assert portfolio is not None, self.ERROR_USER_NO_PORTFOLIO

        if account.portfolio_id!= portfolio.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,detail=self.ERROR_ACCOUNT_NOT_OWNER)

        #get account currency code
        currency=  self.session.get(Currency,account.currency_id)
        assert currency is not None,"Account should have currency"
        currency_code:str= currency.code

        transactions= self.session.exec(select(Transaction).where(Transaction.account_id==account_id))
        response:TradeHistoryResponse= TradeHistoryResponse(transactions=[])
        for transaction in transactions:
            # get asset ticker
            asset=self.session.get(Asset,transaction.asset_id)
            assert asset is not None,"Asset should not be null"

            trade_history:TransactionResponse= TransactionResponse(account_id=transaction.account_id,price_at_execution=float(transaction.price_at_execution),quantity=transaction.quantity,executed_at=transaction.executed_at,direction=transaction.direction,asset_id=transaction.asset_id,account_currency_code=currency_code,asset_ticker=asset.ticker)
            response.transactions.append(trade_history)
        return response


    def get_holdings(self,account_id:int,current_user:User) -> HoldingResponse:
        # validate account and ownership (same checks as other methods)
        account = self.session.get(InternationalAccount, account_id)
        if account is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=self.ERROR_NO_ACCOUNT)

        portfolio = self.session.exec(select(Portfolio).where(Portfolio.user_id == current_user.id)).first()
        assert portfolio is not None, self.ERROR_USER_NO_PORTFOLIO

        if account.portfolio_id != portfolio.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=self.ERROR_ACCOUNT_NOT_OWNER)

        # Fetch all transactions for the account and aggregate in Python (avoids direct SQLAlchemy funcs)
        transactions = self.session.exec(select(Transaction).where(Transaction.account_id == account_id)).all()

        agg: Dict[int, Dict[str, float]] = defaultdict(lambda: {"net_qty": 0.0, "buy_qty": 0.0, "buy_cost": 0.0})

        for tx in transactions:
            aid = tx.asset_id
            qty = float(tx.quantity)
            if tx.direction == Direction.Buy:
                agg[aid]["net_qty"] += qty
                agg[aid]["buy_qty"] += qty
                agg[aid]["buy_cost"] += float(tx.price_at_execution) * qty
            else:
                agg[aid]["net_qty"] -= qty

        holdings_list: List[Holding] = []
        for aid, vals in agg.items():
            net_qty = vals["net_qty"]
            if net_qty == 0:
                continue

            buy_qty = vals["buy_qty"]
            buy_cost = vals["buy_cost"]
            avg_cost = buy_cost / buy_qty if buy_qty > 0 else 0.0

            asset = self.session.get(Asset, aid)
            assert asset is not None, "Asset should not be null"
            assert asset.id is not None, "Asset ID should not be none"

            holdings_list.append(Holding(asset_id=asset.id, ticker=asset.ticker, net_quantity=net_qty, average_cost=avg_cost))

        return HoldingResponse(holdings=holdings_list)






    @staticmethod
    def get_status() -> EpicStatusDTO:
        return EpicStatusDTO(
            epic="portfolio",
            status="healthy",
        )





