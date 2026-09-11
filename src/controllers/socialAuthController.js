const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { upsertVerifiedAccount } = require('../services/socialIdentityService');

const OAUTH_ENV_KEYS = [
  'GOOGLE_LOGIN_CLIENT_ID','GOOGLE_LOGIN_CLIENT_SECRET','GOOGLE_LOGIN_CALLBACK_URL','GOOGLE_OAUTH_CLIENT_ID','GOOGLE_OAUTH_CLIENT_SECRET','GOOGLE_OAUTH_CALLBACK_URL','GITHUB_OAUTH_CLIENT_ID','GITHUB_OAUTH_CLIENT_SECRET','GITHUB_LOGIN_CALLBACK_URL','GITHUB_OAUTH_CALLBACK_URL','FACEBOOK_LOGIN_APP_ID','FACEBOOK_LOGIN_APP_SECRET','FACEBOOK_LOGIN_CALLBACK_URL'
];
for (const key of OAUTH_ENV_KEYS) if (typeof process.env[key] === 'string') process.env[key] = process.env[key].trim();

function secret(){if(!process.env.JWT_SECRET)throw new Error('JWT_SECRET non configurato');return process.env.JWT_SECRET;}
function frontend(){return(process.env.FRONTEND_URL||process.env.PUBLIC_APP_URL||'https://myzubster.com').replace(/\/$/,'');}
function callback(provider){
  if(provider==='google')return process.env.GOOGLE_LOGIN_CALLBACK_URL||process.env.GOOGLE_OAUTH_CALLBACK_URL||`${process.env.GATEWAY_PUBLIC_URL||'https://myzubster.com'}/api/auth/social/google/callback`;
  if(provider==='github')return process.env.GITHUB_LOGIN_CALLBACK_URL||process.env.GITHUB_OAUTH_CALLBACK_URL||`${process.env.GATEWAY_PUBLIC_URL||'https://myzubster.com'}/api/auth/social/github/callback`;
  return process.env[`${provider.toUpperCase()}_LOGIN_CALLBACK_URL`]||`${process.env.GATEWAY_PUBLIC_URL||'https://myzubster.com'}/api/auth/social/${provider}/callback`;
}
function state(provider){return jwt.sign({purpose:'social-login',provider,nonce:crypto.randomBytes(16).toString('hex')},process.env.OAUTH_STATE_SECRET||secret(),{expiresIn:'10m'});}
function verifyState(value,provider){
  if(!value||typeof value!=='string')throw new Error('Sessione OAuth mancante. Riavvia il login dal pulsante MyZubster.');
  try{const data=jwt.verify(value,process.env.OAUTH_STATE_SECRET||secret());if(data.purpose!=='social-login'||data.provider!==provider)throw new Error('OAuth state non valido');return data;}
  catch(error){if(error?.message==='OAuth state non valido')throw error;if(error?.name==='TokenExpiredError')throw new Error('Sessione OAuth scaduta. Riavvia il login dal pulsante MyZubster.');throw new Error('Sessione OAuth non valida. Riavvia il login dal pulsante MyZubster.');}
}
function redirectSuccess(res,result,provider){const ticket=jwt.sign({purpose:'social-login-result',token:result.token,userId:String(result.user._id),characterId:result.character.characterId,provider},secret(),{expiresIn:'2m'});const url=new URL('/social-login',`${frontend()}/`);url.searchParams.set('social_login','verified');url.searchParams.set('provider',provider);url.searchParams.set('social_login_ticket',ticket);res.redirect(url.toString());}
function redirectError(res,message,provider=''){const url=new URL('/social-login',`${frontend()}/`);url.searchParams.set('social_login','error');if(provider)url.searchParams.set('provider',provider);url.searchParams.set('social_login_message',String(message).slice(0,180));res.redirect(url.toString());}
function providerCallbackError(query={}){if(!query.error)return null;if(query.error==='access_denied')return 'Accesso annullato o non autorizzato dal provider.';return 'Il provider OAuth non ha autorizzato il login. Riprova dal pulsante MyZubster.';}
function safeMetaText(value){return String(value||'').replace(/[\r\n\t]+/g,' ').slice(0,240);}
function logFacebookOAuthError(stage,response,payload){const meta=payload?.error&&typeof payload.error==='object'?payload.error:{};console.error('[facebook-oauth]',JSON.stringify({stage,httpStatus:Number(response?.status)||null,type:safeMetaText(meta.type),code:Number.isFinite(Number(meta.code))?Number(meta.code):null,errorSubcode:Number.isFinite(Number(meta.error_subcode))?Number(meta.error_subcode):null,message:safeMetaText(meta.message),fbtraceId:safeMetaText(meta.fbtrace_id)}));}

function providerAvailability(){return{google:Boolean((process.env.GOOGLE_LOGIN_CLIENT_ID||process.env.GOOGLE_OAUTH_CLIENT_ID)&&(process.env.GOOGLE_LOGIN_CLIENT_SECRET||process.env.GOOGLE_OAUTH_CLIENT_SECRET)&&callback('google').startsWith('http')),github:Boolean(process.env.GITHUB_OAUTH_CLIENT_ID&&process.env.GITHUB_OAUTH_CLIENT_SECRET&&callback('github').startsWith('http')),facebook:Boolean(process.env.FACEBOOK_LOGIN_APP_ID&&process.env.FACEBOOK_LOGIN_APP_SECRET&&callback('facebook').startsWith('http'))};}
exports.providers=(_req,res)=>res.json({success:true,data:{providers:providerAvailability()}});

exports.start=(req,res)=>{
  try{
    const provider=String(req.params.provider||'').toLowerCase();
    if(provider==='google'){
      const clientId=process.env.GOOGLE_LOGIN_CLIENT_ID||process.env.GOOGLE_OAUTH_CLIENT_ID;const clientSecret=process.env.GOOGLE_LOGIN_CLIENT_SECRET||process.env.GOOGLE_OAUTH_CLIENT_SECRET;
      if(!clientId||!clientSecret||!callback('google').startsWith('http'))throw new Error('Google Login non configurato');
      const params=new URLSearchParams({client_id:clientId,redirect_uri:callback('google'),response_type:'code',scope:'openid email profile',state:state('google'),prompt:'select_account'});return res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
    }
    if(provider==='github'){
      if(!process.env.GITHUB_OAUTH_CLIENT_ID||!process.env.GITHUB_OAUTH_CLIENT_SECRET||!callback('github').startsWith('http'))throw new Error('GitHub Login non configurato');
      const params=new URLSearchParams({client_id:process.env.GITHUB_OAUTH_CLIENT_ID,redirect_uri:callback('github'),scope:'read:user user:email',state:state('github')});return res.redirect(`https://github.com/login/oauth/authorize?${params}`);
    }
    if(provider==='facebook'){
      if(!process.env.FACEBOOK_LOGIN_APP_ID||!process.env.FACEBOOK_LOGIN_APP_SECRET||!callback('facebook').startsWith('http'))throw new Error('Facebook Login non configurato');
      const params=new URLSearchParams({client_id:process.env.FACEBOOK_LOGIN_APP_ID,redirect_uri:callback('facebook'),response_type:'code',scope:'public_profile,pages_show_list',state:state('facebook')});return res.redirect(`https://www.facebook.com/dialog/oauth?${params}`);
    }
    res.status(404).json({success:false,message:'Provider non supportato'});
  }catch(error){res.status(503).json({success:false,message:error.message});}
};

async function captureGithubSnapshot(user,headers){
  const snapshot={
    name:user.name||'',bio:user.bio||'',company:user.company||'',location:user.location||'',blog:user.blog||'',publicRepos:Number(user.public_repos||0),followers:Number(user.followers||0),following:Number(user.following||0),repositories:[],profileReadme:''
  };
  try{
    const reposRes=await fetch('https://api.github.com/user/repos?sort=updated&per_page=6&affiliation=owner',{headers});
    if(reposRes.ok){
      const reposRaw=await reposRes.json();
      if(Array.isArray(reposRaw))snapshot.repositories=reposRaw.map(repo=>({name:repo.name,description:repo.description||'',language:repo.language||'',stars:Number(repo.stargazers_count||0),forks:Number(repo.forks_count||0),url:repo.html_url,updatedAt:repo.updated_at}));
    }else console.warn('[github-oauth] repos snapshot unavailable:',reposRes.status);
  }catch(error){console.warn('[github-oauth] repos snapshot failed:',safeMetaText(error?.message));}
  try{
    const readmeRes=await fetch(`https://api.github.com/repos/${encodeURIComponent(user.login)}/${encodeURIComponent(user.login)}/readme`,{headers:{...headers,Accept:'application/vnd.github.raw+json'}});
    if(readmeRes.ok)snapshot.profileReadme=String(await readmeRes.text()).slice(0,12000);
  }catch(error){console.warn('[github-oauth] README snapshot failed:',safeMetaText(error?.message));}
  return snapshot;
}

exports.callback=async(req,res)=>{
  const provider=String(req.params.provider||'').toLowerCase();
  try{
    if(!['google','github','facebook'].includes(provider))throw new Error('Provider non supportato');
    const providerError=providerCallbackError(req.query);if(providerError)throw new Error(providerError);if(!req.query.state)throw new Error('Sessione OAuth mancante. Riavvia il login dal pulsante MyZubster.');if(!req.query.code)throw new Error('OAuth callback incompleto. Riavvia il login dal pulsante MyZubster.');verifyState(req.query.state,provider);
    let profile;
    if(provider==='google'){
      const clientId=process.env.GOOGLE_LOGIN_CLIENT_ID||process.env.GOOGLE_OAUTH_CLIENT_ID;const clientSecret=process.env.GOOGLE_LOGIN_CLIENT_SECRET||process.env.GOOGLE_OAUTH_CLIENT_SECRET;
      const tokenRes=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({code:req.query.code,client_id:clientId,client_secret:clientSecret,redirect_uri:callback('google'),grant_type:'authorization_code'})});const tokens=await tokenRes.json();if(!tokenRes.ok||!tokens.access_token)throw new Error('Login Google non riuscito');
      const userRes=await fetch('https://openidconnect.googleapis.com/v1/userinfo',{headers:{Authorization:`Bearer ${tokens.access_token}`}});const user=await userRes.json();if(!userRes.ok||!user.sub||!user.email||user.email_verified!==true)throw new Error('Google non ha restituito una email verificata');profile={id:user.sub,email:user.email,name:user.name,avatarUrl:user.picture};
    }else if(provider==='github'){
      const tokenRes=await fetch('https://github.com/login/oauth/access_token',{method:'POST',headers:{Accept:'application/json','Content-Type':'application/json'},body:JSON.stringify({client_id:process.env.GITHUB_OAUTH_CLIENT_ID,client_secret:process.env.GITHUB_OAUTH_CLIENT_SECRET,code:req.query.code,redirect_uri:callback('github')})});const tokens=await tokenRes.json();if(!tokenRes.ok||!tokens.access_token)throw new Error('Login GitHub non riuscito');
      const headers={Accept:'application/vnd.github+json',Authorization:`Bearer ${tokens.access_token}`,'User-Agent':'MyZubster-Gateway'};
      const userRes=await fetch('https://api.github.com/user',{headers});const user=await userRes.json();if(!userRes.ok||!user.id)throw new Error('Profilo GitHub non disponibile');
      let email=user.email;if(!email){const e=await fetch('https://api.github.com/user/emails',{headers});if(e.ok){const list=await e.json();email=list.find(x=>x.primary&&x.verified)?.email||list.find(x=>x.verified)?.email;}}
      if(!email)throw new Error('Serve una email GitHub verificata per creare un nuovo account');
      const publicSnapshot=await captureGithubSnapshot(user,headers);
      profile={id:String(user.id),email,name:user.name,login:user.login,avatarUrl:user.avatar_url,profileUrl:user.html_url,publicSnapshot};
    }else{
      const tokenUrl=new URL('https://graph.facebook.com/oauth/access_token');tokenUrl.searchParams.set('client_id',process.env.FACEBOOK_LOGIN_APP_ID);tokenUrl.searchParams.set('client_secret',process.env.FACEBOOK_LOGIN_APP_SECRET);tokenUrl.searchParams.set('redirect_uri',callback('facebook'));tokenUrl.searchParams.set('code',req.query.code);
      const tokenRes=await fetch(tokenUrl);const tokens=await tokenRes.json();if(!tokenRes.ok||!tokens.access_token){logFacebookOAuthError('token_exchange',tokenRes,tokens);throw new Error('Login Facebook non riuscito');}
      const meUrl=new URL('https://graph.facebook.com/me');meUrl.searchParams.set('fields','id,name,picture');meUrl.searchParams.set('access_token',tokens.access_token);const userRes=await fetch(meUrl);const user=await userRes.json();if(!userRes.ok||!user.id){logFacebookOAuthError('profile_fetch',userRes,user);throw new Error('Profilo Facebook non disponibile');}profile={id:String(user.id),name:user.name,avatarUrl:user.picture?.data?.url||null};
    }
    redirectSuccess(res,await upsertVerifiedAccount(provider,profile),provider);
  }catch(error){redirectError(res,error.message,provider);}
};

exports.exchangeTicket=async(req,res)=>{try{const data=jwt.verify(req.body?.ticket,secret());if(data.purpose!=='social-login-result')throw new Error();res.json({success:true,data:{token:data.token,userId:data.userId,characterId:data.characterId,provider:data.provider,metaverseVerified:true}});}catch(_){res.status(400).json({success:false,message:'Ticket login scaduto o non valido'});}};
exports._test={safeMetaText,logFacebookOAuthError,captureGithubSnapshot};
