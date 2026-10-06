const fs = require('fs');
const path = require('path');

describe('cultural contributor attestation', () => {
  const routes = fs.readFileSync(path.join(__dirname, '../src/routes/authRoutes.js'), 'utf8');
  const controller = fs.readFileSync(path.join(__dirname, '../src/controllers/culturalContributorController.js'), 'utf8');
  const model = fs.readFileSync(path.join(__dirname, '../src/models/CulturalContributorAttestation.js'), 'utf8');

  test('requires an authenticated MyZubster account', () => {
    expect(routes).toContain("router.post('/cultural-contributor/attestation', authenticate, culturalContributorController.attest)");
    expect(routes).toContain("router.get('/cultural-contributor/attestation', authenticate, culturalContributorController.getAttestation)");
  });

  test('requires explicit identity and boundary confirmations', () => {
    expect(controller).toContain('confirm !== true');
    expect(controller).toContain('individualCapacityOnly !== true');
    expect(controller).toContain('noCollectiveRepresentation !== true');
    expect(controller).toContain('noCollectiveEndorsement !== true');
    expect(controller).toContain('only in my individual capacity');
  });

  test('stores one immutable attestation per account and dialogue', () => {
    expect(model).toContain("immutable: true");
    expect(model).toContain("culturalContributorAttestationSchema.index({ userId: 1, dialogueId: 1 }, { unique: true })");
  });
});
