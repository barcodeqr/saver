self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// LINEからのPOSTリクエスト（シェア）をキャッチする
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // manifest.json の share_target の action とパスを完全に一致させる
  if (event.request.method === 'POST' && url.pathname === '/saver/share-handler') {
    event.respondWith(handleShareTarget(event.request));
  }
});

async function handleShareTarget(request) {
  try {
    console.log('★ handleShareTarget が呼び出されました！');
    const formData = await request.formData();
    const file = formData.get('shared_file'); 
    
    if (file) {
      console.log('共有されたファイルを受信:', file.name, file.size, file.type);
      
      const cache = await caches.open('shared-file-cache');
      const arrayBuffer = await file.arrayBuffer();
      const headers = new Headers({
        'Content-Type': file.type || 'application/octet-stream',
        'X-File-Name': encodeURIComponent(file.name)
      });

      await cache.put('/saver/latest-file', new Response(arrayBuffer, { headers }));
      console.log('★ キャッシュへの保存が完了しました');
      
      await new Promise(resolve => setTimeout(resolve, 200));
    } else {
      console.log('▲ 警告: shared_file が取得できませんでした');
    }

    return Response.redirect('/saver/index.html', 303);

  } catch (error) {
    console.error('シェア処理エラー:', error);
    return new Response('共有データの処理に失敗しました。', { status: 500 });
  }
}
