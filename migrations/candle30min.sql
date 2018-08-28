CREATE TABLE public.candle30min
(id serial NOT NULL PRIMARY KEY,
    exchange text NOT NULL,
    ticker text NOT NULL,
    high float NOT NULL,
    low float NOT NULL,
    amount float NOT NULL,
    nodetime timestamp NOT NULL,
    sqltime timestamp DEFAULT now())
