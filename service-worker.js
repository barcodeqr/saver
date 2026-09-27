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
  const cache = await caches.open('shared-file-cache');
  const debugKey = new Request('/saver/debug-log');
  const debugInfo = {
    timestamp: new Date().toLocaleString('ja-JP'),
    step: 'start',
  };

  try {
    console.log('★ handleShareTarget が呼び出されました！');

    // リクエストの中身を丸ごと記録（formDataとして読む前に）
    debugInfo.contentType = request.headers.get('content-type');
    debugInfo.step = 'formData取得前';
    await cache.put(debugKey, new Response(JSON.stringify(debugInfo)));

    const formData = await request.formData();

    // formDataに実際に何のキーが入っているか、全部記録する
    const keys = [];
    for (const pair of formData.entries()) {
      const key = pair[0];
      const value = pair[1];
      if (value instanceof File) {
        keys.push(`${key} = File(name:${value.name}, size:${value.size}, type:${value.type})`);
      } else {
        keys.push(`${key} = "${value}"`);
      }
    }
    debugInfo.formDataKeys = keys;
    debugInfo.step = 'formData取得完了';

    const file = formData.get('shared_file');

    if (file) {
      console.log('共有されたファイルを受信:', file.name, file.size, file.type);
      debugInfo.step = 'ファイル取得成功';
      debugInfo.fileName = file.name;
      debugInfo.fileSize = file.size;
      debugInfo.fileType = file.type;

      const arrayBuffer = await file.arrayBuffer();
      const headers = new Headers({
        'Content-Type': file.type || 'application/octet-stream',
        'X-File-Name': encodeURIComponent(file.name)
      });

      // ★ 絶対パスのRequestオブジェクトをキーとして保存
      const cacheKey = new Request('/saver/latest-file');
      await cache.put(cacheKey, new Response(arrayBuffer, { headers }));
      console.log('★ キャッシュへの保存が完了しました');
      debugInfo.step = 'キャッシュ保存完了';

      await new Promise(resolve => setTimeout(resolve, 200));
    } else {
      console.log('▲ 警告: shared_file が取得できませんでした');
      debugInfo.step = '▲ shared_fileがnull（キー名不一致か、ファイル本体が送られていない）';
    }

    debugInfo.success = true;
    await cache.put(debugKey, new Response(JSON.stringify(debugInfo)));

    return Response.redirect('/saver/index.html', 303);

  } catch (error) {
    console.error('シェア処理エラー:', error);
    debugInfo.step = '★エラー発生: ' + debugInfo.step;
    debugInfo.error = error.message;
    debugInfo.success = false;
    try {
      await cache.put(debugKey, new Response(JSON.stringify(debugInfo)));
    } catch (e2) {
      // キャッシュ書き込み自体が失敗した場合は諦める
    }
    return new Response('共有データの処理に失敗しました。', { status: 500 });
  }
}
