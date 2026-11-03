import React, {act} from 'react';
import {createRoot} from 'react-dom/client';
import {Simulate} from 'react-dom/test-utils';
import MarketplacePage from './MarketplacePage';

jest.mock('../components/WalletHubPanel',()=>()=>null);
jest.mock('../analytics/conversionAnalytics',()=>({trackConversion:jest.fn(),trackConversionOnce:jest.fn()}));

global.IS_REACT_ACT_ENVIRONMENT=true;

const listing=id=>({_id:id,title:`Listing ${id}`,currency:'FREE',category:'services',stock:3});
const response=(data,ok=true,status=200)=>({ok,status,json:async()=>data});
const deferred=()=>{let resolve;const promise=new Promise(r=>{resolve=r});return{promise,resolve}};

describe('Marketplace Preview integration',()=>{
  let container,root,orders,pending,pendingB;
  const button=(text,scope=container)=>Array.from(scope.querySelectorAll('button')).find(b=>b.textContent.trim()===text);
  const click=async element=>{expect(element).toBeTruthy();await act(async()=>{Simulate.click(element)});};
  const submit=async()=>{await act(async()=>{Simulate.submit(container.querySelector('[role="dialog"] form'))});};
  beforeEach(()=>{
    localStorage.clear();localStorage.setItem('myzubster-token','test-token');localStorage.setItem('myzubster-language','it');
    window.history.replaceState({},'', '/marketplace');
    orders=[];pending=deferred();pendingB=deferred();
    global.fetch=jest.fn(async(url,options={})=>{
      if(url==='/api/marketplace/orders'&&options.method==='POST')return JSON.parse(options.body).listingId==='A'?pending.promise:pendingB.promise;
      if(url==='/api/marketplace/orders/mine')return response({orders});
      if(url.endsWith('/messages'))return response({messages:[{_id:'msg1',body:'Hello from seller'}]});
      if(url.startsWith('/api/listings?'))return response({listings:[listing('A'),listing('B')]});
      if(url==='/api/marketplace/seller/me')return response({active:true});
      return response({listings:[],items:[],standard:[],custom:[],proposals:[]});
    });
    container=document.createElement('div');document.body.appendChild(container);root=createRoot(container);
  });
  afterEach(async()=>{await act(async()=>root.unmount());container.remove();localStorage.clear();jest.restoreAllMocks();});
  const render=async()=>{await act(async()=>{root.render(<MarketplacePage/>)});};

  test.each([true,false])('late request response (success=%s) cannot overwrite a reopened dialog',async success=>{
    await render();
    await click(button('Richiedi'));
    await submit();
    // A second submit before rerender must not issue another order.
    await submit();
    expect(global.fetch.mock.calls.filter(([u,o])=>u==='/api/marketplace/orders'&&o?.method==='POST')).toHaveLength(1);
    await click(button('Annulla',container.querySelector('[role="dialog"]')));
    const requestButtons=Array.from(container.querySelectorAll('button')).filter(b=>b.textContent.trim()==='Richiedi');
    await click(requestButtons[1]);
    await submit();
    expect(button('Invio richiesta in corso…')).toBeTruthy();
    await act(async()=>pending.resolve(success?response({order:{_id:'old-order',status:'REQUESTED',snapshot:{title:'Listing A'}}}):response({message:'Old request failed'},false,409)));
    const dialog=container.querySelector('[role="dialog"]');
    expect(dialog.textContent).toContain('Listing B');
    expect(dialog.textContent).not.toContain('old-order');
    expect(dialog.textContent).not.toContain('Old request failed');
    expect(button('Invio richiesta in corso…',dialog).disabled).toBe(true);
    await act(async()=>pendingB.resolve(response({order:{_id:'new-order-B',quantity:1,status:'REQUESTED',snapshot:{title:'Listing B',currency:'FREE'}}})));
    expect(dialog.textContent).toContain('new-order-B');
    expect(dialog.textContent).not.toContain('old-order');
  });

  test.each(['BUYER','SELLER'])('keeps %s order view and chat alongside request flow',async role=>{
    orders=[{_id:'order-1',viewerRole:role,status:'ACCEPTED',quantity:1,snapshot:{title:'Accepted listing',currency:'FREE'}}];
    window.history.replaceState({},'',role==='BUYER'?'/marketplace?view=requests':'/marketplace?view=orders');
    await render();
    expect(container.querySelectorAll('a[href="/"]')).toHaveLength(1);
    expect(container.textContent).toContain('Accepted listing');
    expect(Array.from(container.querySelectorAll('button')).filter(b=>b.textContent.trim()==='💬 Messaggi')).toHaveLength(1);
    await click(button('💬 Messaggi'));
    expect(container.textContent).toContain('Hello from seller');
    const input=container.querySelector('#marketplace-chat-text');
    await act(async()=>Simulate.change(input,{target:{value:'Buyer reply'}}));
    await act(async()=>Simulate.submit(input.closest('form')));
    expect(global.fetch).toHaveBeenCalledWith('/api/marketplace/orders/order-1/messages',expect.objectContaining({method:'POST',body:JSON.stringify({body:'Buyer reply'})}));
  });
});
