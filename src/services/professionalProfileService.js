'use strict';

const LIMITS = Object.freeze({
  headline: 180,
  summary: 2000,
  collaboration: 800,
  skillName: 120,
  skillCategory: 80,
  skillExperience: 180,
  skillLevel: 80,
  skillNotes: 600,
  experienceTitle: 140,
  experienceOrganization: 160,
  experienceDuration: 120,
  experienceDescription: 1200,
  evidenceSource: 100,
  evidenceDescription: 600,
  evidenceUrl: 1000,
  listItem: 180
});

function cleanString(value, maxLength) {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/\s+/g, ' ').slice(0, maxLength);
}

function uniqueStrings(values, maxItems = 30, maxLength = LIMITS.listItem) {
  if (!Array.isArray(values)) return [];
  const seen = new Set();
  const result = [];
  for (const value of values) {
    const cleaned = cleanString(value, maxLength);
    if (!cleaned) continue;
    const key = cleaned.toLocaleLowerCase('it');
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(cleaned);
    if (result.length >= maxItems) break;
  }
  return result;
}

function normalizeSkill(value) {
  if (!value || typeof value !== 'object') return null;
  const name = cleanString(value.name, LIMITS.skillName);
  if (!name) return null;
  return {
    name,
    category: cleanString(value.category, LIMITS.skillCategory),
    experience: cleanString(value.experience, LIMITS.skillExperience),
    level: cleanString(value.level, LIMITS.skillLevel),
    evidence: uniqueStrings(value.evidence, 20, 500),
    notes: cleanString(value.notes, LIMITS.skillNotes)
  };
}

function normalizeExperience(value) {
  if (!value || typeof value !== 'object') return null;
  const title = cleanString(value.title, LIMITS.experienceTitle);
  if (!title) return null;
  return {
    title,
    organization: cleanString(value.organization, LIMITS.experienceOrganization),
    duration: cleanString(value.duration, LIMITS.experienceDuration),
    description: cleanString(value.description, LIMITS.experienceDescription),
    evidence: uniqueStrings(value.evidence, 20, 500)
  };
}

function normalizeEvidence(value) {
  if (!value || typeof value !== 'object') return null;
  const source = cleanString(value.source, LIMITS.evidenceSource);
  const description = cleanString(value.description, LIMITS.evidenceDescription);
  const url = cleanString(value.url, LIMITS.evidenceUrl);
  if (!source && !description && !url) return null;
  return { source, description, url };
}

function normalizeProfessionalProfile(input) {
  const value = input && typeof input === 'object' ? input : {};
  return {
    headline: cleanString(value.headline, LIMITS.headline),
    summary: cleanString(value.summary, LIMITS.summary),
    skills: Array.isArray(value.skills) ? value.skills.map(normalizeSkill).filter(Boolean).slice(0, 50) : [],
    experiences: Array.isArray(value.experiences) ? value.experiences.map(normalizeExperience).filter(Boolean).slice(0, 30) : [],
    interests: uniqueStrings(value.interests, 30),
    goals: uniqueStrings(value.goals, 20),
    collaborationAvailability: cleanString(value.collaborationAvailability, LIMITS.collaboration),
    evidence: Array.isArray(value.evidence) ? value.evidence.map(normalizeEvidence).filter(Boolean).slice(0, 30) : []
  };
}

function validateProfessionalProfile(profile) {
  const value = profile || {};
  const hasCoreContent = Boolean(
    value.headline ||
    value.summary ||
    (Array.isArray(value.skills) && value.skills.length) ||
    (Array.isArray(value.experiences) && value.experiences.length)
  );
  return hasCoreContent ? [] : ['Il profilo professionale non contiene ancora informazioni sufficienti'];
}

function publicProfessionalProfile(profile) {
  if (!profile || profile.approvalStatus !== 'approved' || profile.visibility !== 'public') return null;
  return {
    headline: profile.headline || '',
    summary: profile.summary || '',
    skills: Array.isArray(profile.skills) ? profile.skills : [],
    experiences: Array.isArray(profile.experiences) ? profile.experiences : [],
    interests: Array.isArray(profile.interests) ? profile.interests : [],
    goals: Array.isArray(profile.goals) ? profile.goals : [],
    collaborationAvailability: profile.collaborationAvailability || '',
    evidence: Array.isArray(profile.evidence) ? profile.evidence : [],
    approvedAt: profile.approvedAt || null,
    updatedAt: profile.updatedAt || null,
    version: Number(profile.version || 1)
  };
}

module.exports = {
  normalizeProfessionalProfile,
  validateProfessionalProfile,
  publicProfessionalProfile
};
