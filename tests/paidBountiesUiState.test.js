const PB = require('../public/paid-bounties-state');

const proposed={id:'p',title:'Proposed',rewards:[{amount:15,unit:'USD',funding_state:'PROPOSED'}]};
const reserved={id:'r',title:'Reserved',rewards:[{amount:15,unit:'USD',funding_state:'RESERVED'}]};
const paid={id:'x',title:'Paid',settlement_state:'PAID',rewards:[{amount:15,unit:'USD',funding_state:'FUNDED'}]};

describe('Paid Bounties UI state',()=>{
  test('distinguishes an empty registry from a filter with zero matches',()=>{
    expect(PB.statusText(PB.ready([]),'all')).toBe('Nessuna bounty disponibile nel registro.');
    expect(PB.statusText(PB.ready([proposed]),'paid')).toBe('Nessuna bounty corrisponde al filtro PAID.');
  });

  test.each([
    ['network failure',()=>Promise.reject(new Error('network down'))],
    ['HTTP failure',()=>Promise.resolve({ok:false,status:503,json:async()=>({})})],
    ['JSON failure',()=>Promise.resolve({ok:true,json:async()=>{throw new Error('invalid json')}})],
    ['shape failure',()=>Promise.resolve({ok:true,json:async()=>({entries:null})})]
  ])('keeps an explicit unavailable state after %s',async(_label,fetchFn)=>{
    const model=await PB.loadRegistry(fetchFn);
    expect(model.phase).toBe('error');
    expect(PB.statusText(model,'all')).not.toMatch(/0 bounty/);
    expect(PB.statusText(model,'paid')).not.toMatch(/0 bounty|Nessuna bounty corrisponde/);
  });

  test('keeps populated bounty classification and reward text unchanged',async()=>{
    const model=await PB.loadRegistry(async()=>({ok:true,json:async()=>({entries:[proposed,reserved,paid]})}));
    expect(model.phase).toBe('ready');
    expect(PB.filtered(model.entries,'open')).toEqual([proposed]);
    expect(PB.filtered(model.entries,'reserved')).toEqual([reserved]);
    expect(PB.filtered(model.entries,'paid')).toEqual([paid]);
    expect(PB.rewardText(proposed)).toBe('15 USD · PROPOSED');
    expect(PB.statusText(model,'all')).toBe('3 bounty mostrate su 3.');
  });
});