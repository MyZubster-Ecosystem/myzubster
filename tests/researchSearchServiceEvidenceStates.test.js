'use strict';

const { extractDeclaredEvidenceStates } = require('../src/services/researchSearchService');

describe('researchSearchService evidence-state extraction', () => {
  test('extracts bounded id/status pairs from full indexed text', () => {
    const text = `
# Knowledge Cards

id: KC-OPC-001
title: Example One
status: SUPPORTED

Some long narrative in between.

id: KC-OPC-002
title: Example Two
status: VERIFIED
`;

    expect(extractDeclaredEvidenceStates(text)).toEqual([
      { id: 'KC-OPC-001', status: 'SUPPORTED' },
      { id: 'KC-OPC-002', status: 'VERIFIED' },
    ]);
  });

  test('deduplicates identical id/status pairs', () => {
    const text = `
id: KC-OPC-001
status: SUPPORTED

id: KC-OPC-001
status: SUPPORTED
`;

    expect(extractDeclaredEvidenceStates(text)).toEqual([
      { id: 'KC-OPC-001', status: 'SUPPORTED' },
    ]);
  });
});
