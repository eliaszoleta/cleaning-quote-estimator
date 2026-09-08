-- Storage bucket for logos uploaded from the company dashboard's Branding
-- tab (backend/src/routes/company.js, POST /:id/upload-logo). Separate
-- from partner-logos (005_partner_logo_storage.sql) since these are two
-- different kinds of accounts -- keeps a company's widget-branding upload
-- traffic/storage from sharing a bucket meant for the partner-directory
-- checkout flow. Public read so uploaded logos can be shown directly via
-- <img src>, same as any externally-hosted logo URL a company could
-- already paste into the Logo URL field. Writes only ever happen from the
-- backend using the service role key (which bypasses storage RLS
-- entirely), so no INSERT policy is added here -- the browser never gets
-- direct write access.
insert into storage.buckets (id, name, public)
values ('company-logos', 'company-logos', true)
on conflict (id) do nothing;
