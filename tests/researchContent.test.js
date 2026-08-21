const { extractLinks, extractTitle, htmlToText } = require('../src/services/researchContent');

describe('research content helpers', () => {
  test('extracts readable text while removing scripts and styles', () => {
    const html = '<html><head><title> Example &amp; Docs </title><style>.x{}</style></head><body>Hello <b>world</b><script>alert(1)</script></body></html>';
    expect(extractTitle(html)).toBe('Example & Docs');
    expect(htmlToText(html)).toContain('Hello world');
    expect(htmlToText(html)).not.toContain('alert');
  });

  test('resolves and deduplicates safe http links', () => {
    const html = '<a href="/a#x">A</a><a href="/a#y">A2</a><a href="https://example.com/b">B</a><a href="javascript:alert(1)">bad</a>';
    expect(extractLinks(html, 'https://example.com/root')).toEqual([
      'https://example.com/a',
      'https://example.com/b',
    ]);
  });
});
