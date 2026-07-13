/* Viora service worker: офлайн-кеш ядра + stale-while-revalidate для статики.
   Внешние API (YouTube, Mistral, Google) НЕ кешируются. */
var CACHE='viora-v33-1';
var CORE=["./", "./index.html", "./css/styles.css", "./js/01_block_1.js", "./js/02_block_2.js", "./js/03_block_3.js", "./js/04_block_4.js", "./js/05_block_5.js", "./js/06_vp45.js", "./js/07_block_7.js", "./js/08_block_8.js", "./js/09_block_9.js", "./js/10_block_10.js", "./js/11_block_11.js", "./js/12_block_12.js", "./js/13_block_13.js", "./js/14_viora-r10-js.js", "./js/16_viora-v2-js.js", "./js/17_v3pack.js", "./js/18_v4pack.js", "./js/19_v5pack.js", "./js/20_v6pack.js", "./js/21_v7pack.js", "./js/22_v8pack.js", "./js/23_v9pack.js", "./js/24_v10pack.js", "./js/25_block_25.js", "./js/26_block_26.js", "./js/27_block_27.js", "./js/33_block_33.js", "./js/40_v20b1.js", "./js/41_v20b2pack.js", "./js/44_block_44.js", "./js/48_v26js.js", "./js/49_v26m2js.js", "./js/50_v26m3js.js", "./js/51_v27js.js", "./js/52_v28js.js", "./js/53_v28m2js.js", "./js/54_v28m3js.js", "./js/55_v28m4js.js", "./js/56_v28m5js.js", "./js/57_v29m6js.js", "./js/58_v28m7js.js", "./js/59_v28m8js.js", "./js/60_block_60.js", "./js/61_block_61.js", "./js/62_block_62.js", "./js/63_block_63.js", "./js/64_block_64.js", "./js/65_perf.js", "./js/66_history_delta.js", "./js/67_uipolish.js", "./js/68_v32pack.js"];
self.addEventListener('install',function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(CORE);}).then(function(){return self.skipWaiting();}));
});
self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(ks){
    return Promise.all(ks.filter(function(k){return k!==CACHE;}).map(function(k){return caches.delete(k);}));
  }).then(function(){return self.clients.claim();}));
});
self.addEventListener('fetch',function(e){
  var req=e.request;
  if(req.method!=='GET')return;
  var url=new URL(req.url);
  if(url.origin!==location.origin)return;
  if(req.mode==='navigate'){
    e.respondWith(fetch(req).then(function(r){
      var cp=r.clone();caches.open(CACHE).then(function(c){c.put('./index.html',cp);});return r;
    }).catch(function(){return caches.match('./index.html');}));
    return;
  }
  e.respondWith(caches.match(req).then(function(hit){
    var net=fetch(req).then(function(r){
      if(r&&r.ok){var cp=r.clone();caches.open(CACHE).then(function(c){c.put(req,cp);});}
      return r;
    }).catch(function(){return hit;});
    return hit||net;
  }));
});
