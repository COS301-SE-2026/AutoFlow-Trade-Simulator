Select "User".user_id, "User".name as user_name, COUNT(portfolio.protfolio_id)
From "User"
Right JOIN portfolio ON "User".user_id=portfolio.user_id
group by "User".user_id