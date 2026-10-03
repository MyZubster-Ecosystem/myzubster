(function(root,factory){
  var api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.PaidBountiesState=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  function state(entry){
    var states=(entry.rewards||[]).map(function(r){return String(r.funding_state||'').toUpperCase()});
    if(String(entry.settlement_state||'').toUpperCase()==='PAID')return'paid';
    if(states.indexOf('RESERVED')>=0||states.indexOf('FUNDED')>=0)return'reserved';
    if(states.indexOf('PROPOSED')>=0||states.indexOf('UNFUNDED')>=0)return'open';
    return'other';
  }
  function rewardText(entry){
    return (entry.rewards||[]).map(function(r){
      return String(r.amount)+' '+String(r.unit||r.asset||'')+(r.funding_state?' · '+r.funding_state:'');
    }).join(' + ')||'Reward non specificato';
  }
  function loading(){return{phase:'loading',entries:[],error:''}}
  function ready(entries){return{phase:'ready',entries:entries,error:''}}
  function failed(message){return{phase:'error',entries:[],error:message||'Registro bounty non disponibile'}}
  function filtered(entries,active){
    return (entries||[]).filter(function(e){return active==='all'||state(e)===active});
  }
  function statusText(model,active){
    if(model.phase==='loading')return'Caricamento registro…';
    if(model.phase==='error')return model.error||'Registro bounty non disponibile';
    if(!model.entries.length)return'Nessuna bounty disponibile nel registro.';
    var view=filtered(model.entries,active);
    if(!view.length)return'Nessuna bounty corrisponde al filtro '+String(active||'all').toUpperCase()+'.';
    return view.length+' bounty mostrate su '+model.entries.length+'.';
  }
  async function loadRegistry(fetchFn){
    try{
      var response=await fetchFn('/api/bounties?limit=200',{cache:'no-store'});
      if(!response||!response.ok)throw new Error('Registro bounty non disponibile');
      var data=await response.json();
      if(!data||!Array.isArray(data.entries))throw new Error('Formato del registro bounty non valido');
      return ready(data.entries);
    }catch(error){
      return failed(error&&error.message?error.message:'Registro bounty non disponibile');
    }
  }
  return{state:state,rewardText:rewardText,loading:loading,ready:ready,failed:failed,filtered:filtered,statusText:statusText,loadRegistry:loadRegistry};
});