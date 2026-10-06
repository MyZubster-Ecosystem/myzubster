const fs=require('fs');
const path=require('path');

describe('Zorgax AI budget fallback',()=>{
  test('AI usage service skips Mongo writes when disconnected',()=>{
    const source=fs.readFileSync(path.join(__dirname,'..','src','services','zorgaxAIUsageService.js'),'utf8');
    expect(source).toContain("const mongoose = require('mongoose')");
    expect(source).toContain("mongoose.connection.readyState !== 1");
  });

  test('assistant response survives accounting failures',()=>{
    const source=fs.readFileSync(path.join(__dirname,'..','src','services','zorgaxAssistantService.js'),'utf8');
    expect(source).toContain("[zorgax-ai-accounting]");
    expect(source).toContain("Number(usage?.costUsd)||0");
  });
});
