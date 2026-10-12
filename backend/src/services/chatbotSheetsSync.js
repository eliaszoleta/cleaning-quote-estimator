// Syncs chatbot leads to a single shared Google Sheet (one tab, every
// client's leads in it, filterable by the Business column) -- the "live
// spreadsheet" the sales team opens with no login, separate from
// chatbot_leads in Supabase, which stays the real source of truth for the
// returning-visitor lookup in routes/chatWidget.js.
//
// Auth is a Google service account (JWT), not the OAuth user-consent flow
// googleCalendar.js uses for /book-a-call -- that flow signs in as "the
// admin's own Google account" for a calendar only that person owns; this
// is a server-to-server write to one shared sheet, which a service account
// handles without any consent-screen redirect. One-time setup: create a
// Google Cloud service account, enable the Sheets API, share the target
// sheet with that service account's email (Editor access), then set
// GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL / GOOGLE_SHEETS_SERVICE_ACCOUNT_PRIVATE_KEY
// / GOOGLE_SHEETS_SPREADSHEET_ID. The sheet needs one tab named "Leads"
// with a header row: Timestamp | Business | Name | Phone | Summary |
// Status | ChatbotId (the last column is for matching only -- fine to
// hide it, don't delete it).
const { google } = require('googleapis');

const SHEET_RANGE = 'Leads!A:G';

function getAuth() {
  const email = process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_PRIVATE_KEY;
  if (!email || !key) return null;
  // Private keys are stored in env vars as a single line with literal
  // "\n" sequences (newlines aren't valid in most .env / host dashboard
  // formats) -- this restores the real PEM line breaks googleapis needs.
  return new google.auth.JWT({ email, key: key.replace(/\\n/g, '\n'), scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
}

function isConfigured() {
  return !!(getAuth() && process.env.GOOGLE_SHEETS_SPREADSHEET_ID);
}

async function findRowNumber(sheets, spreadsheetId, chatbotId, phone) {
  const { data } = await sheets.spreadsheets.values.get({ spreadsheetId, range: SHEET_RANGE });
  const rows = data.values || [];
  // Row 0 is the header; match on phone AND chatbotId (col G) since this
  // one sheet holds every client's leads and two different clients'
  // customers could plausibly share a phone format collision isn't
  // realistic, but matching both keeps each client's rows isolated.
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][3] === phone && rows[i][6] === chatbotId) return i + 1; // 1-indexed for the Sheets API
  }
  return null;
}

// Fire-and-forget from the caller's perspective (routes/chatWidget.js and
// services/chatbotSummary.js both call this without awaiting failure) --
// never throws, logs and returns false instead, since a Sheets hiccup
// should never block a live chat reply or the lead alert email.
async function syncLeadToSheet({ chatbot, lead, summary = null }) {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const auth = getAuth();
  if (!spreadsheetId || !auth) {
    console.warn('syncLeadToSheet skipped: Google Sheets not configured');
    return false;
  }

  const sheets = google.sheets({ version: 'v4', auth });
  const row = [
    new Date().toISOString(),
    chatbot.business_name,
    lead.name,
    lead.phone,
    summary || lead.last_summary || '',
    summary ? 'summarized' : 'captured',
    chatbot.id,
  ];

  try {
    const existingRow = await findRowNumber(sheets, spreadsheetId, chatbot.id, lead.phone);
    if (existingRow) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Leads!A${existingRow}:G${existingRow}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [row] },
      });
    } else {
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: SHEET_RANGE,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values: [row] },
      });
    }
    return true;
  } catch (err) {
    console.warn('syncLeadToSheet failed:', err.message);
    return false;
  }
}

module.exports = { syncLeadToSheet, isConfigured };
