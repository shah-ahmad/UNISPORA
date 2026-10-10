import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
const schema = JSON.parse(readFileSync(new URL('./schema.json', import.meta.url), 'utf8'));
const db = '/databases/unispora/collections/';
const id = value => {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,35}$/.test(value)) throw new Error('Invalid record ID.');
  return value;
};
export function validate(collection, input) {
  if (!schema[collection] || !input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Invalid data.');
  const output = {};
  for (const field of schema[collection].fields) {
    const value = input[field.key];
    if (value == null || value === '') {
      if (field.required) throw new Error(`${field.key} is required.`);
      output[field.key] = field.array ? [] : null; continue;
    }
    if (field.array) {
      if (!Array.isArray(value) || value.length > 500 || value.some(v => typeof v !== 'string' || (field.size && v.length > field.size))) throw new Error(`Invalid ${field.key}.`);
    } else if (field.type === 'boolean') {
      if (typeof value !== 'boolean') throw new Error(`Invalid ${field.key}.`);
    } else if (['integer', 'double'].includes(field.type)) {
      if (typeof value !== 'number' || !Number.isFinite(value) || (field.type === 'integer' && !Number.isInteger(value)) || (field.min != null && value < field.min) || (field.max != null && value > field.max)) throw new Error(`Invalid ${field.key}.`);
    } else {
      if (typeof value !== 'string' || (field.size && value.length > field.size) || (field.elements && !field.elements.includes(value))) throw new Error(`Invalid ${field.key}.`);
      if (field.type === 'datetime' && !Number.isFinite(Date.parse(value))) throw new Error(`Invalid ${field.key}.`);
      if (field.format === 'url' && !/^https?:\/\//i.test(value)) throw new Error('Links must begin with https:// or http://.');
      if (field.format === 'facts') {
        let facts; try { facts = JSON.parse(value); } catch { throw new Error('Invalid quick facts.'); }
        if (!Array.isArray(facts) || facts.some(f => typeof f?.label !== 'string' || typeof f?.value !== 'string')) throw new Error('Invalid quick facts.');
      }
    }
    output[field.key] = value;
  }
  if (collection === 'scholarships' && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(output.slug)) throw new Error('Use a lowercase, hyphenated scholarship slug.');
  if (collection === 'premium_plans' && !/^[A-Z]{3}$/.test(output.currency)) throw new Error('Use a three-letter uppercase currency code.');
  return output;
}
export function ensureManageable(caller, target) {
  if (target.$id === caller.$id || target.labels?.includes('admin')) throw new Error('Administrator accounts cannot be blocked here.');
}
export default async ({ req, res, error }) => {
  if (req.method !== 'POST') return res.json({ message: 'Use POST.' }, 405);
  const endpoint = process.env.APPWRITE_FUNCTION_API_ENDPOINT;
  const project = process.env.APPWRITE_FUNCTION_PROJECT_ID;
  const jwt = req.headers['x-appwrite-user-jwt'];
  if (!jwt) return res.json({ message: 'Sign in as an administrator.' }, 401);
  let auditId;
  const api = async (path, method = 'GET', body, token = false) => {
    const response = await fetch(endpoint + path, {
      method, signal: AbortSignal.timeout(12000),
      headers: { 'Content-Type': 'application/json', 'X-Appwrite-Project': project,
        ...(token ? { 'X-Appwrite-JWT': jwt } : { 'X-Appwrite-Key': req.headers['x-appwrite-key'] }) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (!response.ok) { const failure = await response.json().catch(() => ({})); throw new Error(failure.message || `Request failed (${response.status}).`); }
    return response.status === 204 ? {} : response.json();
  };
  const query = values => '?' + new URLSearchParams(values.map(q => ['queries[]', JSON.stringify(q)]));
  const q = (method, values, attribute) => ({ method, values, ...(attribute ? { attribute } : {}) });
  try {
    let caller;
    try { caller = await api('/account', 'GET', null, true); } catch { return res.json({ message: 'Your session expired. Sign in again.' }, 401); }
    if (!caller.status || !caller.emailVerification || !caller.labels?.includes('admin')) return res.json({ message: 'Administrator access required.' }, 403);
    const body = req.bodyJson || {};
    if (JSON.stringify(body).length > 150000) return res.json({ message: 'Request is too large.' }, 400);
    if (body.action === 'listUsers') {
      const queries = [q('limit', [25]), q('offset', [Math.max(0, Math.min(100000, Number(body.offset) || 0))]), { method: 'orderDesc', attribute: '$createdAt' }];
      const search = typeof body.search === 'string' ? body.search.trim().slice(0, 128) : '';
      const result = await api('/users' + query(queries) + (search ? '&search=' + encodeURIComponent(search) : ''));
      return res.json({ total: result.total, users: result.users.map(u => ({ $id: u.$id, name: u.prefs?.fullName || u.name, email: u.email, status: u.status, emailVerification: u.emailVerification, role: u.labels?.includes('admin') ? 'admin' : u.prefs?.role || 'student', country: u.prefs?.country || '', createdAt: u.$createdAt })) });
    }
    if (!['save', 'delete', 'setUserStatus', 'grantAccess'].includes(body.action)) throw new Error('Unknown action.');
    let collection, data, target;
    if (body.action === 'setUserStatus') {
      target = await api('/users/' + id(body.userId));
      ensureManageable(caller, target);
      if (typeof body.status !== 'boolean') throw new Error('Invalid status.');
    } else if (body.action === 'grantAccess') {
      collection = 'admin_subscriptions';
      data = validate(collection, body.data);
      target = await api('/users/' + id(data.userId));
      await api(db + 'premium_plans/documents/' + id(data.planId));
      if (data.status === 'active' && Date.parse(data.expiresAt) <= Date.now()) throw new Error('Active access must expire in the future.');
    } else {
      collection = body.collection;
      if (!schema[collection] || schema[collection].private) throw new Error('This collection is not editable here.');
      if (body.documentId) id(body.documentId);
      if (body.action === 'save') {
        data = validate(collection, body.data);
        if (collection === 'scholarships') {
          const matches = await api(db + collection + '/documents' + query([q('equal', [data.slug], 'slug'), q('limit', [2])]));
          if (matches.documents.some(d => d.$id !== body.documentId)) throw new Error('That scholarship slug already exists.');
        }
      } else if (!body.documentId) throw new Error('Select a record.');
      if (body.action === 'delete' && collection === 'premium_plans') {
        const grants = await api(db + 'admin_subscriptions/documents' + query([q('equal', [body.documentId], 'planId'), q('limit', [1])]));
        if (grants.total) throw new Error('This plan has access records. Archive the plan instead of deleting it.');
      }
    }
    auditId = randomUUID();
    await api(db + 'admin_activity/documents', 'POST', { documentId: auditId, permissions: [], data: { actorId: caller.$id, action: body.action === 'setUserStatus' ? (body.status ? 'Unblock user' : 'Block user') : body.action, target: target?.$id || `${collection}/${body.documentId || 'new'}`, result: 'pending', detail: String(data?.name || data?.title || '').slice(0, 1000) } });
    let result; let warning;
    if (body.action === 'setUserStatus') {
      await api('/users/' + target.$id + '/status', 'PATCH', { status: body.status });
      // Blocked status immediately denies authenticated API access; also revoke sessions.
      if (!body.status) {
        try { await api('/users/' + target.$id + '/sessions', 'DELETE'); }
        catch { warning = 'User blocked, but session cleanup failed. Access remains blocked.'; }
      }
      result = { status: body.status };
    } else if (body.action === 'grantAccess') {
      let exists = true;
      try { await api(db + collection + '/documents/' + target.$id); } catch (e) { if (!/not.*found|could not be found/i.test(e.message)) throw e; exists = false; }
      result = await api(db + collection + '/documents' + (exists ? '/' + target.$id : ''), exists ? 'PATCH' : 'POST', { data, ...(exists ? {} : { documentId: target.$id, permissions: [] }) });
    } else if (body.action === 'delete') {
      await api(db + collection + '/documents/' + body.documentId, 'DELETE'); result = { deleted: true };
    } else {
      const permissions = schema[collection].published && data.isPublished ? ['read("any")'] : [];
      result = await api(db + collection + '/documents' + (body.documentId ? '/' + body.documentId : ''), body.documentId ? 'PATCH' : 'POST', { data, permissions, ...(body.documentId ? {} : { documentId: randomUUID() }) });
    }
    try { await api(db + 'admin_activity/documents/' + auditId, 'PATCH', { data: { result: 'completed' } }); }
    catch { return res.json({ result, warning: 'Saved, but the activity entry is still pending.' }); }
    return res.json({ result, ...(warning ? { warning } : {}) });
  } catch (failure) {
    if (auditId) { try { await api(db + 'admin_activity/documents/' + auditId, 'PATCH', { data: { result: 'failed' } }); } catch { /* Keep pending audit entry. */ } }
    error?.('Admin request failed.');
    return res.json({ message: failure.message || 'Could not complete the request.' }, 400);
  }
};
