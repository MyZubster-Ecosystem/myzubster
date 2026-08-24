const DATABASE_NAME = 'myzubster-dao-identity';
const STORE_NAME = 'keys';
const IDENTITY_KEY = 'primary-ed25519';

export function stableStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
}

function bytesToBase64(bytes) {
  let binary = '';
  for (const byte of new Uint8Array(bytes)) binary += String.fromCharCode(byte);
  return window.btoa(binary);
}

function openIdentityDatabase() {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('IndexedDB non disponibile'));
  });
}

async function databaseOperation(mode, operation) {
  const database = await openIdentityDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, mode);
      const request = operation(transaction.objectStore(STORE_NAME));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Operazione identità non riuscita'));
    });
  } finally {
    database.close();
  }
}

async function didFromSpki(publicKeySpki) {
  const digest = await window.crypto.subtle.digest('SHA-256', publicKeySpki);
  return `did:myz:${Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('')}`;
}

async function createIdentity() {
  if (!window.crypto?.subtle || !window.indexedDB) {
    throw new Error('Il browser non supporta Web Crypto e IndexedDB richiesti dalla DAO.');
  }

  let generated;
  try {
    generated = await window.crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']);
  } catch (_error) {
    throw new Error('Ed25519 non è disponibile in questo browser aggiornato.');
  }

  const spki = await window.crypto.subtle.exportKey('spki', generated.publicKey);
  const pkcs8 = await window.crypto.subtle.exportKey('pkcs8', generated.privateKey);
  const privateKey = await window.crypto.subtle.importKey('pkcs8', pkcs8, { name: 'Ed25519' }, false, ['sign']);
  const publicKey = await window.crypto.subtle.importKey('spki', spki, { name: 'Ed25519' }, true, ['verify']);
  const identity = {
    algorithm: 'Ed25519',
    did: await didFromSpki(spki),
    publicKeySpki: bytesToBase64(spki),
    publicKey,
    privateKey,
    createdAt: new Date().toISOString()
  };

  await databaseOperation('readwrite', (store) => store.put(identity, IDENTITY_KEY));
  return identity;
}

export async function getDaoIdentity({ create = false } = {}) {
  const identity = await databaseOperation('readonly', (store) => store.get(IDENTITY_KEY)).catch(() => null);
  if (identity?.privateKey && identity?.publicKeySpki && identity?.did) return identity;
  return create ? createIdentity() : null;
}

export async function signDaoPayload(payload, identity) {
  if (!identity?.privateKey) throw new Error('Identità DAO non disponibile');
  const encoded = new TextEncoder().encode(stableStringify(payload));
  const signature = await window.crypto.subtle.sign({ name: 'Ed25519' }, identity.privateKey, encoded);
  return bytesToBase64(signature);
}

export function randomNonce() {
  const bytes = window.crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}
