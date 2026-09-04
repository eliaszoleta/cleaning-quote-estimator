-- Storage bucket for logos uploaded during the self-serve "buy city
-- placement" checkout (backend/src/routes/partnerCheckout.js). Public read
-- so uploaded logos can be shown directly via <img src>, same as any
-- externally-hosted logo URL a partner could already paste into the
-- Logo URL field. Writes only ever happen from the backend using the
-- service role key (which bypasses storage RLS entirely), so no INSERT
-- policy is added here -- the browser never gets direct write access.
insert into storage.buckets (id, name, public)
values ('partner-logos', 'partner-logos', true)
on conflict (id) do nothing;
