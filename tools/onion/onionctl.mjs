#!/usr/bin/env node
import { createHash, createPrivateKey, createPublicKey, generateKeyPairSync, sign, verify } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

function usage(exitCode = 0) {
  console.log(`MyZubster onionctl\n\nCommands:\n  keygen <private.pem> <public.pem>\n  sign <manifest.json> <private.pem> <signed.json>\n  verify <signed.json> [public.pem]\n  root <signed-or-unsigned.json>\n\nSecurity:\n  - Never commit the private key.\n  - The signature covers the manifest with the signature field removed.\n  - Canonicalization recursively sorts object keys and preserves array order.`);
  process.exit(exitCode);
}

function canonicalize(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${canonicalize(value[k])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function payloadForSignature(manifest) {
  const copy = structuredClone(manifest);
  delete copy.signature;
  return Buffer.from(canonicalize(copy), 'utf8');
}

function sha256(buf) {
  return createHash('sha256').update(buf).digest('hex');
}

function keyIdFromPublicPem(publicPem) {
  const der = createPublicKey(publicPem).export({ type: 'spki', format: 'der' });
  return `ed25519:${sha256(der).slice(0, 32)}`;
}

const [,, command, ...args] = process.argv;
if (!command) usage(1);

if (command === 'keygen') {
  const [privPath, pubPath] = args;
  if (!privPath || !pubPath) usage(1);
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  const privatePem = privateKey.export({ type: 'pkcs8', format: 'pem' });
  const publicPem = publicKey.export({ type: 'spki', format: 'pem' });
  mkdirSync(dirname(resolve(privPath)), { recursive: true });
  mkdirSync(dirname(resolve(pubPath)), { recursive: true });
  writeFileSync(privPath, privatePem, { mode: 0o600 });
  writeFileSync(pubPath, publicPem, { mode: 0o644 });
  console.log(JSON.stringify({
    generated: true,
    private_key: privPath,
    public_key: pubPath,
    key_id: keyIdFromPublicPem(publicPem),
    warning: 'Keep the private key offline and never commit it.'
  }, null, 2));
  process.exit(0);
}

if (command === 'sign') {
  const [manifestPath, privatePath, outPath] = args;
  if (!manifestPath || !privatePath || !outPath) usage(1);
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const privatePem = readFileSync(privatePath, 'utf8');
  const privateKey = createPrivateKey(privatePem);
  const publicPem = createPublicKey(privateKey).export({ type: 'spki', format: 'pem' });
  const payload = payloadForSignature(manifest);
  const signature = sign(null, payload, privateKey).toString('base64');
  manifest.signature = {
    algorithm: 'Ed25519',
    canonicalization: 'myzubster-json-sort-v1',
    key_id: keyIdFromPublicPem(publicPem),
    payload_sha256: sha256(payload),
    signature_base64: signature,
    public_key_pem: publicPem
  };
  writeFileSync(outPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(JSON.stringify({ signed: true, output: outPath, key_id: manifest.signature.key_id, payload_sha256: manifest.signature.payload_sha256 }, null, 2));
  process.exit(0);
}

if (command === 'verify') {
  const [signedPath, publicPath] = args;
  if (!signedPath) usage(1);
  const manifest = JSON.parse(readFileSync(signedPath, 'utf8'));
  if (!manifest.signature) throw new Error('Manifest has no signature block');
  if (manifest.signature.algorithm !== 'Ed25519') throw new Error(`Unsupported algorithm: ${manifest.signature.algorithm}`);
  if (manifest.signature.canonicalization !== 'myzubster-json-sort-v1') throw new Error(`Unsupported canonicalization: ${manifest.signature.canonicalization}`);
  const publicPem = publicPath ? readFileSync(publicPath, 'utf8') : manifest.signature.public_key_pem;
  if (!publicPem) throw new Error('No public key available');
  const payload = payloadForSignature(manifest);
  const actualHash = sha256(payload);
  const expectedKeyId = keyIdFromPublicPem(publicPem);
  const sigOk = verify(null, payload, createPublicKey(publicPem), Buffer.from(manifest.signature.signature_base64, 'base64'));
  const result = {
    valid: sigOk && actualHash === manifest.signature.payload_sha256 && expectedKeyId === manifest.signature.key_id,
    signature_valid: sigOk,
    payload_sha256_valid: actualHash === manifest.signature.payload_sha256,
    key_id_valid: expectedKeyId === manifest.signature.key_id,
    calculated_payload_sha256: actualHash,
    calculated_key_id: expectedKeyId
  };
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.valid ? 0 : 2);
}

if (command === 'root') {
  const [path] = args;
  if (!path) usage(1);
  const raw = readFileSync(path);
  const parsed = JSON.parse(raw.toString('utf8'));
  const canonical = Buffer.from(canonicalize(parsed), 'utf8');
  console.log(JSON.stringify({
    file_sha256: sha256(raw),
    canonical_sha256: sha256(canonical),
    bytes: raw.length,
    schema: parsed.schema ?? null,
    signed: Boolean(parsed.signature)
  }, null, 2));
  process.exit(0);
}

usage(1);
