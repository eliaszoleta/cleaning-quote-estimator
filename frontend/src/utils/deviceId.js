// A random id persisted in this browser's localStorage, used to back the
// public daily-estimate limit (calculate.js's PUBLIC_DAILY_LIMIT) with a
// second dimension beyond IP address. IP alone resets the moment a visitor
// switches VPN servers -- this id doesn't, since VPN/proxy rotation never
// touches localStorage. Not a real anti-abuse measure on its own (clearing
// site data, incognito, or a different browser all generate a fresh id just
// as easily as a VPN gets a fresh IP) -- it closes the laziest version of
// the bypass (toggle VPN, keep using the same browser) without the cost/
// complexity/privacy questions of real device fingerprinting.
const KEY = 'cc_device_id';

export function getDeviceId() {
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = (window.crypto?.randomUUID?.()) || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    // Private-browsing mode on some browsers throws on any localStorage
    // access rather than just returning null -- fails open (no id sent),
    // same as calculate.js already does for a missing/unreadable IP.
    return null;
  }
}
