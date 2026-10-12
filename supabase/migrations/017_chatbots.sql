-- Per-client AI lead-capture chatbot, embedded on each Growth/Pro subscriber's
-- website (see WebsiteSubscription.js's Growth/Pro tier copy). One shared
-- widget bundle + one shared backend serve every client; each row in
-- `chatbots` is a separate client config (business info -> system prompt,
-- where lead alerts go, what "From" name those alerts show), not a
-- separate deployment. The embed snippet just carries that row's id.
--
-- No RLS policies beyond enabling it -- same as website_requests, bookings,
-- and the email marketing tables: every route touching these goes through
-- the backend's service-role key, never the anon key directly.

CREATE TABLE IF NOT EXISTS chatbots (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),

  business_name     text NOT NULL,
  -- Free text describing the client's business, services, hours, service
  -- area, pricing notes, etc. -- folded into the system prompt so the
  -- chatbot can actually answer questions about that specific business
  -- instead of giving generic cleaning-industry answers.
  prompt_info       text NOT NULL DEFAULT '',

  lead_alert_email  text NOT NULL, -- where captured-lead/summary emails go
  -- Resend "From" display name for alerts on this chatbot (e.g. "Sparkle
  -- Clean Leads"). The From *address* always stays on our own verified
  -- sending domain (Resend can't send authenticated mail through a domain
  -- it hasn't verified) -- see sendChatbotLeadAlertEmail in email.js, same
  -- pattern sendEstimateEmail already uses for a company's own brand name.
  -- Falls back to business_name when unset.
  from_name         text,

  status            text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused'))
);

CREATE TABLE IF NOT EXISTS chatbot_leads (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id            uuid NOT NULL REFERENCES chatbots(id) ON DELETE CASCADE,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),

  -- Phone is the identity key for "is this a returning visitor" -- names
  -- collide far too often to key on. Stored as whatever digits the
  -- chatbot's save_contact tool call validated, not reformatted.
  phone                 text NOT NULL,
  name                  text,

  last_summary          text, -- most recent conversation's structured summary (what they need, urgency, details)
  last_conversation_at  timestamptz,

  UNIQUE (chatbot_id, phone)
);
CREATE INDEX IF NOT EXISTS chatbot_leads_chatbot_phone_idx ON chatbot_leads(chatbot_id, phone);

CREATE TABLE IF NOT EXISTS chatbot_conversations (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id        uuid NOT NULL REFERENCES chatbots(id) ON DELETE CASCADE,
  lead_id           uuid REFERENCES chatbot_leads(id) ON DELETE SET NULL, -- null until save_contact fires

  -- Random, unguessable token the widget stores in localStorage so a
  -- visitor's browser can resume its own session across page loads --
  -- same no-login-system pattern as website_requests' approval token and
  -- bookings' cancel_token.
  session_token     text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),

  -- Full transcript as [{role, content}, ...] -- kept here rather than a
  -- separate messages table since it's always read/written as a whole per
  -- turn, never queried message-by-message.
  messages          jsonb NOT NULL DEFAULT '[]',

  status            text NOT NULL DEFAULT 'gathering_contact'
    CHECK (status IN ('gathering_contact', 'active', 'summarized')),

  last_activity_at  timestamptz NOT NULL DEFAULT now(),
  created_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS chatbot_conversations_session_token_idx ON chatbot_conversations(session_token);
-- Powers the inactivity sweep (services/chatbotSummaryScheduler.js): find
-- every non-summarized conversation that's gone quiet.
CREATE INDEX IF NOT EXISTS chatbot_conversations_status_activity_idx ON chatbot_conversations(status, last_activity_at);

ALTER TABLE chatbots ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_conversations ENABLE ROW LEVEL SECURITY;
