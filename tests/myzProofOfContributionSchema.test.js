const fs = require('fs');
const path = require('path');
const Ajv2020 = require('ajv/dist/2020');

const schemaPath = path.join(
  __dirname,
  '..',
  'bounty-engine',
  'myz-bounty-schema.json'
);
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

const lawfulPolicy = {
  lawful_only: true,
  unauthorized_access_prohibited: true,
  illegal_activity_reward_myz: 0,
};

const baseBounty = {
  schema_version: '1.0',
  bounty_id: 'MYZ-BTY-POC-TEST-001',
  title: 'Validate a contribution schema',
  action_type: 'VERIFICATION',
  scope_id: 'myz-proof-of-contribution',
  scope: 'Repository documentation and schema only',
  base_reward_myz: 100,
  max_reward_myz: 150,
  risk_level: 'low',
  status: 'OPEN',
  evidence_requirements: ['Public reproducible validation output'],
  acceptance_criteria: ['Schema validates under Draft 2020-12'],
  legal_policy: lawfulPolicy,
};

describe('MYZ Proof-of-Contribution schema', () => {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  const validate = ajv.compile(schema);

  test('is itself valid JSON Schema Draft 2020-12', () => {
    expect(ajv.validateSchema(schema)).toBe(true);
  });

  test('accepts a lawful low-risk bounty', () => {
    expect(validate(baseBounty)).toBe(true);
  });

  test('requires an explicit lawful policy', () => {
    const { legal_policy: _omitted, ...withoutPolicy } = baseBounty;

    expect(validate(withoutPolicy)).toBe(false);
    expect(validate.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          instancePath: '',
          keyword: 'required',
          params: { missingProperty: 'legal_policy' },
        }),
      ])
    );
  });

  test('requires high-risk verifier quorum and maintainer approval fields', () => {
    expect(validate({ ...baseBounty, risk_level: 'high' })).toBe(false);
    expect(validate.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          keyword: 'required',
          params: { missingProperty: 'required_verifiers' },
        }),
        expect.objectContaining({
          keyword: 'required',
          params: { missingProperty: 'maintainer_approval_required' },
        }),
      ])
    );
  });

  test.each([
    [{ required_verifiers: 1, maintainer_approval_required: true }, 'verifier count'],
    [{ required_verifiers: 2, maintainer_approval_required: false }, 'maintainer approval'],
  ])('rejects an invalid high-risk %s', (overrides) => {
    expect(
      validate({ ...baseBounty, risk_level: 'high', ...overrides })
    ).toBe(false);
  });

  test('accepts a high-risk bounty with the required controls', () => {
    expect(
      validate({
        ...baseBounty,
        risk_level: 'high',
        required_verifiers: 2,
        maintainer_approval_required: true,
      })
    ).toBe(true);
  });

  test.each([
    ['lawful_only', false],
    ['unauthorized_access_prohibited', false],
    ['illegal_activity_reward_myz', 1],
  ])('rejects an unsafe legal policy override for %s', (field, value) => {
    expect(
      validate({
        ...baseBounty,
        legal_policy: { ...lawfulPolicy, [field]: value },
      })
    ).toBe(false);
  });
});
