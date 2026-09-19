const { buildGithubWorkEvidence, verifyGithubWorkEvidence } = require('../src/services/githubWorkEvidenceService');

describe('GitHub work evidence', () => {
  test('builds deterministic metrics and verifies SHA-256 snapshot', () => {
    const result = buildGithubWorkEvidence({
      account:'DanielIoni-creator',
      commits:[
        {sha:'abcdef1',repository:'MyZubster-Ecosystem/myzubster',url:'https://github.com/MyZubster-Ecosystem/myzubster/commit/abcdef1',committedAt:'2026-09-18T10:00:00Z'},
        {sha:'abcdef2',repository:'MyZubster-Ecosystem/myzubster',url:'https://github.com/MyZubster-Ecosystem/myzubster/commit/abcdef2',committedAt:'2026-09-19T10:00:00Z'}
      ]
    });
    expect(result.payload.metrics).toMatchObject({commits:2,repositories:1,activeDays:2});
    expect(result.commitment).toBe(`MZ-GITHUB-WORK-V1:${result.evidenceHash}`);
    expect(verifyGithubWorkEvidence(result.payload,result.evidenceHash)).toBe(true);
  });
});
