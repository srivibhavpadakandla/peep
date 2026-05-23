// Peep relay — Socket.IO + Postgres-backed community posts.
//
// Persistence model:
//   community_posts(id TEXT PK, data JSONB, created_at TIMESTAMPTZ DEFAULT NOW())
//   The full post object (whatever the client emitted) lives in `data`. We
//   pull it back out as-is so the UI doesn't need any per-field marshalling.
//   The table is created on startup — no manual psql needed.
//
// Socket events:
//   client → server: 'hello'        { clientId, name }
//   client → server: 'post:create'  { post }                       → persisted + broadcast
//   client → server: 'message:send' { message }                    → broadcast only (no persistence)
//   server → client: 'snapshot'     { posts: [...] }               (sent right after 'hello')
//   server → client: 'post:new'     { post }                       (broadcast to everyone but the sender)
//   server → client: 'message:new'  { message }
//   server → client: 'presence'     { online: [<name>, ...] }
//
// Messages stay in memory by design — the user asked us to persist posts only.

import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import pg from 'pg';

const { Pool } = pg;

const PORT = parseInt(process.env.PORT || '8788', 10);
const DATABASE_URL = process.env.DATABASE_URL
  || 'postgresql://neondb_owner:npg_H9AMGo6sYWmu@ep-misty-block-appdm97o-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

// ── Postgres ────────────────────────────────────────────────────────────────
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,
});

pool.on('error', (err) => console.error('[pg pool error]', err.message));

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS community_posts (
      id         TEXT PRIMARY KEY,
      data       JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS community_posts_created_at_idx
      ON community_posts (created_at DESC);
  `);
}

async function insertPost(post) {
  // Insert if-not-exists; return the stored row so we can broadcast a canonical copy.
  const { rows } = await pool.query(
    `INSERT INTO community_posts (id, data)
       VALUES ($1, $2::jsonb)
       ON CONFLICT (id) DO NOTHING
       RETURNING data, created_at`,
    [post.id, JSON.stringify(post)],
  );
  if (!rows.length) return null;
  return rows[0].data;
}

async function listPosts(limit = 100) {
  const { rows } = await pool.query(
    `SELECT data FROM community_posts
       ORDER BY created_at DESC
       LIMIT $1`,
    [limit],
  );
  return rows.map(r => r.data);
}

// ── HTTP + Socket.IO ────────────────────────────────────────────────────────
const httpServer = http.createServer(async (req, res) => {
  if (req.url === '/health' || req.url === '/') {
    try {
      const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM community_posts');
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({
        ok: true,
        service: 'peep-relay',
        transport: 'socket.io',
        db: 'neon',
        posts_in_db: rows[0].n,
        sockets: io?.engine?.clientsCount ?? 0,
      }));
    } catch (e) {
      res.writeHead(500, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: e.message }));
    }
    return;
  }
  res.writeHead(404); res.end();
});

const io = new SocketIOServer(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  // Socket.IO chooses its own path (/socket.io). Polling fallback is on by
  // default; that's what makes the trycloudflare tunnel work without
  // any sticky-session pinning.
});

const clients = new Map(); // socket.id → { clientId, name }
const sendPresence = () => {
  io.emit('presence', { online: [...clients.values()].map(c => c.name).filter(Boolean) });
};

io.on('connection', (socket) => {
  clients.set(socket.id, { clientId: '', name: '' });
  console.log(`[+] ${socket.id} connected · total=${clients.size}`);

  socket.on('hello', async ({ clientId = '', name = '' } = {}) => {
    clients.set(socket.id, { clientId: String(clientId).slice(0, 64), name: String(name).slice(0, 64) });
    try {
      const posts = await listPosts();
      socket.emit('snapshot', { posts });
    } catch (e) {
      console.error('[snapshot]', e.message);
      socket.emit('snapshot', { posts: [], error: e.message });
    }
    sendPresence();
  });

  socket.on('post:create', async ({ post } = {}) => {
    if (!post || typeof post.id !== 'string') return;
    try {
      const stored = await insertPost(post);
      if (!stored) return; // dedup
      // broadcast to every connected client INCLUDING the sender, so the
      // sender knows the post was accepted and persisted. The client de-dups
      // by id, so the optimistic local copy gets reconciled.
      io.emit('post:new', { post: stored });
    } catch (e) {
      console.error('[post:create]', e.message);
      socket.emit('error:post', { id: post.id, error: e.message });
    }
  });

  socket.on('message:send', ({ message } = {}) => {
    if (!message || typeof message.id !== 'string') return;
    io.emit('message:new', { message });
  });

  socket.on('disconnect', () => {
    clients.delete(socket.id);
    console.log(`[-] ${socket.id} disconnected · total=${clients.size}`);
    sendPresence();
  });
});

// ── Boot ────────────────────────────────────────────────────────────────────
(async function main() {
  try {
    await ensureSchema();
    console.log('schema ok');
  } catch (e) {
    console.error('schema bootstrap failed:', e.message);
    process.exit(1);
  }
  httpServer.listen(PORT, () => {
    console.log(`peep-relay listening on :${PORT}  (socket.io path: /socket.io)`);
  });
})();
