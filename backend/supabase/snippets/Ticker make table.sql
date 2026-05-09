create table Ticker(
  ticker char(10) primary key,
  name varchar(255) not null,
  market varchar(20) not null,
  locale varchar(5) not null,
  type char(10) not null,
  active boolean not null,
  dividend_yield decimal(10, 4) not null,
  split_from int not null,
  split_to int not null,
  currency char(3) not null,
  primary_exchange char(10) not null
);