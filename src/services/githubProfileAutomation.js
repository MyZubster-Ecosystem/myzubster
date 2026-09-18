const crypto = require('crypto');

function key() {
  const raw = process.env.GITHUB_TOKEN_ENCRYPTION_KEY;
  if (!raw) throw new Error('GITHUB_TOKEN_ENCRYPTION_KEY non configurata');
  const decoded = Buffer.from(raw, 'base64');
  if (decoded.length !== 32) throw new Error('GITHUB_TOKEN_ENCRYPTION_KEY deve essere una chiave base64 da 32 byte');
  return decoded;
}
function encryptToken(value) {
  const iv=crypto.randomBytes(12);const cipher=crypto.createCipheriv('aes-256-gcm',key(),iv);const encrypted=Buffer.concat([cipher.update(String(value),'utf8'),cipher.final()]);const tag=cipher.getAuthTag();return [iv,tag,encrypted].map(x=>x.toString('base64url')).join('.');
}
function decryptToken(value) {
  const [iv,tag,data]=String(value||'').split('.');if(!iv||!tag||!data)throw new Error('Token GitHub cifrato non valido');const decipher=crypto.createDecipheriv('aes-256-gcm',key(),Buffer.from(iv,'base64url'));decipher.setAuthTag(Buffer.from(tag,'base64url'));return Buffer.concat([decipher.update(Buffer.from(data,'base64url')),decipher.final()]).toString('utf8');
}
async function githubRequest(token,path,options={}) {
  const response=await fetch('https://api.github.com'+path,{...options,headers:{Accept:'application/vnd.github+json','Content-Type':'application/json','User-Agent':'MyZubster-Zorgax',Authorization:'Bearer '+token,...(options.headers||{})}});let data=null;const text=await response.text();try{data=text?JSON.parse(text):null;}catch(_){data=text;}if(!response.ok)throw new Error((data&&data.message)||('GitHub API '+response.status));return data;
}
async function updateBio(token,bio){return githubRequest(token,'/user',{method:'PATCH',body:JSON.stringify({bio:String(bio||'').slice(0,160)})});}
async function updateProfileReadme(token,login,content){const owner=encodeURIComponent(login);const path='/repos/'+owner+'/'+owner+'/contents/README.md';let sha;try{const current=await githubRequest(token,path);sha=current&&current.sha;}catch(error){if(!String(error.message).includes('Not Found'))throw error;}const body={message:'docs: update profile README with Zorgax',content:Buffer.from(String(content||'').slice(0,50000),'utf8').toString('base64')};if(sha)body.sha=sha;return githubRequest(token,path,{method:'PUT',body:JSON.stringify(body)});}
module.exports={encryptToken,decryptToken,updateBio,updateProfileReadme};
