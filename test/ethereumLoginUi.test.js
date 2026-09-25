'use strict';

const fs = require('fs');
const path = require('path');

describe('Sign-In with Ethereum UI wiring', () => {
  const page = fs.readFileSync(path.join(__dirname, '../frontend/src/pages/SocialLoginPage.js'), 'utf8');
  const routes = fs.readFileSync(path.join(__dirname, '../src/routes/authRoutes.js'), 'utf8');

  test('keeps MetaMask as an additional sign-in option', () => {
    expect(page).toContain("ethereum:'Continua con MetaMask'");
    expect(page).toContain("'eth_requestAccounts'");
    expect(page).toContain("'eth_chainId'");
    expect(page).toContain("'personal_sign'");
    expect(page).toContain("fetch('/api/auth/ethereum/challenge'");
    expect(page).toContain("fetch('/api/auth/ethereum/verify'");
    expect(page).toContain("localStorage.setItem('myzubster-identity-provider','ethereum')");
  });

  test('does not replace password or social login', () => {
    expect(page).toContain("fetch('/api/auth/login'");
    expect(page).toContain("oauthHref('google')");
    expect(page).toContain("oauthHref('github')");
    expect(page).toContain("oauthHref('facebook')");
  });

  test('exposes rate-limited Ethereum auth endpoints', () => {
    expect(routes).toContain("router.post('/ethereum/challenge', ethereumLoginLimiter, ethereumAuthController.challenge)");
    expect(routes).toContain("router.post('/ethereum/verify', ethereumLoginLimiter, ethereumAuthController.verify)");
    expect(routes).toContain("ETHEREUM_LOGIN_RATE_LIMIT");
  });
});
