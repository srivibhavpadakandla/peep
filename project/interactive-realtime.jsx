/* Peep — realtime relay client (Socket.IO transport).
 *
 * Connects to the Peep relay defined in localStorage["peep.relayURL"]
 * (default http://localhost:8788). Loaded via `<script src="…socket.io…">`.
 *
 * Exposes window.PeepRT with:
 *   getURL() / setURL(u)
 *   status() → 'idle' | 'connecting' | 'open' | 'closed'
 *   clientId()
 *   sendPost(post)        — persists post in Neon + broadcasts to every client
 *   sendMessage(message)  — broadcasts a 1:1 chat message (in-memory only)
 *   onPost(fn)            — subscribe to incoming posts; returns unsubscribe
 *   onMessage(fn)         — subscribe to incoming messages
 *   onSnapshot(fn)        — subscribe to initial snapshot payloads ({ posts })
 *   onStatus(fn)          — subscribe to status changes
 *   identify({ name })    — re-send hello with a new display name
 *   reconnect()
 */

(function () {
  const URL_KEY = 'peep.relayURL';
  const CLIENT_ID_KEY = 'peep.wsClientId';
  const DEFAULT_URL = 'http://localhost:8788';

  function defaultURL() {
    try {
      if (typeof window !== 'undefined' && window.location?.host) {
        const h = window.location.host;
        if (!/^(localhost|127\.|0\.0\.0\.0)/.test(h)) {
          return window.location.origin;
        }
      }
    } catch {}
    return DEFAULT_URL;
  }

  // Legacy fallback: older builds saved a "ws://" URL under "peep.wsURL".
  // Auto-migrate to an "http(s)://" origin if we don't have a relayURL yet.
  let url = localStorage.getItem(URL_KEY);
  if (!url) {
    const legacy = localStorage.getItem('peep.wsURL');
    if (legacy) {
      url = legacy.replace(/^ws/, 'http').replace(/\/ws\/?$/, '');
      localStorage.setItem(URL_KEY, url);
    } else {
      url = defaultURL();
    }
  }

  let clientId = localStorage.getItem(CLIENT_ID_KEY);
  if (!clientId) {
    clientId = 'c_' + Math.random().toString(36).slice(2, 10);
    localStorage.setItem(CLIENT_ID_KEY, clientId);
  }

  let socket = null;
  let status = 'idle';
  const subs = {
    post: new Set(),
    message: new Set(),
    snapshot: new Set(),
    status: new Set(),
  };
  const fire = (kind, payload) => subs[kind].forEach(fn => { try { fn(payload); } catch (e) { console.error(e); } });

  function setStatus(s) {
    if (s === status) return;
    status = s;
    fire('status', s);
  }

  function getDisplayName() {
    try {
      if (window.PeepProfile?.get) return window.PeepProfile.get().name;
    } catch {}
    return localStorage.getItem('peep.displayName') || ('Neighbor-' + clientId.slice(2, 6));
  }

  function teardown() {
    if (!socket) return;
    try { socket.removeAllListeners?.(); } catch {}
    try { socket.disconnect(); } catch {}
    socket = null;
  }

  function connect() {
    if (typeof window.io !== 'function') {
      console.warn('[PeepRT] socket.io-client not loaded yet — retrying');
      setTimeout(connect, 200);
      return;
    }
    teardown();
    setStatus('connecting');
    try {
      socket = window.io(url, {
        // Socket.IO server is at `${url}/socket.io`; client appends it.
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 600,
        reconnectionDelayMax: 8000,
        timeout: 10000,
      });
    } catch (e) {
      console.warn('[PeepRT] connect failed', e);
      setStatus('closed');
      return;
    }

    socket.on('connect', () => {
      setStatus('open');
      socket.emit('hello', { clientId, name: getDisplayName() });
    });

    socket.on('disconnect', () => setStatus('closed'));
    socket.on('connect_error', (err) => {
      console.warn('[PeepRT] connect_error', err.message);
      setStatus('closed');
    });

    socket.on('snapshot', (payload) => fire('snapshot', payload || { posts: [] }));
    socket.on('post:new', ({ post } = {}) => post && fire('post', post));
    socket.on('message:new', ({ message } = {}) => message && fire('message', message));
    socket.on('presence', () => { /* no-op for now */ });
    socket.on('error:post', (info) => console.warn('[PeepRT] post rejected', info));
  }

  if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', connect, { once: true });
    } else {
      setTimeout(connect, 0);
    }
  }

  window.PeepRT = {
    getURL: () => url,
    setURL(u) {
      const next = (u || '').trim().replace(/\/+$/, '');
      if (!next) return;
      url = next;
      localStorage.setItem(URL_KEY, next);
      connect();
    },
    status: () => status,
    clientId: () => clientId,
    sendPost(post) {
      if (!socket || socket.disconnected) return false;
      try { socket.emit('post:create', { post }); return true; } catch { return false; }
    },
    sendMessage(message) {
      if (!socket || socket.disconnected) return false;
      try { socket.emit('message:send', { message }); return true; } catch { return false; }
    },
    identify({ name }) {
      if (name) localStorage.setItem('peep.displayName', name);
      if (socket?.connected) socket.emit('hello', { clientId, name: getDisplayName() });
    },
    onPost(fn)     { subs.post.add(fn);     return () => subs.post.delete(fn); },
    onMessage(fn)  { subs.message.add(fn);  return () => subs.message.delete(fn); },
    onSnapshot(fn) { subs.snapshot.add(fn); return () => subs.snapshot.delete(fn); },
    onStatus(fn)   { subs.status.add(fn);   return () => subs.status.delete(fn); },
    reconnect:     connect,
  };
})();
