'use strict';

const fs = require('fs');
const path = require('path');

describe('PostHog funnel integration', () => {
  const route = fs.readFileSync(path.join(__dirname, '..', 'src', 'routes', 'zorgaxAssistantRoutes.js'), 'utf8');
  const onboarding = fs.readFileSync(path.join(__dirname, '..', 'public', 'zorgax-profile-onboarding.html'), 'utf8');
  const service = fs.readFileSync(path.join(__dirname, '..', 'src', 'services', 'posthogAnalyticsService.js'), 'utf8');

  test('forwards accepted funnel events to PostHog without person profiles', () => {
    expect(route).toContain("captureFunnelEvent");
    expect(service).toContain("POSTHOG_PROJECT_TOKEN");
    expect(service).toContain("https://eu.i.posthog.com");
    expect(service).toContain("$process_person_profile: false");
    expect(service).toContain("/i/v0/e/");
  });

  test('accepts onboarding to Metaverse funnel events', () => {
    for (const event of [
      'profile_onboarding_open',
      'profile_onboarding_profile_loaded',
      'profile_onboarding_completed',
      'profile_onboarding_enter_metaverse_click'
    ]) {
      expect(route).toContain("'" + event + "'");
      expect(onboarding).toContain("'" + event + "'");
    }
  });

  test('keeps GitHub publishing and MyZubster save as explicit completion points', () => {
    expect(onboarding).toContain("markCompleted('myzubster_bio')");
    expect(onboarding).toContain("markCompleted('github_bio')");
  });
});
