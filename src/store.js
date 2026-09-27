/* ================= Relational engine (in-memory, indexed) ================= */
class DbErr extends Error {}
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : 'x' + Date.now().toString(36) + Math.random().toString(36).slice(2));
const nowISO = () => { const d = new Date(); const z = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}T${z(d.getHours())}:${z(d.getMinutes())}:${z(d.getSeconds())}`; };
const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const toLatin = s => String(s ?? '').replace(/[۰-۹]/g, d => FA_DIGITS.indexOf(d)).replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
const normKey = s => toLatin(String(s ?? '')).toLowerCase().replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/[‌‏‎]/g, '').replace(/\s+/g, ' ').trim();
const fnv = s => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h; };

const Store = {
  t: {}, idx: {}, uq: {}, refs: {}, journal: null, txDirty: null, txAudit: null, listeners: new Set(), actor: { role: 'admin', user_id: null },
  init() {
    for (const [name, def] of Object.entries(SCHEMA)) {
      this.t[name] = new Map(); this.idx[name] = {}; this.uq[name] = {};
      this.refs[name] = this.refs[name] || [];
      for (const c of Object.keys(def.fk || {})) this.idx[name][c] = new Map();
      for (const c of def.idx || []) this.idx[name][c] = new Map();
      for (const c of def.uniq || []) this.uq[name][c] = new Map();
    }
    for (const [name, def] of Object.entries(SCHEMA))
      for (const [col, [parent, mode]] of Object.entries(def.fk || {})) this.refs[parent].push({ table: name, col, mode });
  },
  /* ---- reads (all O(1) or O(k) via indexes) ---- */
  get(t, id) { return id == null ? null : this.t[t].get(id) || null; },
  all(t) { return Array.from(this.t[t].values()); },
  count(t) { return this.t[t].size; },
  by(t, col, val) {
    const m = this.idx[t][col];
    if (!m) return this.all(t).filter(r => r[col] === val);
    const s = m.get(val); if (!s) return [];
    const out = []; for (const id of s) { const r = this.t[t].get(id); if (r) out.push(r); } return out;
  },
  countBy(t, col, val) { const m = this.idx[t][col]; if (m) { const s = m.get(val); return s ? s.size : 0; } return this.by(t, col, val).length; },
  unique(t, col, val) { const u = this.uq[t][col]; if (!u) return this.by(t, col, val)[0] || null; const id = u.get(normKey(val)); return id ? this.get(t, id) : null; },
  /* ---- index maintenance ---- */
  _index(t, row, add) {
    for (const [col, m] of Object.entries(this.idx[t])) {
      const v = row[col]; if (v == null) continue;
      let s = m.get(v);
      if (add) { if (!s) m.set(v, s = new Set()); s.add(row.id); } else if (s) { s.delete(row.id); if (!s.size) m.delete(v); }
    }
    for (const [col, m] of Object.entries(this.uq[t])) {
      const v = row[col]; if (v == null || v === '') continue;
      const k = normKey(v);
      if (add) m.set(k, row.id); else if (m.get(k) === row.id) m.delete(k);
    }
  },
  _put(t, row) { const old = this.t[t].get(row.id); if (old) this._index(t, old, false); this.t[t].set(row.id, row); this._index(t, row, true); },
  _drop(t, id) { const old = this.t[t].get(id); if (!old) return; this._index(t, old, false); this.t[t].delete(id); },
  /* ---- validation: required, enum, FK, unique, table checks ---- */
  validate(t, row) {
    const def = SCHEMA[t];
    for (const c of def.req || []) { const v = row[c]; if (v == null || v === '' || (typeof v === 'number' && isNaN(v))) throw new DbErr(`فیلد «${FIELD_FA[c] || c}» الزامی است.`); }
    for (const [c, vals] of Object.entries(def.enums || {})) if (row[c] != null && !vals.includes(row[c])) throw new DbErr(`مقدار «${row[c]}» برای ${FIELD_FA[c] || c} مجاز نیست.`);
    for (const [c, [parent]] of Object.entries(def.fk || {})) if (row[c] != null && !this.t[parent].has(row[c])) throw new DbErr(`رابطه نامعتبر: ${SCHEMA[parent].label} مرتبط با «${FIELD_FA[c] || c}» وجود ندارد.`);
    for (const c of def.uniq || []) {
      const v = row[c]; if (v == null || v === '') continue;
      const id = this.uq[t][c].get(normKey(v));
      if (id && id !== row.id) throw new DbErr(`«${FIELD_FA[c] || c}» تکراری است: ${v} قبلاً در ${def.label} ثبت شده.`);
    }
    if (def.check) { const msg = def.check(row, this); if (msg) throw new DbErr(msg); }
  },
  /* ---- writes ---- */
  tx(fn) {
    if (this.journal) return fn();
    this.journal = []; this.txDirty = new Map(); this.txAudit = [];
    try {
      const res = fn();
      const dirty = this.txDirty, audit = this.txAudit;
      this.journal = null; this.txDirty = null; this.txAudit = null;
      for (const a of audit) { const row = { id: uid(), _u: Date.now(), ...a }; this._put('audit_logs', row); dirty.set('audit_logs|' + row.id, ['audit_logs', row.id]); }
      this._pruneAudit(dirty);
      Sync.enqueue(dirty);
      this.emit();
      return res;
    } catch (e) {
      const j = this.journal; this.journal = null; this.txDirty = null; this.txAudit = null;
      for (let i = j.length - 1; i >= 0; i--) { const { t, id, before } = j[i]; if (before) this._put(t, before); else this._drop(t, id); }
      throw e;
    }
  },
  _rec(t, id) { this.journal.push({ t, id, before: this.t[t].get(id) || null }); this.txDirty.set(t + '|' + id, [t, id]); },
  _audit(action, t, id, changes) { if (t === 'audit_logs') return; this.txAudit.push({ user_id: this.actor.user_id, role: this.actor.role, action, table_name: t, record_id: id, label: rowLabel(t, this.get(t, id) || this.journal.findLast?.(x => x.t === t && x.id === id)?.before), changes: changes || null, created_at: nowISO() }); },
  insert(t, data) {
    return this.tx(() => {
      const row = Object.assign({}, data, { id: data.id || uid(), _u: Date.now() });
      if (!('created_at' in row)) row.created_at = nowISO();
      for (const k of Object.keys(row)) if (row[k] === undefined) row[k] = null;
      this.validate(t, row);
      this._rec(t, row.id); this._put(t, row);
      this._audit('create', t, row.id);
      return row;
    });
  },
  update(t, id, patch) {
    return this.tx(() => {
      const old = this.get(t, id); if (!old) throw new DbErr('رکورد پیدا نشد؛ ممکن است توسط کاربر دیگری حذف شده باشد.');
      const row = Object.assign({}, old, patch, { id, _u: Date.now() });
      for (const k of Object.keys(row)) if (row[k] === undefined) row[k] = null;
      this.validate(t, row);
      const changes = {}; for (const k of Object.keys(patch)) if (JSON.stringify(old[k]) !== JSON.stringify(row[k]) && k !== '_u') changes[k] = [old[k] ?? null, row[k] ?? null];
      if (!Object.keys(changes).length) return old;
      this._rec(t, id); this._put(t, row);
      this._audit('update', t, id, changes);
      return row;
    });
  },
  remove(t, id) {
    return this.tx(() => {
      const old = this.get(t, id); if (!old) return;
      for (const ref of this.refs[t]) {
        const kids = this.by(ref.table, ref.col, id);
        if (!kids.length) continue;
        if (ref.mode === 'r') throw new DbErr(`حذف ممکن نیست: ${kids.length.toLocaleString('fa-AF')} رکورد در جدول «${SCHEMA[ref.table].label}» به این رکورد وابسته است (رابطه محدودشده).`);
        if (ref.mode === 'c') for (const k of kids) this.remove(ref.table, k.id);
        if (ref.mode === 'n') for (const k of kids) this.update(ref.table, k.id, { [ref.col]: null });
      }
      this._audit('delete', t, id);
      this._rec(t, id); this._drop(t, id);
    });
  },
  dependents(t, id) { const out = []; for (const ref of this.refs[t]) { const n = this.countBy(ref.table, ref.col, id); if (n) out.push({ table: ref.table, n, mode: ref.mode }); } return out; },
  _pruneAudit(dirty) {
    if (this.t.audit_logs.size <= 600) return;
    const rows = this.all('audit_logs').sort((a, b) => (a.created_at < b.created_at ? -1 : 1)).slice(0, this.t.audit_logs.size - 500);
    for (const r of rows) { this._drop('audit_logs', r.id); dirty.set('audit_logs|' + r.id, ['audit_logs', r.id]); }
  },
  /* ---- remote apply (no validation, no audit, no write-back) ---- */
  applyRemote(t, id, row) {
    if (!this.t[t]) return false;
    if (Sync.isPending(t, id)) return false;
    const cur = this.t[t].get(id);
    if (row == null) { if (cur) { this._drop(t, id); return true; } return false; }
    if (cur && cur._u === row._u) return false;
    this._put(t, Object.assign({}, row, { id }));
    return true;
  },
  on(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); },
  emit() { for (const fn of this.listeners) fn(); },
};

/* ================= Persistence: write-behind to the artifact database ================= */
const COLL = 'hdhs';
const Sync = {
  db: null, state: 'connecting', queue: new Map(), inflight: new Map(), readOnly: false, loaded: false, lastError: null, listeners: new Set(),
  docKey(t, id) { const b = SCHEMA[t].b || 1; return `${t}~${b > 1 ? fnv(id) % b : 0}`; },
  isPending(t, id) { const k = this.docKey(t, id); const q = this.queue.get(k), f = this.inflight.get(k); return !!((q && id in q.rows) || (f && id in f)); },
  enqueue(dirty) {
    for (const [t, id] of dirty.values()) {
      const k = this.docKey(t, id);
      let e = this.queue.get(k); if (!e) this.queue.set(k, e = { t, rows: {} });
      const row = Store.get(t, id);
      e.rows[id] = row ? JSON.parse(JSON.stringify(row)) : null;
    }
    this.kick();
  },
  kick() { clearTimeout(this._tm); this._tm = setTimeout(() => this.flush(), 60); this.setState(); },
  pending() { let n = 0; for (const e of this.queue.values()) n += Object.keys(e.rows).length; for (const r of this.inflight.values()) n += Object.keys(r).length; return n; },
  /* Standalone mode (GitHub Pages / file://): data lives in this browser's localStorage, seeded from data/seed.js */
  device: false, localDocs: null, LS_KEY: 'hdhs.docs.v1',
  useDevice() {
    let docs = null;
    try { docs = JSON.parse(localStorage.getItem(this.LS_KEY) || 'null'); } catch (_) { docs = null; }
    if (!docs && window.HDHS_SEED) docs = JSON.parse(JSON.stringify(window.HDHS_SEED));
    if (!docs) { this.setState('local'); return false; }
    this.localDocs = docs; this.device = true;
    for (const body of Object.values(docs)) for (const [id, row] of Object.entries(body.rows || {})) Store.applyRemote(body.t, id, row);
    this.setState('device'); return true;
  },
  saveDevice() {
    for (const [k, e] of this.queue) { const d = this.localDocs[k] || (this.localDocs[k] = { t: e.t, rows: {} }); Object.assign(d.rows, e.rows); }
    this.queue.clear();
    try { localStorage.setItem(this.LS_KEY, JSON.stringify(this.localDocs)); this.lastError = null; }
    catch (err) { this.lastError = err; toast('ذخیره روی این دستگاه ناموفق بود (حافظه مرورگر پر یا مسدود است).', 'err'); }
    this.setState(this.lastError ? 'err' : 'device');
  },
  resetDevice() { try { localStorage.removeItem(this.LS_KEY); } catch (_) {} location.reload(); },
  setState(s) { if (s) this.state = s; else if (this.device) this.state = 'device'; else if (this.db) this.state = this.pending() ? 'busy' : (this.lastError ? 'err' : 'ok'); for (const fn of this.listeners) fn(); },
  async flush() {
    if (this.device) { this.saveDevice(); return; }
    if (!this.db) { if (this.state === 'local') this.queue.clear(); this.setState(); return; }
    for (const [k, e] of Array.from(this.queue)) {
      if (this.inflight.has(k)) continue;
      this.queue.delete(k); this.inflight.set(k, e.rows);
      this.write(k, e).then(() => { this.lastError = null; }).catch(err => {
        this.lastError = err;
        if (err && err.code === 'invalid_argument') { this.readOnly = true; toast('شما اجازه ثبت تغییرات را در این صفحه ندارید؛ تغییرات فقط روی دستگاه شما دیده می‌شود.', 'err'); }
        else if (err && err.code === 'quota_exceeded') toast('ظرفیت پایگاه داده پر است. رکوردهای قدیمی را حذف کنید.', 'err');
        else { toast('ذخیره تغییرات ناموفق بود؛ دوباره تلاش می‌شود.', 'err'); const again = this.queue.get(k) || { t: e.t, rows: {} }; again.rows = Object.assign({}, e.rows, again.rows); this.queue.set(k, again); setTimeout(() => this.kick(), 3000); }
      }).finally(() => { this.inflight.delete(k); if (this.queue.has(k) && !this.readOnly) this.kick(); else this.setState(); });
    }
    this.setState();
  },
  async write(k, e, attempt = 0) {
    const ref = this.db.collection(COLL).doc(k);
    try { await ref.update({ rows: e.rows }); }
    catch (err) {
      if (err && err.code === 'invalid_argument' && attempt === 0) {
        const snap = await ref.get();
        if (!snap.exists) { await ref.set({ t: e.t, rows: e.rows }); return; }
        throw err;
      }
      if (err && err.code === 'unavailable' && attempt < 2) { await new Promise(r => setTimeout(r, 300 + Math.random() * 700)); return this.write(k, e, attempt + 1); }
      throw err;
    }
  },
  async connect(onReady) {
    let settled = false;
    const fallback = setTimeout(() => { if (!settled) { settled = true; this.state = 'local'; this.setState('local'); onReady('local'); } }, 11000);
    let db = null;
    try { db = window.claude && window.claude.use ? await window.claude.use('db') : null; } catch (_) { db = null; }
    if (!db) { if (!settled) { settled = true; clearTimeout(fallback); const ok = this.useDevice(); onReady(ok ? 'device' : 'local'); } return; }
    this.db = db;
    db.collection(COLL).onSnapshot(snap => {
      let changed = false;
      for (const ch of snap.docChanges()) {
        const body = ch.doc.data(); if (!body || !body.t) continue;
        for (const [id, row] of Object.entries(body.rows || {})) if (Store.applyRemote(body.t, id, row)) changed = true;
      }
      if (!settled) { settled = true; clearTimeout(fallback); this.loaded = true; this.setState('ok'); onReady('db'); }
      else if (changed) Store.emit();
    }, err => { this.lastError = err; this.setState('err'); if (!settled) { settled = true; clearTimeout(fallback); onReady('local'); } });
  },
};
