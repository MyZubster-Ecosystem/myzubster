'use strict';

const { _test } = require('../src/routes/metaMessengerRoutes');

describe('Meta Messenger conversation quality', () => {
  test('removes common Markdown while preserving useful URLs', () => {
    const input = '**Marketplace**\n- [Apri](https://www.myzubster.com/marketplace)\n`Seller`';
    expect(_test.cleanMessengerText(input)).toBe('Marketplace\n• Apri: https://www.myzubster.com/marketplace\nSeller');
  });

  test('adds Messenger-specific language, brevity and routing instructions', () => {
    const prompt = _test.messengerPrompt('Voglio vendere');
    expect(prompt).toContain('same language');
    expect(prompt).toContain('https://www.myzubster.com/marketplace');
    expect(prompt).toContain('USER MESSAGE:\nVoglio vendere');
  });

  test('keeps a bounded per-sender conversation history', () => {
    const sender = `test-${Date.now()}-${Math.random()}`;
    _test.rememberTurn(sender, 'Ciao', 'Ciao!');
    _test.rememberTurn(sender, 'Voglio vendere', 'Apri il Marketplace.');
    expect(_test.getHistory(sender)).toEqual([
      { role: 'user', content: 'Ciao' },
      { role: 'assistant', content: 'Ciao!' },
      { role: 'user', content: 'Voglio vendere' },
      { role: 'assistant', content: 'Apri il Marketplace.' }
    ]);
  });

  test('normalizes attachment-only messages instead of dropping them', () => {
    const event = {
      sender: { id: 'attachment-user' },
      timestamp: 1,
      message: { mid: 'm-attachment-1', attachments: [{ type: 'image', payload: { url: 'https://example.invalid/private.jpg' } }] }
    };
    const normalized = _test.normalizeInboundEvent(event);
    expect(normalized.source).toBe('attachment');
    expect(normalized.text).toContain('image');
    expect(normalized.text).not.toContain('example.invalid');
  });

  test('normalizes quick replies and postbacks', () => {
    const quick = _test.normalizeInboundEvent({
      sender: { id: 'quick-user' }, timestamp: 2,
      message: { mid: 'm-quick-1', quick_reply: { payload: 'START_SELLER' } }
    });
    const postback = _test.normalizeInboundEvent({
      sender: { id: 'postback-user' }, timestamp: 3,
      postback: { mid: 'p-1', title: 'Marketplace', payload: 'OPEN_MARKETPLACE' }
    });
    expect(quick).toMatchObject({ source: 'quick_reply', text: 'START_SELLER' });
    expect(postback).toMatchObject({ source: 'postback', text: 'Marketplace' });
  });

  test('ignores page echoes and duplicate delivery retries', () => {
    expect(_test.normalizeInboundEvent({sender:{id:'page'},message:{is_echo:true,text:'echo'}})).toBeNull();
    const event={sender:{id:'dedup-user'},timestamp:4,message:{mid:'same-mid',text:'Ciao'}};
    const first=_test.normalizeInboundEvent(event);
    const second=_test.normalizeInboundEvent(event);
    expect(first).not.toBeNull();
    expect(second).toBeNull();
  });

  test('extracts supported inbound events from a webhook payload', () => {
    const body={entry:[{messaging:[
      {sender:{id:'a'},timestamp:10,message:{mid:'m-a',text:'Ciao'}},
      {sender:{id:'b'},timestamp:11,message:{mid:'m-b',attachments:[{type:'file'}]}},
      {sender:{id:'c'},timestamp:12,postback:{mid:'p-c',payload:'GET_STARTED'}}
    ]}]};
    const events=_test.extractInboundEvents(body);
    expect(events).toHaveLength(3);
    expect(events.map(e=>e.source)).toEqual(['message','attachment','postback']);
  });
});
