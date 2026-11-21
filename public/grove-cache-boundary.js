// Remove only previously cached private Grove API/media responses. Keep public
// tree/map caches and the user's unrelated offline work intact.
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 for(const name of ['supabase-api','tree-images']){
  if(!(await caches.keys()).includes(name)) continue;
  const cache=await caches.open(name);
  for(const request of await cache.keys()){
   if(/\/rest\/v1\/(?:life_groves(?:[/?]|$)|life_grove_[^/?]*|founding_grove_[^/?]*|rpc\/[^/?]*grove[^/?]*)/i.test(request.url)||/\/offerings-private\//i.test(request.url)) await cache.delete(request);
  }
 }
})()));
