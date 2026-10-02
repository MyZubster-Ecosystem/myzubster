const fs=require('fs');
const path=require('path');

describe('Zorgax fast database fallback',()=>{
  test('access middleware avoids buffered Mongo waits when disconnected',()=>{
    const source=fs.readFileSync(path.join(__dirname,'..','src','middleware','zorgaxAccess.js'),'utf8');
    expect(source).toContain("const mongoose = require('mongoose')");
    expect(source).toContain("mongoose.connection.readyState !== 1");
    expect(source).toContain("AUTHENTICATED_FREE_FALLBACK");
  });

  test('assistant identity context skips database enrichment when disconnected',()=>{
    const source=fs.readFileSync(path.join(__dirname,'..','src','routes','zorgaxAssistantRoutes.js'),'utf8');
    expect(source).toContain("const mongoose = require('mongoose')");
    expect(source).toContain("database unavailable, skipping identity enrichment");
    expect(source).toContain("mongoose.connection.readyState !== 1");
  });
});
