-- Email marketing: templates (including the app's existing lifecycle/
-- transactional emails, migrated here from hardcoded strings in email.js so
-- they're editable from the admin dashboard), campaigns (bulk/scheduled
-- sends to leads, companies, or partners), and a send log -- every
-- individual email, whether triggered automatically by the app or sent
-- manually/in bulk from the admin dashboard, gets a row here. That log is
-- what the KPI view (sent/delivered/bounced/opened/etc) is built from.
-- Resend's webhook (see routes/emailMarketing.js) updates existing rows in
-- place as delivery events come in.
--
-- No RLS policies beyond enabling it (same as website_requests) -- nothing
-- here is ever touched by a visitor-facing route or the anon key, only the
-- backend's service-role key.

CREATE TABLE IF NOT EXISTS email_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key         TEXT UNIQUE, -- set only for the app's built-in lifecycle emails (e.g. 'trial_ending_soon'), looked up by code at send time; NULL for templates created freely in the admin UI for manual/bulk sends
  name        TEXT NOT NULL,
  category    TEXT NOT NULL DEFAULT 'marketing' CHECK (category IN ('marketing', 'lifecycle')),
  subject     TEXT NOT NULL,
  html_body   TEXT NOT NULL,
  text_body   TEXT NOT NULL,
  variables   JSONB NOT NULL DEFAULT '[]', -- [{ name, example }] -- documents which {{tokens}} this template supports, shown in the editor and used to build a live preview
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_campaigns (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id   UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  name          TEXT NOT NULL,
  audience      JSONB NOT NULL DEFAULT '{}', -- { sources: ['leads','companies','partners'], filters: {...} } -- resolved to an actual recipient list at send time, not stored as a frozen list up front
  status        TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'completed', 'canceled')),
  scheduled_at  TIMESTAMPTZ,
  started_at    TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_sends (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id     UUID REFERENCES email_campaigns(id) ON DELETE SET NULL, -- NULL = one-off individual send, not part of a campaign
  template_id     UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  template_key    TEXT, -- snapshot of the template's key (for automated lifecycle sends) at send time, so this row stays meaningful even if the template is later renamed/deleted
  recipient_email TEXT NOT NULL,
  recipient_name  TEXT,
  recipient_type  TEXT CHECK (recipient_type IN ('lead', 'company', 'partner', 'other')),
  recipient_ref   TEXT, -- the source lead/company/partner id, for traceability back to its row
  subject         TEXT,
  resend_email_id TEXT, -- Resend's id for this send, used to match incoming webhook delivery events back to this row
  status          TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'delivered', 'bounced', 'failed', 'skipped', 'complained')),
  failed_reason   TEXT,
  opened_at       TIMESTAMPTZ,
  clicked_at      TIMESTAMPTZ,
  bounced_at      TIMESTAMPTZ,
  delivered_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS email_sends_campaign_id_idx ON email_sends(campaign_id);
CREATE INDEX IF NOT EXISTS email_sends_resend_email_id_idx ON email_sends(resend_email_id);
CREATE INDEX IF NOT EXISTS email_sends_created_at_idx ON email_sends(created_at DESC);
CREATE INDEX IF NOT EXISTS email_campaigns_status_idx ON email_campaigns(status);

ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sends ENABLE ROW LEVEL SECURITY;
