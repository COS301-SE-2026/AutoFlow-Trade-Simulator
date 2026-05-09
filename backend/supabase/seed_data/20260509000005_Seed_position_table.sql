INSERT INTO Position (Portfolio_ID, Asset_ID, quantity, avg_buy_price)
select
  portfolio.protfolio_id,
  (ARRAY['BTC', 'ETH', 'AAPL', 'TSLA', 'MSTF', 'SOL', 'GOOGL', 'AMZN'])[floor(random() * 8 + 1)],
  --Make a random quantity
  floor(random() * 100 + 1)::int,
  --Random Buy Price between $10 and $500
  (random() * (500 - 10) + 10)::decimal(18, 2)
from portfolio
CROSS JOIN LATERAL generate_series(1, floor(random() * 5 + 1):: int);
