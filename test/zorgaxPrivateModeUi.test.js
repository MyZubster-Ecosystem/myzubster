const fs = require('fs');
const vm = require('vm');
const source = fs.readFileSync(require('path').join(__dirname, '../public/zorgax.html'), 'utf8');

test('main UI script parses', () => {
  for (const match of source.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)) new vm.Script(match[1]);
});

function runModeChange(accept, checked) {
  const context = { externalAi:{checked}, history:[{role:'user',content:'private data'}],
    webSearch:{checked:true,disabled:false}, privacyInfo:{}, token:()=> 'signed-in',
    window:{confirm:()=>accept}, addMessage:()=>{} };
  const handler = source.slice(source.indexOf('externalAi.onchange='), source.indexOf('send.onclick=sendMessage;'));
  vm.runInNewContext(handler, context);
  context.externalAi.onchange();
  return context;
}

test('cancelled consent keeps private mode and disables research', () => {
  const result = runModeChange(false, true);
  expect(result.externalAi.checked).toBe(false);
  expect(result.webSearch).toEqual({checked:false,disabled:true});
  expect(result.history).toEqual([]);
});

test('granting consent clears private history and keeps web opt-in separate', () => {
  const result = runModeChange(true, true);
  expect(result.externalAi.checked).toBe(true);
  expect(result.webSearch).toEqual({checked:false,disabled:false});
  expect(result.history).toEqual([]);
});

test('revoking consent clears transmitted history and disables research', () => {
  const result = runModeChange(true, false);
  expect(result.webSearch).toEqual({checked:false,disabled:true});
  expect(result.history).toEqual([]);
});
