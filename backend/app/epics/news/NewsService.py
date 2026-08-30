from sqlmodel import Session, select
from ...models.news import News
from .NewsDTOs import NewsItem, NewsRequest, NewsRepsonse,EpicStatusDTO

class NewsService:
    def __init__(self,session:Session) -> None:
        self.session=session

    @staticmethod
    def get_status() -> EpicStatusDTO:
        return EpicStatusDTO(
            epic="News",
            status="healthy",
        )
    def create_news(self,news:News)->News:
        #ensures that all tickers are stored in upper case
        news.ticker=news.ticker.upper()
        self.session.add(news)
        self.session.commit()
        self.session.refresh(news)
        if news.id is None:
            raise ValueError("Failed to create news")
        return news;

    def find_news(self,news:NewsRequest)->NewsRepsonse:
        results=self.session.exec(select(News).where(News.ticker==news.ticker.upper()).where(News.timestamp<=news.end_date).where(News.timestamp>=news.start_date)).all()
        news_items:list[NewsItem] = []
        for result in results:
            if result.id is not None:
                news_item:NewsItem =NewsItem(id=result.id,timestamp=result.timestamp,category=result.category,description=result.description,source=result.source,author=result.author,full_story=result.full_story)
                news_items.append(news_item)
        return NewsRepsonse(news_items=news_items)
            


