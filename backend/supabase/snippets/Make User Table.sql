create table "User"(
  User_ID uuid primary key DEFAULT gen_random_uuid(),
  email varchar(150) not null,
  password varchar(50) not null,
  name varchar(150) not null
);