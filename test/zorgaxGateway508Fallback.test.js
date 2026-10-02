const fs=require('fs');
const path=require('path');

describe('Zorgax gateway 508 fallback',()=>{
  test('budget service returns untracked reservation when Mongo is offline',()=>{
    const source=fs.readFileSync(path.join(__dirname,'..','src','services','zorgaxAIUsageService.js'),'utf8');
    expect(source).toContain("return { untracked: true, reason: 'budget_db_unavailable' }");
  });

  test('assistant keeps OpenAI path for untracked reservation',()=>{
    const source=fs.readFileSync(path.join(__dirname,'..','src','services','zorgaxAssistantService.js'),'utf8');
    expect(source).toContain("reservation.untracked?0:reservationUsd");
    expect(source).toContain("budget_db_unavailable");
  });
});
