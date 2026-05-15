-- =========================
-- Roles
-- =========================
CREATE TYPE public.app_role AS ENUM ('admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Users may see their own roles; admins may see all
CREATE POLICY "Users view own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- No client-side writes; service role manages assignments
CREATE POLICY "Deny client writes to user_roles"
ON public.user_roles FOR ALL
TO anon, authenticated
USING (false) WITH CHECK (false);

-- =========================
-- Audit log
-- =========================
CREATE TABLE public.admin_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email text,
  action text NOT NULL,
  target_table text,
  target_id text,
  payload jsonb,
  ip text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read audit"
ON public.admin_audit FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Deny client writes to audit"
ON public.admin_audit FOR ALL
TO anon, authenticated
USING (false) WITH CHECK (false);

CREATE INDEX admin_audit_created_at_idx ON public.admin_audit (created_at DESC);

-- =========================
-- Rate limit buckets
-- =========================
CREATE TABLE public.rate_limit_buckets (
  key text PRIMARY KEY,
  window_start timestamptz NOT NULL DEFAULT now(),
  count integer NOT NULL DEFAULT 0
);

ALTER TABLE public.rate_limit_buckets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny client access to rate buckets"
ON public.rate_limit_buckets FOR ALL
TO anon, authenticated
USING (false) WITH CHECK (false);

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  _key text,
  _max integer,
  _window_seconds integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  bucket public.rate_limit_buckets%ROWTYPE;
  now_ts timestamptz := now();
BEGIN
  SELECT * INTO bucket FROM public.rate_limit_buckets WHERE key = _key FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO public.rate_limit_buckets(key, window_start, count)
    VALUES (_key, now_ts, 1);
    RETURN true;
  END IF;

  IF now_ts - bucket.window_start > make_interval(secs => _window_seconds) THEN
    UPDATE public.rate_limit_buckets
      SET window_start = now_ts, count = 1
      WHERE key = _key;
    RETURN true;
  END IF;

  IF bucket.count >= _max THEN
    RETURN false;
  END IF;

  UPDATE public.rate_limit_buckets
    SET count = count + 1
    WHERE key = _key;
  RETURN true;
END;
$$;

-- =========================
-- Replace deny-all RLS on preachers / sermons with admin write rules
-- =========================
DROP POLICY IF EXISTS "Deny public writes to preachers" ON public.preachers;
DROP POLICY IF EXISTS "Deny public writes to sermons"   ON public.sermons;

CREATE POLICY "Admins manage preachers"
ON public.preachers FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage sermons"
ON public.sermons FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Block anon writes explicitly
CREATE POLICY "Deny anon writes to preachers"
ON public.preachers FOR ALL
TO anon
USING (false) WITH CHECK (false);

CREATE POLICY "Deny anon writes to sermons"
ON public.sermons FOR ALL
TO anon
USING (false) WITH CHECK (false);

-- =========================
-- Bootstrap admin on signup
-- =========================
CREATE OR REPLACE FUNCTION public.bootstrap_admin_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF lower(NEW.email) = 'emaniyi64@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER bootstrap_admin_trigger
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.bootstrap_admin_on_signup();