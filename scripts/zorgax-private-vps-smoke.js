'use strict';

// Synthetic messages only. Never prints prompts, answers, identities or secrets.
async function runSmoke({baseUrl=process.env.MYZUBSTER_BASE_URL || 'http://127.0.0.1:5014',fetchImpl=global.fetch}={}) {
  const base = new URL(baseUrl);
  if (!['http:','https:'].includes(base.protocol) || !['127.0.0.1','[::1]'].includes(base.hostname) ||
      base.username || base.password || base.pathname !== '/' || base.search || base.hash) {
    throw new Error('Use a literal loopback MyZubster URL');
  }
  const url = new URL('/api/zorgax/assistant/chat', base);
  const call = async body => {
    const response = await fetchImpl(url.href, {method:'POST',redirect:'error',signal:AbortSignal.timeout(45000),
      headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    return {status:response.status,body:await response.json()};
  };
  const refused = await call({message:'Synthetic consent check',privacyMode:'external'});
  if (refused.status !== 400 || refused.body.ok !== false) throw new Error('External consent gate failed');
  const privateResult = await call({message:'Rispondi soltanto OK a questo test sintetico: analizza codice GitHub.',useWeb:true});
  const data = privateResult.body;
  if (privateResult.status !== 200 || data.ok !== true || data.privacy_mode !== 'private' ||
      data.ai_provider !== 'ollama' || data.external_processing_authorized !== false ||
      data.web_research_requested !== false || !Array.isArray(data.sources) || data.sources.length ||
      typeof data.response !== 'string' || !data.response.trim()) {
    throw new Error('Private inference check failed; keep production unchanged');
  }
  return {ok:true,externalConsentGate:true,privateInference:true,webResearch:false,
    productionDeployed:false,egressIndependentlyVerified:false};
}
if (require.main === module) runSmoke().then(result=>console.log(JSON.stringify(result)))
  .catch(()=>{console.error('Zorgax private smoke FAILED. Verify the local backend and Ollama; no production change was made.');process.exitCode=1;});
module.exports = {runSmoke};
