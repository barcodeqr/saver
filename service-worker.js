async function handleShareTarget(request) {
  try {
    console.log('★ handleShareTarget が呼び出されました！'); // 追加
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
      console.log('★ キャッシュへの保存が完了しました'); // 追加
      
      await new Promise(resolve => setTimeout(resolve, 200));
    } else {
      console.log('▲ 警告: shared_file が取得できませんでした'); // 追加
    }

    return Response.redirect('/saver/index.html', 303);

  } catch (error) {
    console.error('シェア処理エラー:', error);
    return new Response('共有データの処理に失敗しました。', { status: 500 });
  }
}
