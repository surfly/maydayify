drop table if exists sessions;
create table sessions (
  id integer primary key autoincrement,
  hash text not null,
  surfly_url text not null,
  tokbox_session text not null,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
