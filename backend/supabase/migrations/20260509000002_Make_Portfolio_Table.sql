create table Portfolio(
  Protfolio_ID uuid primary key DEFAULT gen_random_uuid(),
  Name varchar(50) not null,
  Description varchar(200) not null,
  Currency varchar(3) not null,
  Balance decimal(18, 2) not null,
  User_ID uuid references "User"(User_ID) on delete cascade
);