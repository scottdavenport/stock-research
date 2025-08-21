-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.screening_results (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  symbol text NOT NULL,
  screening_date date NOT NULL DEFAULT CURRENT_DATE,
  score integer NOT NULL CHECK (score >= 0 AND score <= 100),
  rating text CHECK (rating = ANY (ARRAY['STRONG BUY'::text, 'BUY'::text, 'WEAK BUY'::text, 'HOLD'::text, 'WEAK SELL'::text, 'SELL'::text, 'STRONG SELL'::text])),
  price numeric,
  change_amount numeric,
  change_percent numeric,
  market_cap numeric,
  score_breakdown jsonb,
  technicals jsonb,
  signals jsonb,
  rank_position integer,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  session_id uuid,
  user_id uuid,
  CONSTRAINT screening_results_pkey PRIMARY KEY (id),
  CONSTRAINT screening_results_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.user_screening_sessions(id),
  CONSTRAINT screening_results_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT screening_results_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id),
  CONSTRAINT screening_results_symbol_fkey FOREIGN KEY (symbol) REFERENCES public.stock_universe(symbol)
);
CREATE TABLE public.stock_performance (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  symbol text NOT NULL,
  date date NOT NULL,
  price numeric NOT NULL,
  volume bigint,
  high numeric,
  low numeric,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT stock_performance_pkey PRIMARY KEY (id),
  CONSTRAINT stock_performance_symbol_fkey FOREIGN KEY (symbol) REFERENCES public.stock_universe(symbol)
);
CREATE TABLE public.stock_universe (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  symbol text NOT NULL UNIQUE,
  name text NOT NULL,
  sector text,
  market_cap_tier text CHECK (market_cap_tier = ANY (ARRAY['Large'::text, 'Mid'::text, 'Small'::text])),
  exchange text,
  country text DEFAULT 'US'::text,
  is_active boolean DEFAULT true,
  added_date timestamp with time zone DEFAULT now(),
  last_updated timestamp with time zone DEFAULT now(),
  notes text,
  created_by uuid,
  CONSTRAINT stock_universe_pkey PRIMARY KEY (id),
  CONSTRAINT stock_universe_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.universe_list_stocks (
  list_id uuid NOT NULL,
  symbol text NOT NULL,
  added_at timestamp with time zone DEFAULT now(),
  added_by uuid,
  CONSTRAINT universe_list_stocks_pkey PRIMARY KEY (list_id, symbol),
  CONSTRAINT universe_list_stocks_symbol_fkey FOREIGN KEY (symbol) REFERENCES public.stock_universe(symbol),
  CONSTRAINT universe_list_stocks_list_id_fkey FOREIGN KEY (list_id) REFERENCES public.universe_lists(id),
  CONSTRAINT universe_list_stocks_added_by_fkey FOREIGN KEY (added_by) REFERENCES auth.users(id)
);
CREATE TABLE public.universe_lists (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  is_default boolean DEFAULT false,
  is_public boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  CONSTRAINT universe_lists_pkey PRIMARY KEY (id),
  CONSTRAINT universe_lists_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.user_screening_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  user_email text NOT NULL,
  screening_type text DEFAULT 'momentum'::text,
  filters jsonb DEFAULT '{}'::jsonb,
  total_stocks_screened integer DEFAULT 0,
  total_buy_rated integer DEFAULT 0,
  buy_percentage numeric DEFAULT 0,
  average_score numeric DEFAULT 0,
  average_buy_score numeric DEFAULT 0,
  processing_time_seconds integer DEFAULT 0,
  status text DEFAULT 'completed'::text CHECK (status = ANY (ARRAY['pending'::text, 'processing'::text, 'running'::text, 'completed'::text, 'failed'::text, 'replaced'::text])),
  created_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  session_data jsonb,
  CONSTRAINT user_screening_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT user_screening_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_watchlist_stocks (
  watchlist_id uuid NOT NULL,
  symbol text NOT NULL,
  added_at timestamp with time zone DEFAULT now(),
  notes text,
  CONSTRAINT user_watchlist_stocks_pkey PRIMARY KEY (watchlist_id, symbol),
  CONSTRAINT user_watchlist_stocks_watchlist_id_fkey FOREIGN KEY (watchlist_id) REFERENCES public.user_watchlists(id),
  CONSTRAINT user_watchlist_stocks_symbol_fkey FOREIGN KEY (symbol) REFERENCES public.stock_universe(symbol)
);
CREATE TABLE public.user_watchlists (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  name text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_watchlists_pkey PRIMARY KEY (id),
  CONSTRAINT user_watchlists_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);