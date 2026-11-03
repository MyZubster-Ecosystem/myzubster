import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import {Simulate} from 'react-dom/test-utils';
import MarketplacePage from '../pages/MarketplacePage';

jest.mock('./WalletHubPanel',()=>()=>null);
jest.mock('../analytics/conversionAnalytics',()=>({trackConversion:jest.fn(),trackConversionOnce:jest.fn()}));
global.IS_REACT_ACT_ENVIRONMENT=true;
const response=(data,status=200)=>({ok:status<400,status,json:async()=>data});
const order=(id,role='BUYER')=>({_id:id,viewerRole:role,listingId:{_id:`listing-${id}`,title:`Service ${id}`},snapshot:{title:`Service ${id}`},status:'REQUESTED'});
const deferred=()=>{let resolve;const promise=new Promise(r=>{resolve=r});return{resolve,promise}};

describe('Public Marketplace request, inbox and chat',()=>{
  let root,container,orders,unread,requestStatus,readOverride,postOverride,originalFetch;
  const findButton=(text,scope=container)=>Array.from(scope.querySelectorAll('button')).find(b=>b.textContent.trim()===text);
  const click=async button=>{expect(button).toBeTruthy();await act(async()=>Simulate.click(button));};
  const render=async()=>{await act(async()=>root.render(<MarketplacePage/>));};
  const chatRequests=()=>global.fetch.mock.calls.filter(([url])=>/\/orders\/[^/]+\/messages$/.test(url));
  beforeEach(()=>{
    jest.useFakeTimers();
    originalFetch=global.fetch;localStorage.clear();localStorage.setItem('myzubster-token','test-only-token');localStorage.setItem('myzubster-language','it');
    window.history.replaceState({},'','/marketplace');
    orders=[order('1')];unread={totalUnread:2,byOrder:{'1':2}};requestStatus=409;readOverride=null;postOverride=null;
    global.fetch=jest.fn(async(url,options={})=>{
      if(url==='/api/marketplace/orders'&&options.method==='POST'){
        if(postOverride)return postOverride.promise;
        return requestStatus===409?response({message:'Hai già una richiesta aperta per questo annuncio'},409):response({order:orders[0]},201);
      }
      if(url==='/api/marketplace/orders/mine')return response({orders});
      if(url==='/api/marketplace/orders/messages/unread')return response(unread);
      if(/\/orders\/[^/]+\/messages$/.test(url)){
        if(options.method==='POST')return response({message:{_id:'new-message'}} ,201);
        if(readOverride)return readOverride.promise;
        unread={totalUnread:0,byOrder:{}};
        return response({messages:[{_id:'msg',body:`Conversation ${url.includes('/1/')?'one':'two'}`} ]});
      }
      if(url.startsWith('/api/listings?'))return response({listings:[{_id:'listing-1',title:'Public service',category:'services',currency:'FREE'}]});
      if(url==='/api/marketplace/seller/me')return response({active:true});
      return response({standard:[],custom:[],proposals:[],items:[]});
    });
    container=document.createElement('div');document.body.appendChild(container);root=createRoot(container);
  });
  afterEach(async()=>{await act(async()=>root.unmount());container.remove();localStorage.clear();global.fetch=originalFetch;jest.useRealTimers();jest.restoreAllMocks();});

  test('duplicate request opens the existing conversation without creating another order',async()=>{
    await render();
    expect(chatRequests()).toHaveLength(0);
    expect(container.textContent).toContain('2 messaggi non letti');
    await click(findButton('Richiedi'));
    expect(container.querySelector('[aria-label="Conversazione"]').textContent).toContain('Conversation one');
    expect(global.fetch.mock.calls.filter(([u,o])=>u==='/api/marketplace/orders'&&o?.method==='POST')).toHaveLength(1);
    expect(container.textContent).not.toContain('2 messaggi non letti');
  });
  test('successful new request opens its persisted order chat',async()=>{
    requestStatus=201;await render();await click(findButton('Richiedi'));
    expect(container.querySelector('[aria-label="Conversazione"]').textContent).toContain('Service 1');
    expect(container.textContent).toContain('Conversation one');
  });
  test('double click during pending request sends only one POST',async()=>{
    postOverride=deferred();await render();
    const button=findButton('Richiedi');
    await act(async()=>{Simulate.click(button);Simulate.click(button);});
    expect(global.fetch.mock.calls.filter(([u,o])=>u==='/api/marketplace/orders'&&o?.method==='POST')).toHaveLength(1);
    await act(async()=>postOverride.resolve(response({order:orders[0]},201)));
    expect(container.textContent).toContain('Conversation one');
  });
  test('missing duplicate order displays an error without inventing a conversation',async()=>{
    orders=[];await render();await click(findButton('Richiedi'));
    expect(container.textContent).toContain('La richiesta non è stata trovata');
    expect(chatRequests()).toHaveLength(0);
    expect(container.querySelector('[aria-label="Conversazione"]')).toBeNull();
  });
  test('seller sees pending requests and periodic notifications without marking messages read',async()=>{
    orders=[order('1','SELLER')];await render();
    expect(container.textContent).toContain('1 richieste da valutare');
    expect(container.textContent).toContain('Richieste ricevute (1)');
    await act(async()=>jest.advanceTimersByTime(45000));
    await act(async()=>window.dispatchEvent(new Event('focus')));
    expect(global.fetch.mock.calls.filter(([u])=>u==='/api/marketplace/orders/messages/unread').length).toBeGreaterThanOrEqual(3);
    expect(chatRequests()).toHaveLength(0);
    expect(container.textContent).toContain('2 messaggi non letti');
  });
  test('buyer can send a message in the selected conversation',async()=>{
    await render();await click(findButton('Messaggi (2 messaggi non letti)'));
    const input=container.querySelector('#marketplace-chat-text');
    await act(async()=>Simulate.change(input,{target:{value:'Hello seller'}}));
    await act(async()=>{Simulate.submit(input.closest('form'));Simulate.submit(input.closest('form'));});
    const posts=chatRequests().filter(([,o])=>o?.method==='POST');
    expect(posts).toHaveLength(1);
    expect(posts[0][1].body).toBe(JSON.stringify({body:'Hello seller'}));
    expect(input.value).toBe('');
  });
  test('switching chats ignores a late response from the previous conversation',async()=>{
    orders=[order('1'),order('2')];await render();
    readOverride=deferred();const old=readOverride;
    await click(findButton('Messaggi (2 messaggi non letti)'));
    readOverride=null;await click(findButton('Messaggi'));
    await act(async()=>old.resolve(response({messages:[{_id:'old',body:'Wrong conversation'}]})));
    const chat=container.querySelector('[aria-label="Conversazione"]');
    expect(chat.textContent).toContain('Service 2');
    expect(chat.textContent).toContain('Conversation two');
    expect(chat.textContent).not.toContain('Wrong conversation');
  });
  test('an older read cannot overwrite messages reloaded after sending',async()=>{
    await render();readOverride=deferred();const old=readOverride;
    await click(findButton('Messaggi (2 messaggi non letti)'));
    readOverride=null;
    const input=container.querySelector('#marketplace-chat-text');
    await act(async()=>Simulate.change(input,{target:{value:'New reply'}}));
    await act(async()=>Simulate.submit(input.closest('form')));
    await act(async()=>old.resolve(response({messages:[{_id:'stale',body:'Stale history'}]})));
    const chat=container.querySelector('[aria-label="Conversazione"]');
    expect(chat.textContent).toContain('Conversation one');
    expect(chat.textContent).not.toContain('Stale history');
  });
  test('unread endpoint failure remains visible instead of claiming zero notifications',async()=>{
    const fetch=global.fetch;
    global.fetch=jest.fn((url,options)=>url==='/api/marketplace/orders/messages/unread'?Promise.resolve(response({message:'unavailable'},503)):fetch(url,options));
    await render();
    expect(container.textContent).toContain('Notifiche non disponibili');
    expect(container.textContent).toContain('Service 1');
  });
  test('anonymous visitors do not load private requests, unread counts or messages',async()=>{
    localStorage.removeItem('myzubster-token');await render();
    expect(global.fetch.mock.calls.some(([u])=>u.startsWith('/api/marketplace/orders'))).toBe(false);
    expect(container.querySelector('#marketplace-orders')).toBeNull();
  });
});
