'use strict';

const rankingService = require('../src/services/zorgaxDigitalPilotIdeaRankingService');
const onboardingService = require('../src/services/zorgaxDigitalPilotOnboardingService');

function enrollment(data) { return { ...data, toObject(){ return { ...this, toObject: undefined }; } }; }

describe('Zorgax LIFE pilot idea ranking', () => {
  test('ranks supplied candidates without predicting commercial success', () => {
    const result = rankingService.rankIdeas({ ideas: [
      { candidateId:'a', title:'Template kit', targetCustomer:'Freelancers', customerProblem:'Slow proposals', valueProposition:'Reusable proposal system', evidence:['3 interviews'], participantInterest:80, buildEase:85 },
      { candidateId:'b', title:'Generic guide', participantInterest:70, buildEase:90 }
    ], objective:'Publish one real product', weeklyCommitment:'3 hours' });
    expect(result.candidates[0].candidateId).toBe('a');
    expect(result.selectionRequired).toBe(true);
    expect(result.predictsSales).toBe(false);
    expect(result.predictsProfit).toBe(false);
  });

  test('requires between two and five candidates', () => {
    expect(() => rankingService.rankIdeas({ ideas:[{title:'Only one'}] })).toThrow('between 2 and 5');
  });

  test('onboarding ranking requires consent and completed onboarding', async () => {
    const EnrollmentModel = { findOne: jest.fn().mockResolvedValue(enrollment({ ownerId:'owner-1', consent:{accepted:true}, objective:'First product', weeklyCommitment:'2 hours' })) };
    const ranking = await onboardingService.rankCandidateIdeas({ EnrollmentModel, ownerId:'owner-1', ideas:[{title:'A'},{title:'B'}] });
    expect(ranking.candidates).toHaveLength(2);
    expect(ranking.requiresHumanApproval).toBe(true);
  });
});
