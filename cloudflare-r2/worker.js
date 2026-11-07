const MAX_IMAGE_BYTES=2*1024*1024;
const MAX_BUCKET_BYTES=8*1024*1024*1024;
const ALLOWED_TYPES=new Set(["image/jpeg","image/png","image/webp","image/gif"]);

function cors(env){return{"Access-Control-Allow-Origin":env.APP_ORIGIN,"Access-Control-Allow-Headers":"authorization, content-type","Access-Control-Allow-Methods":"GET, POST, DELETE, OPTIONS","Vary":"Origin"}}
function json(body,status,env){return new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json; charset=utf-8",...cors(env)}})}
function bytesToHex(bytes){return[...new Uint8Array(bytes)].map(byte=>byte.toString(16).padStart(2,"0")).join("")}
async function signature(env,value){const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(env.SIGNING_SECRET),{name:"HMAC",hash:"SHA-256"},false,["sign"]);return bytesToHex(await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(value)))}
function safeEqual(left,right){if(left.length!==right.length)return false;let result=0;for(let index=0;index<left.length;index++)result|=left.charCodeAt(index)^right.charCodeAt(index);return result===0}
async function authenticatedUser(request,env){const authorization=request.headers.get("Authorization");if(!authorization?.startsWith("Bearer "))return null;const response=await fetch(`${env.SUPABASE_URL}/auth/v1/user`,{headers:{Authorization:authorization,apikey:env.SUPABASE_PUBLISHABLE_KEY}});if(!response.ok)return null;return response.json()}
async function signedUrl(request,env,key){const expires=Math.floor(Date.now()/1000)+3600,token=await signature(env,`${key}:${expires}`),url=new URL(request.url);return`${url.origin}/image/${encodeURIComponent(key)}?expires=${expires}&signature=${token}`}
async function storageUsage(env){let cursor,totalBytes=0,objectCount=0;do{const page=await env.IMAGES.list({cursor,limit:1000});for(const object of page.objects){totalBytes+=object.size;objectCount+=1}cursor=page.truncated?page.cursor:undefined}while(cursor);return{totalBytes,objectCount,maxBucketBytes:MAX_BUCKET_BYTES}}

export default{async fetch(request,env){
 const url=new URL(request.url);
 if(request.method==="OPTIONS")return new Response(null,{status:204,headers:cors(env)});
 if(url.pathname.startsWith("/image/")&&request.method==="GET"){
  const key=decodeURIComponent(url.pathname.slice(7)),expires=Number(url.searchParams.get("expires")),provided=url.searchParams.get("signature")||"";
  if(!key||!expires||expires<Math.floor(Date.now()/1000))return json({error:"Link expirado."},403,env);
  const expected=await signature(env,`${key}:${expires}`);if(!safeEqual(expected,provided))return json({error:"Assinatura inválida."},403,env);
  const object=await env.IMAGES.get(key);if(!object)return json({error:"Imagem não encontrada."},404,env);
  const headers=new Headers(cors(env));object.writeHttpMetadata(headers);headers.set("Cache-Control","private, max-age=3600");headers.set("ETag",object.httpEtag);return new Response(object.body,{headers});
 }
 const user=await authenticatedUser(request,env);if(!user)return json({error:"Sessão inválida."},401,env);
 if(url.pathname==="/usage"&&request.method==="GET")return json(await storageUsage(env),200,env);
 if(url.pathname==="/upload"&&request.method==="POST"){
  const contentType=(request.headers.get("Content-Type")||"").split(";")[0],declaredSize=Number(request.headers.get("Content-Length")||0);
  if(!ALLOWED_TYPES.has(contentType))return json({error:"Formato de imagem não permitido."},415,env);
  if(declaredSize>MAX_IMAGE_BYTES)return json({error:"Imagem maior que 2 MB."},413,env);
  const body=await request.arrayBuffer();if(!body.byteLength||body.byteLength>MAX_IMAGE_BYTES)return json({error:"Imagem vazia ou maior que 2 MB."},413,env);
  const usage=await storageUsage(env);
  if(usage.totalBytes+body.byteLength>MAX_BUCKET_BYTES)return json({error:"O armazenamento do serviço atingiu o limite de segurança de 8 GB."},507,env);
  const extension={"image/jpeg":"jpg","image/png":"png","image/webp":"webp","image/gif":"gif"}[contentType],key=`${user.id}/${crypto.randomUUID()}.${extension}`;
  await env.IMAGES.put(key,body,{httpMetadata:{contentType},customMetadata:{owner:user.id}});
  return json({key,url:await signedUrl(request,env,key),usage:{totalBytes:usage.totalBytes+body.byteLength,maxBucketBytes:MAX_BUCKET_BYTES}},201,env);
 }
 if(url.pathname==="/sign"&&request.method==="POST"){
  const {key}=await request.json();if(typeof key!=="string"||!key.startsWith(`${user.id}/`))return json({error:"Imagem não autorizada."},403,env);
  return json({key,url:await signedUrl(request,env,key)},200,env);
 }
 if(url.pathname==="/image"&&request.method==="DELETE"){
  const key=url.searchParams.get("key")||"";if(!key.startsWith(`${user.id}/`))return json({error:"Imagem não autorizada."},403,env);
  await env.IMAGES.delete(key);return json({deleted:true},200,env);
 }
 return json({error:"Rota não encontrada."},404,env);
}};
