import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import SimpleHomePage from './SimpleHomePage';

test('exposes accessible navigation and ordered workflow landmarks', () => {
  const html = renderToStaticMarkup(<SimpleHomePage onExplore={() => {}} />);

  expect(html).toContain('href="#contenuto-principale"');
  expect(html).toContain('id="contenuto-principale"');
  expect(html).toContain('aria-label="Navigazione principale"');
  expect(html).toContain('aria-label="Workflow MyZubster in cinque passaggi"');
  expect((html.match(/<li/g) || []).length).toBe(5);
});
