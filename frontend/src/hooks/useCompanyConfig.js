import { useState, useEffect, useCallback } from 'react';
import { getCompanyConfig, putCompanyConfig, patchCompanyServices } from '../utils/api';
import { supabase } from '../lib/supabase';

// Reported bug (Oct 2026): the dashboard's very first load would sometimes
// show "Invalid or expired session" -- mobile only, never desktop. Root
// cause: supabase.auth.getSession() returns whatever's in local storage,
// including a token that's technically still "current" there but has
// actually gone stale -- most commonly because the tab sat backgrounded
// long enough that Supabase's own background auto-refresh timer, which
// relies on setTimeout, got throttled. Mobile browsers throttle
// backgrounded-tab timers far more aggressively than desktop (which mostly
// doesn't throttle a tab that's merely not focused), so a session that
// would have quietly refreshed itself on desktop instead goes stale on
// mobile, and the backend correctly 401s the stale token it's handed. One
// forced refreshSession() + retry self-heals exactly that case -- the
// backend's rejection was correct, the token really was stale, but the
// user shouldn't see an error for something a silent retry fixes.
async function authedCall(apiCall) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error('Not authenticated');
  try {
    return await apiCall(token);
  } catch (err) {
    const looksLikeStaleSession = /session|unauthorized|401/i.test(err.message || '');
    if (!looksLikeStaleSession) throw err;
    const { data: refreshed } = await supabase.auth.refreshSession();
    const freshToken = refreshed?.session?.access_token;
    if (!freshToken) throw err;
    return apiCall(freshToken);
  }
}

export function useCompanyConfig(userId) {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  // true only on the very first fetch after account creation -- see the
  // `created` comment on GET /api/company/:id. Used to show a one-time
  // "first time here?" pointer to Help & Docs; not reset on refetch since
  // a mid-session config reload shouldn't bring the welcome prompt back.
  const [justCreated, setJustCreated] = useState(false);

  const fetchConfig = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await authedCall(token => getCompanyConfig(token, userId));
      setConfig(res.data);
      if (res.created) setJustCreated(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  const saveConfig = useCallback(async (updates) => {
    if (!userId) return;
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await authedCall(token => putCompanyConfig(token, userId, updates));
      setConfig(res.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }, [userId]);

  // Used for the Services tab's enable/disable toggles specifically -- those
  // should save the instant you click them rather than waiting on the
  // header's Save Changes button, since a company owner flipping a service
  // off expects it gone from their widget right away. Hits the dedicated
  // PATCH /services endpoint (deep-merges just the changed service, leaving
  // markup/minimumCharge edits on other services untouched) instead of the
  // full PUT saveConfig uses.
  const patchServices = useCallback(async (services) => {
    if (!userId) return null;
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await authedCall(token => patchCompanyServices(token, userId, services));
      setConfig(res.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      return res.data;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setSaving(false);
    }
  }, [userId]);

  return { config, loading, saving, saved, error, saveConfig, patchServices, refetch: fetchConfig, justCreated };
}
