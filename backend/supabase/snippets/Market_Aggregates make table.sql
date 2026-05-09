CREATE TYPE enum_timespan as ENUM('minute', 'hour', 'day', 'week', 'month');

create table Market_Aggregates(
  ID uuid primary key DEFAULT gen_random_uuid(),
  ticker char(10) references ticker(ticker) on delete cascade,
  timespan enum_timespan NOT NULL,
  "Close" decimal(18, 4) NOT NULL,
  "Open" decimal(18, 4) NOT NULL,
  "High" decimal(18, 4) NOT NULL,
  "Low" decimal(18, 4) NOT NULL,
  Volume bigint NOT NULL,
  rsi decimal(10, 4) NOT NULL,
  sma decimal(18, 4) NOT NULL,
  "timestamp" bigint NOT NULL,
  transaction integer NOT NULL,
  vwap decimal(18, 4) NOT NULL
);