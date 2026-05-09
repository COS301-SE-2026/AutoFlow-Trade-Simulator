WITH user_data AS (
  SELECT 
    User_ID, 
    ROW_NUMBER() OVER () as row_num, 
    COUNT(*) OVER () as total_count
  FROM "User"
)
INSERT INTO Portfolio (name, description, currency, balance, user_id)
SELECT 
    'Standard Savings', 
    'Main tracking account', 
    'USD', 
    2500.00, 
    User_ID
FROM user_data 
WHERE row_num <= (total_count / 2)

UNION ALL

SELECT 
    'High Growth', 
    'Aggressive investment strategy', 
    'USD', 
    7500.50, 
    User_ID
FROM user_data 
WHERE row_num > (total_count / 2)

UNION ALL

SELECT 
    'Safe Haven', 
    'Low-risk bonds and cash', 
    'USD', 
    12000.00, 
    User_ID
FROM user_data 
WHERE row_num > (total_count / 2);