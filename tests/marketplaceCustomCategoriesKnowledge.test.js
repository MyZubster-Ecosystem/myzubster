'use strict';

const fs = require('fs');
const path = require('path');

describe('Marketplace custom categories and knowledge creation', () => {
  const page = fs.readFileSync(path.join(__dirname, '../frontend/src/pages/MarketplacePage.js'), 'utf8');
  const listingRoutes = fs.readFileSync(path.join(__dirname, '../src/routes/listingRoutes.js'), 'utf8');
  const knowledgeRoutes = fs.readFileSync(path.join(__dirname, '../src/routes/knowledgeRewardRoutes.js'), 'utf8');
  const communityPage = fs.readFileSync(path.join(__dirname, '../public/community-marketplace.html'), 'utf8');
  const assistant = fs.readFileSync(path.join(__dirname, '../public/zorgax-listing-assistant.js'), 'utf8');

  test('React Marketplace loads the live category catalog and exposes category creation', () => {
    expect(page).toContain("fetch('/api/listings/categories')");
    expect(page).toContain("fetch('/api/listings/categories/mine'");
    expect(page).toContain("apiAction('/api/listings/categories/propose'");
    expect(page).toContain("setForm(current=>({...current,category:slug}))");
    expect(page).toContain("categoryCatalog.map");
    expect(page).toContain("filterCategories.map");
  });

  test('a proposer may use their own pending category while global catalog stays approved-only', () => {
    expect(listingRoutes).toContain("MarketplaceCategoryProposal.find({status:'approved'})");
    expect(listingRoutes).toContain("{status:'pending',proposerId:req.userId}");
    expect(listingRoutes).toContain("router.patch('/categories/proposals/:id'");
    expect(listingRoutes).toContain("['approved','rejected'].includes(status)");
  });

  test('knowledge is a first-class Marketplace category across UIs and backend', () => {
    expect(listingRoutes).toContain("'knowledge'");
    expect(page).toContain("'knowledge'");
    expect(communityPage).toContain('value="knowledge"');
    expect(assistant).toContain("knowledge: ['Che conoscenza, guida o metodo vuoi condividere?'");
  });

  test('authenticated users can create persistent knowledge pending review without automatic MYZ', () => {
    expect(knowledgeRoutes).toContain("router.post('/submissions', authenticate");
    expect(knowledgeRoutes).toContain("status:'PENDING_REVIEW'");
    expect(knowledgeRoutes).toContain("rewardCreated:false");
    expect(knowledgeRoutes).toContain("ledgerWritten:false");
    expect(knowledgeRoutes).toContain("myzTransferred:false");
    expect(page).toContain("apiAction('/api/knowledge-rewards/submissions'");
    expect(page).toContain("t.knowledgeNotice");
  });

  test('users can review their own knowledge list and admins can approve or reject it', () => {
    expect(knowledgeRoutes).toContain("router.get('/mine', authenticate");
    expect(knowledgeRoutes).toContain("router.patch('/submissions/:id/review', authenticate, isAdmin");
    expect(knowledgeRoutes).toContain("contribution.status = decision === 'APPROVE' ? 'APPROVED' : 'REJECTED'");
    expect(page).toContain("knowledgeItems.slice(0,10)");
  });
});
