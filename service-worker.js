self.addEventListener('install', (event) => {
  // すぐにアクティブ化する場合
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 特定のエンドポイント（例: /upload）へのPOSTリクエストを処理
  if (event.request.method === 'POST' && url.pathname === '/upload') {
    event.respondWith(handlePostRequest(event.request));
  }
});

async function handlePostRequest(request) {
  try {
    // 送信されたデータがFormData（ファイルアップロードなど）の場合
    const formData = await request.formData();
    const file = formData.get('file'); // フォームのinput名に合わせて変更
    
    if (file) {
      console.log('受け取ったファイル:', file.name, file.size, file.type);
      
      // 必要に応じてIndexedDBに保存したり、Cache APIに保存したりできます
    }

    // クライアント（画面側）へレスポンスを返す
    return new Response(
      JSON.stringify({ success: true, message: 'ファイルを正常に受信しました。' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('POST処理エラー:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
