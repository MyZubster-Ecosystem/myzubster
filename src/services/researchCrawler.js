'use strict';

const crypto = require('crypto');
const { extractLinks, extractTitle, htmlToText } = require('./researchContent');

function sha256(value) {
  return crypto.createHash('sha256').update(String(value || ''), 'utf8').digest('hex');
}

function clampInteger(value, fallback, min, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(parsed)));
}

function createResearchCrawler({ policy, fetchWeb, fetchOnion, store } = {}) {
  if (!policy || typeof policy.assertUrl !== 'function') throw new Error('research crawler policy is required');
  if (typeof fetchWeb !== 'function' || typeof fetchOnion !== 'function') throw new Error('research crawler fetchers are required');
  if (!store || typeof store.upsert !== 'function') throw new Error('research crawler store is required');

  return {
    async crawl({ seed, maxDepth = 1, maxPages = 20 } = {}) {
      const seedPolicy = policy.assertUrl(seed);
      const boundedDepth = clampInteger(maxDepth, 1, 0, 2);
      const boundedPages = clampInteger(maxPages, 20, 1, 25);
      const seedHost = seedPolicy.url.hostname;
      const queue = [{ url: seedPolicy.url.toString(), depth: 0 }];
      const visited = new Set();
      const indexed = [];
      const errors = [];

      while (queue.length && visited.size < boundedPages) {
        const current = queue.shift();
        if (visited.has(current.url)) continue;
        visited.add(current.url);

        let currentPolicy;
        try {
          currentPolicy = policy.assertUrl(current.url);
          if (currentPolicy.url.hostname !== seedHost) continue;
        } catch (error) {
          errors.push({ url: current.url, error: error.message });
          continue;
        }

        try {
          const fetcher = currentPolicy.sourceType === 'onion' ? fetchOnion : fetchWeb;
          const response = await fetcher(currentPolicy.url.toString());
          const contentType = String(response.contentType || '');
          if (!contentType.includes('text/html') && !contentType.includes('text/plain')) {
            errors.push({ url: current.url, error: `unsupported content type: ${contentType || 'unknown'}` });
            continue;
          }

          const isHtml = contentType.includes('text/html');
          const text = isHtml ? htmlToText(response.body) : String(response.body || '').slice(0, 200000);
          const title = isHtml ? extractTitle(response.body) : '';
          const document = {
            normalizedUrl: currentPolicy.url.toString(),
            sourceType: currentPolicy.sourceType,
            host: currentPolicy.url.hostname,
            title,
            text,
            snippet: text.slice(0, 280),
            contentHash: sha256(response.body),
            contentType,
            statusCode: response.status,
            depth: current.depth,
            crawledAt: new Date(),
            metadata: { crawler: 'myz-research/0.1', sameHostOnly: true },
          };
          await store.upsert(document);
          indexed.push({ url: document.normalizedUrl, title, depth: current.depth, contentHash: document.contentHash });

          if (isHtml && current.depth < boundedDepth) {
            for (const link of extractLinks(response.body, currentPolicy.url.toString(), 100)) {
              if (visited.has(link) || queue.some(item => item.url === link)) continue;
              try {
                const linkPolicy = policy.assertUrl(link);
                if (linkPolicy.url.hostname !== seedHost) continue;
                queue.push({ url: linkPolicy.url.toString(), depth: current.depth + 1 });
              } catch (_) {
                // Out-of-policy links are intentionally ignored.
              }
            }
          }
        } catch (error) {
          errors.push({ url: current.url, error: error.message });
        }
      }

      return {
        seed: seedPolicy.url.toString(),
        sourceType: seedPolicy.sourceType,
        maxDepth: boundedDepth,
        maxPages: boundedPages,
        visited: visited.size,
        indexedCount: indexed.length,
        indexed,
        errors,
      };
    },
  };
}

module.exports = { clampInteger, createResearchCrawler, sha256 };
