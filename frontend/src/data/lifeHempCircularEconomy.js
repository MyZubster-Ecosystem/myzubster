export const HEMP_CIRCULAR_CATEGORIES = [
  {
    id: 'fiber-textiles',
    label: 'Fibra e tessili',
    description: 'Fibre, tessuti e materiali compositi da canapa industriale.',
    regulated: false,
  },
  {
    id: 'paper-packaging',
    label: 'Carta e packaging',
    description: 'Carta, imballaggi e sostituti di materiali monouso.',
    regulated: false,
  },
  {
    id: 'building-materials',
    label: 'Edilizia e biomateriali',
    description: 'Canapulo, biocompositi e materiali da costruzione a base di canapa.',
    regulated: false,
  },
  {
    id: 'agri-residues',
    label: 'Residui e riuso agricolo',
    description: 'Recupero, trasformazione e valorizzazione di residui della filiera.',
    regulated: false,
  },
  {
    id: 'regulated-cannabinoids',
    label: 'Cannabinoidi regolamentati',
    description: 'Categoria solo compliance: nessuna vendita automatica o abilitazione commerciale.',
    regulated: true,
  },
];

export const REGULATED_OPERATOR_STATUS = Object.freeze({
  UNVERIFIED: 'UNVERIFIED',
  PENDING_REVIEW: 'PENDING_REVIEW',
  VERIFIED: 'VERIFIED',
  SUSPENDED: 'SUSPENDED',
  REJECTED: 'REJECTED',
});

export const LIFE_HEMP_COMPLIANCE_FIELDS = [
  'jurisdiction',
  'operatorName',
  'operatorType',
  'licenseAuthority',
  'licenseReference',
  'licenseValidFrom',
  'licenseValidUntil',
  'productCategory',
  'ageRestriction',
  'labAnalysisRequired',
  'traceabilityReference',
  'status',
  'lastReviewedAt',
];

export const createEmptyHempOperatorRecord = () => ({
  jurisdiction: '',
  operatorName: '',
  operatorType: '',
  licenseAuthority: '',
  licenseReference: '',
  licenseValidFrom: '',
  licenseValidUntil: '',
  productCategory: '',
  ageRestriction: null,
  labAnalysisRequired: false,
  traceabilityReference: '',
  status: REGULATED_OPERATOR_STATUS.UNVERIFIED,
  lastReviewedAt: null,
});

export function canEnableRegulatedCommerce(record) {
  if (!record) return false;
  return (
    record.status === REGULATED_OPERATOR_STATUS.VERIFIED &&
    Boolean(record.jurisdiction) &&
    Boolean(record.licenseAuthority) &&
    Boolean(record.licenseReference) &&
    Boolean(record.licenseValidUntil)
  );
}

export function buildHempCircularKpis(entries = []) {
  return entries.reduce(
    (acc, entry) => {
      acc.totalEntries += 1;
      acc.reusedMaterialKg += Number(entry.reusedMaterialKg || 0);
      acc.avoidedWasteKg += Number(entry.avoidedWasteKg || 0);
      acc.estimatedCo2eAvoidedKg += Number(entry.estimatedCo2eAvoidedKg || 0);
      if (entry.verified === true) acc.verifiedEntries += 1;
      return acc;
    },
    {
      totalEntries: 0,
      verifiedEntries: 0,
      reusedMaterialKg: 0,
      avoidedWasteKg: 0,
      estimatedCo2eAvoidedKg: 0,
    },
  );
}

export const HEMP_COMMERCE_GUARDRAILS = Object.freeze({
  regulatedProductsDefaultEnabled: false,
  requireVerifiedOperator: true,
  requireJurisdictionCheck: true,
  requireLicenseCheck: true,
  requireAgeGateWhenApplicable: true,
  requireLabDocumentationWhenApplicable: true,
  prohibitAutomaticCrossBorderEnablement: true,
});
