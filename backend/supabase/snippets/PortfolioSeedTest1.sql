Select "User".user_id, "User".name as user_name, portfolio.name As portfolio_name
From "User"
Right JOIN portfolio ON "User".user_id=portfolio.user_id