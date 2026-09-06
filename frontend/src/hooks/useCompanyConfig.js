import { useState, useEffect, useCallback } from 'react';
import { getCompanyConfig, putCompanyConfig, patchCompanyServices } from '../utils/api';
import { supabase } from '../lib/supabase';

export function useCompanyConfig(userId) {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  const fetchConfig = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Not authenticated');
      const res = await getCompanyConfig(token, userId);
      setConfig(res.data);
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
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Not authenticated');
      const res = await putCompanyConfig(token, userId, updates);
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
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Not authenticated');
      const res = await patchCompanyServices(token, userId, services);
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

  return { config, loading, saving, saved, error, saveConfig, patchServices, refetch: fetchConfig };
}
