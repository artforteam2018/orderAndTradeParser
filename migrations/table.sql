CREATE TABLE public.trades
	(id serial NOT NULL PRIMARY KEY,
	exchange text NOT NULL,
    ticker text NOT NULL,
    price float NOT NULL,
    amount float NOT NULL,
    type text NOT NULL,
    nodetime timestamp NOT NULL,
    sqltime timestamp DEFAULT now())
