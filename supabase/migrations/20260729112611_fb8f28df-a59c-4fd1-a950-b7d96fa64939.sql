ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS report_kind text NOT NULL DEFAULT 'internship',
  ADD COLUMN IF NOT EXISTS download_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_downloaded_at timestamp with time zone;

ALTER TABLE public.reports
  DROP CONSTRAINT IF EXISTS reports_report_kind_check;

ALTER TABLE public.reports
  ADD CONSTRAINT reports_report_kind_check
  CHECK (report_kind IN ('internship', 'project', 'thesis'));

CREATE INDEX IF NOT EXISTS reports_user_kind_idx ON public.reports (user_id, report_kind);