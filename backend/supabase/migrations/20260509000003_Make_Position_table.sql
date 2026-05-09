create table Position(
  Position_ID uuid primary key DEFAULT gen_random_uuid(),
  Portfolio_ID uuid references portfolio(protfolio_id) on delete cascade,
  Asset_ID varchar(150) not null,
  Quantity integer not null,
  Avg_Buy_Price decimal(18,2) not null
);