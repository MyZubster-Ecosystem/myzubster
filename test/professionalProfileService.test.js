'use strict';

const {
  normalizeProfessionalProfile,
  validateProfessionalProfile,
  publicProfessionalProfile
} = require('../src/services/professionalProfileService');

describe('professionalProfileService', () => {
  test('keeps only approved structured profile fields and drops unknown data', () => {
    const profile = normalizeProfessionalProfile({
      headline: '  Gestione MyZubster  ',
      summary: 'Profilo costruito su esperienze dichiarate.',
      skills: [
        {
          name: 'Kali Linux',
          category: 'informatica',
          experience: 'almeno 10 anni di studio autodidatta',
          level: 'autodidatta pratico',
          evidence: ['esperienza personale'],
          notes: 'solo attività lecite e autorizzate',
          illegalHistory: 'non deve essere persistito'
        }
      ],
      experiences: [
        {
          title: 'Organizzazione eventi',
          duration: 'più di 10 eventi organizzati',
          description: 'Gestione operativa completa.',
          evidence: ['foto e video']
        }
      ],
      interests: ['AI', 'AI', 'permacultura'],
      goals: ['Fare di MyZubster il lavoro principale'],
      collaborationAvailability: 'Aperto a chi vuole contribuire concretamente.',
      evidence: [{ source: 'GitHub', description: 'Repository MyZubster' }],
      illegalHistory: 'non deve essere persistito',
      medicalHistory: 'non deve essere persistito'
    });

    expect(profile.headline).toBe('Gestione MyZubster');
    expect(profile.skills).toHaveLength(1);
    expect(profile.skills[0]).not.toHaveProperty('illegalHistory');
    expect(profile).not.toHaveProperty('illegalHistory');
    expect(profile).not.toHaveProperty('medicalHistory');
    expect(profile.interests).toEqual(['AI', 'permacultura']);
  });

  test('requires meaningful profile content', () => {
    expect(validateProfessionalProfile(normalizeProfessionalProfile({}))).toHaveLength(1);
    expect(validateProfessionalProfile(normalizeProfessionalProfile({
      skills: [{ name: 'Calisthenics', experience: 'circa 4 anni' }]
    }))).toEqual([]);
  });

  test('returns public data only after approval and public visibility', () => {
    const base = {
      headline: 'Profilo',
      summary: '',
      skills: [],
      experiences: [],
      interests: [],
      goals: [],
      collaborationAvailability: '',
      evidence: [],
      version: 2,
      approvedAt: new Date('2026-09-23T00:00:00.000Z'),
      updatedAt: new Date('2026-09-23T00:00:00.000Z')
    };

    expect(publicProfessionalProfile({ ...base, approvalStatus: 'approved', visibility: 'private' })).toBeNull();
    expect(publicProfessionalProfile({ ...base, approvalStatus: 'approved', visibility: 'public' })).toMatchObject({
      headline: 'Profilo',
      version: 2
    });
    expect(publicProfessionalProfile({ ...base, visibility: 'public' })).toBeNull();
  });
});
