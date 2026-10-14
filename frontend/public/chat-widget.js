/*
 * Embeddable AI chatbot widget (Growth/Pro tier -- see
 * routes/chatWidget.js and the AdminChatbots.js dashboard tab).
 * One script, no dependencies, no build step -- loaded directly via
 * <script src=".../chat-widget.js" data-chatbot-id="..." data-api-url="..." async>
 * on a client's own website, which is why this is plain ES5-ish JS wrapped
 * in an IIFE rather than React: it has to run standalone on any page,
 * however that page builds its own scripts.
 */
(function () {
  'use strict';

  // Captured synchronously on the first line of execution -- this is the
  // only safe moment to read document.currentScript even for an `async`
  // script tag; once anything in this file awaits (a fetch, a timeout),
  // document.currentScript may have moved on to whatever script loads next.
  var scriptEl = document.currentScript;
  if (!scriptEl) return;

  var chatbotId = scriptEl.getAttribute('data-chatbot-id');
  var apiUrl = (scriptEl.getAttribute('data-api-url') || 'https://api.cleanestimator.com').replace(/\/$/, '');
  if (!chatbotId) return;

  var STORAGE_KEY = 'cleancalc_chat_' + chatbotId;
  var sessionToken = null;
  var businessName = 'Chat with us';
  var open = false;
  var sending = false;

  function loadStored() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : { sessionToken: null, messages: [] };
    } catch (e) { return { sessionToken: null, messages: [] }; }
  }
  function saveStored(data) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) { /* ignore (private mode, quota) */ }
  }

  var stored = loadStored();
  sessionToken = stored.sessionToken;
  var messages = stored.messages || [];

  // ─── Styles ────────────────────────────────────────────────────────────
  var style = document.createElement('style');
  style.textContent = [
    '.ccw-bubble{position:fixed;bottom:20px;right:20px;width:58px;height:58px;border-radius:50%;background:#1d4ed8;box-shadow:0 10px 28px rgba(29,78,216,0.4);border:none;cursor:pointer;z-index:999999;display:flex;align-items:center;justify-content:center;transition:transform 0.15s;}',
    '.ccw-bubble:hover{transform:scale(1.06);}',
    '.ccw-panel{position:fixed;bottom:90px;right:20px;width:340px;max-width:calc(100vw - 32px);height:480px;max-height:calc(100vh - 120px);background:#fff;border-radius:16px;box-shadow:0 20px 50px rgba(15,23,42,0.25);display:flex;flex-direction:column;overflow:hidden;z-index:999999;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;}',
    '.ccw-header{background:#1d4ed8;color:#fff;padding:14px 16px;display:flex;justify-content:space-between;align-items:center;flex-shrink:0;}',
    '.ccw-header-title{font-weight:700;font-size:14.5px;}',
    '.ccw-header-close{background:none;border:none;color:#fff;cursor:pointer;opacity:0.85;padding:4px;display:flex;}',
    '.ccw-messages{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:8px;background:#f8fafc;}',
    '.ccw-msg{max-width:80%;padding:9px 12px;border-radius:14px;font-size:13.5px;line-height:1.45;white-space:pre-wrap;word-wrap:break-word;}',
    '.ccw-msg-user{align-self:flex-end;background:#1d4ed8;color:#fff;border-bottom-right-radius:4px;}',
    '.ccw-msg-assistant{align-self:flex-start;background:#fff;color:#0f172a;border:1px solid #e2e8f0;border-bottom-left-radius:4px;}',
    '.ccw-typing{align-self:flex-start;background:#fff;border:1px solid #e2e8f0;border-radius:14px;border-bottom-left-radius:4px;padding:10px 14px;display:flex;gap:4px;}',
    '.ccw-typing span{width:6px;height:6px;border-radius:50%;background:#94a3b8;display:inline-block;animation:ccw-bounce 1.2s infinite;}',
    '.ccw-typing span:nth-child(2){animation-delay:0.15s;}',
    '.ccw-typing span:nth-child(3){animation-delay:0.3s;}',
    '@keyframes ccw-bounce{0%,60%,100%{transform:translateY(0);opacity:0.5;}30%{transform:translateY(-4px);opacity:1;}}',
    '.ccw-input-row{display:flex;gap:8px;padding:12px;border-top:1px solid #e2e8f0;flex-shrink:0;background:#fff;}',
    '.ccw-input{flex:1;border:1.5px solid #e2e8f0;border-radius:10px;padding:9px 12px;font-size:13.5px;outline:none;font-family:inherit;}',
    '.ccw-input:focus{border-color:#1d4ed8;}',
    '.ccw-send{background:#1d4ed8;color:#fff;border:none;border-radius:10px;padding:0 14px;cursor:pointer;font-weight:700;font-size:13px;flex-shrink:0;}',
    '.ccw-send:disabled{opacity:0.5;cursor:default;}',
    '@media (max-width:420px){.ccw-panel{right:16px;left:16px;width:auto;}}',
  ].join('\n');
  document.head.appendChild(style);

  // ─── DOM ───────────────────────────────────────────────────────────────
  var bubble = document.createElement('button');
  bubble.className = 'ccw-bubble';
  bubble.setAttribute('aria-label', 'Open chat');
  bubble.innerHTML = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>';

  var panel = document.createElement('div');
  panel.className = 'ccw-panel';
  panel.style.display = 'none';

  var header = document.createElement('div');
  header.className = 'ccw-header';
  var headerTitle = document.createElement('div');
  headerTitle.className = 'ccw-header-title';
  headerTitle.textContent = businessName;
  var closeBtn = document.createElement('button');
  closeBtn.className = 'ccw-header-close';
  closeBtn.setAttribute('aria-label', 'Close chat');
  closeBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
  header.appendChild(headerTitle);
  header.appendChild(closeBtn);

  var messagesEl = document.createElement('div');
  messagesEl.className = 'ccw-messages';

  var inputRow = document.createElement('div');
  inputRow.className = 'ccw-input-row';
  var input = document.createElement('input');
  input.className = 'ccw-input';
  input.type = 'text';
  input.placeholder = 'Type a message…';
  var sendBtn = document.createElement('button');
  sendBtn.className = 'ccw-send';
  sendBtn.textContent = 'Send';
  inputRow.appendChild(input);
  inputRow.appendChild(sendBtn);

  panel.appendChild(header);
  panel.appendChild(messagesEl);
  panel.appendChild(inputRow);
  document.body.appendChild(bubble);
  document.body.appendChild(panel);

  function renderMessages() {
    messagesEl.innerHTML = '';
    for (var i = 0; i < messages.length; i++) {
      var m = messages[i];
      var el = document.createElement('div');
      el.className = 'ccw-msg ' + (m.role === 'user' ? 'ccw-msg-user' : 'ccw-msg-assistant');
      el.textContent = m.text;
      messagesEl.appendChild(el);
    }
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function showTyping() {
    var el = document.createElement('div');
    el.className = 'ccw-typing';
    el.id = 'ccw-typing-indicator';
    el.innerHTML = '<span></span><span></span><span></span>';
    messagesEl.appendChild(el);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }
  function hideTyping() {
    var el = document.getElementById('ccw-typing-indicator');
    if (el) el.remove();
  }

  function persist() {
    saveStored({ sessionToken: sessionToken, messages: messages.slice(-40) });
  }

  function addMessage(role, text) {
    messages.push({ role: role, text: text });
    renderMessages();
    persist();
  }

  function sendMessage() {
    var text = input.value.trim();
    if (!text || sending) return;
    sending = true;
    sendBtn.disabled = true;
    input.value = '';
    addMessage('user', text);
    showTyping();

    fetch(apiUrl + '/api/chat/' + chatbotId + '/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionToken: sessionToken, message: text }),
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        hideTyping();
        if (data && data.success) {
          sessionToken = data.sessionToken;
          addMessage('assistant', data.reply);
        } else {
          addMessage('assistant', "Sorry, something went wrong. Please try again in a moment.");
        }
      })
      .catch(function () {
        hideTyping();
        addMessage('assistant', "Sorry, something went wrong. Please try again in a moment.");
      })
      .finally(function () {
        sending = false;
        sendBtn.disabled = false;
        input.focus();
      });
  }

  function closeChatSession() {
    if (!sessionToken) return;
    var payload = JSON.stringify({ sessionToken: sessionToken });
    var url = apiUrl + '/api/chat/' + chatbotId + '/close';
    // sendBeacon survives the page actually unloading, which a normal
    // fetch often doesn't -- falls back to fetch for the explicit
    // in-page close-button click, where the page isn't going anywhere.
    if (navigator.sendBeacon) {
      try {
        navigator.sendBeacon(url, new Blob([payload], { type: 'application/json' }));
        return;
      } catch (e) { /* fall through to fetch */ }
    }
    fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true }).catch(function () {});
  }

  function togglePanel(forceOpen) {
    open = typeof forceOpen === 'boolean' ? forceOpen : !open;
    panel.style.display = open ? 'flex' : 'none';
    if (open) {
      if (messages.length === 0) {
        addMessage('assistant', 'Hi! How can I help you today?');
      }
      input.focus();
    }
  }

  bubble.addEventListener('click', function () { togglePanel(true); });
  closeBtn.addEventListener('click', function () { togglePanel(false); });
  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter') sendMessage(); });
  window.addEventListener('beforeunload', closeChatSession);

  renderMessages();

  // Fetch the chatbot's display name (and confirm it's active) before
  // showing the bubble at all -- a paused or deleted chatbot shouldn't
  // leave a dead bubble on the client's site.
  fetch(apiUrl + '/api/chat/' + chatbotId + '/info')
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (data && data.success && data.active) {
        businessName = data.businessName || businessName;
        headerTitle.textContent = businessName;
      } else {
        bubble.style.display = 'none';
      }
    })
    .catch(function () { bubble.style.display = 'none'; });
})();
