'use strict';

function decodeEntities(text) {
  return String(text || '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function htmlToText(html, maxChars = 200000) {
  const withoutNoise = String(html || '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<!--([\s\S]*?)-->/g, ' ')
    .replace(/<[^>]+>/g, ' ');

  return decodeEntities(withoutNoise)
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxChars);
}

function extractTitle(html) {
  const match = String(html || '').match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  if (!match) return '';
  return htmlToText(match[1], 300);
}

function canonicalizeUrl(value) {
  const url = new URL(value);
  url.hash = '';
  return url.toString();
}

function extractLinks(html, baseUrl, limit = 100) {
  const links = [];
  const seen = new Set();
  const pattern = /<a\b[^>]*\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;
  let match;

  while ((match = pattern.exec(String(html || ''))) && links.length < limit) {
    const href = (match[1] || match[2] || match[3] || '').trim();
    if (!href || /^(?:javascript|mailto|tel|data):/i.test(href)) continue;

    try {
      const resolved = new URL(href, baseUrl);
      if (!['http:', 'https:'].includes(resolved.protocol)) continue;
      const normalized = canonicalizeUrl(resolved.toString());
      if (!seen.has(normalized)) {
        seen.add(normalized);
        links.push(normalized);
      }
    } catch (_) {
      // Ignore malformed links discovered in untrusted content.
    }
  }

  return links;
}

module.exports = { canonicalizeUrl, decodeEntities, extractLinks, extractTitle, htmlToText };
