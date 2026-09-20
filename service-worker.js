self.addEventListener('install', (event) => {
  // すぐにアクティブ化する
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // manifest.json の share_target で指定した action とパスを合わせる
  if (event.request.method === 'POST' && url.pathname === '/saver/share-handler') {
    event.respondWith(handleShareTarget(event.request));
  }
});

async function handleShareTarget(request) {
  try {
    const formData = await request.formData();
    // manifest.json の "files" の "name"（shared_file）に合わせる
    const file = formData.get('shared_file'); 
    
    if (file) {
      console.log('共有されたファイルを受信:', file.name, file.size, file.type);
      
      // 1. 共有されたファイルを後から画面（index.html）で読み込めるようにCache APIに保存
      const cache = await caches.open('shared-file-cache');
      
      // ファイルをArrayBufferとして確実に読み込んでからキャッシュに保存する
      const arrayBuffer = await file.arrayBuffer();
      const headers = new Headers({
        'Content-Type': file.type || 'application/octet-stream',
        'X-File-Name': encodeURIComponent(file.name)
      });

      await cache.put('/saver/latest-file', new Response(arrayBuffer, { headers }));
      
      // キャッシュの書き込みが確実に終わるのを少し待つ
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // 2. 処理が終わったら、アプリのメイン画面（index.html）へリダイレクトする
    // ステータスコード 303 (See Other) でGETリクエストとして戻す
    return Response.redirect('/saver/index.html', 303);

  } catch (error) {
    console.error('シェア処理エラー:', error);
    return new Response('共有データの処理に失敗しました。', { status: 500 });
  }
}
