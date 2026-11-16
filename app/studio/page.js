'use client';
import { useEffect, useRef, useState } from 'react';

export default function Studio() {
  const [title, setTitle] = useState('');
  const [assets, setAssets] = useState([]);
  const [sel, setSel] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState('Image');
  const [count, setCount] = useState(1);
  const [msg, setMsg] = useState('');
  const [video, setVideo] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    setTitle(new Date().toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    }));
  }, []);

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const load = (url) => new Promise((res) => {
    const img = new Image();
    img.onload = () => res(img);
    img.src = url;
  });

  function onUpload(e) {
    const added = [...e.target.files].map((f, i) => ({
      id: Date.now() + '-' + i,
      url: URL.createObjectURL(f),
    }));
    setAssets((a) => [...a, ...added]);
    e.target.value = '';
  }

  function toggle(id) {
    setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  function send() {
    setMsg('AI generation needs an API key. For now, upload photos and tap Make video.');
  }

  async function makeVideo() {
    const chosen = assets.filter((a) => sel.includes(a.id));
    const list = chosen.length ? chosen : assets;
    if (!list.length) return;
    setBusy(true);
    setVideo('');
    const imgs = await Promise.all(list.map((a) => load(a.url)));
    const c = canvasRef.current;
    const ctx = c.getContext('2d');
    const rec = new MediaRecorder(c.captureStream(30));
    const chunks = [];
    rec.ondataavailable = (e) => chunks.push(e.data);
    const done = new Promise((r) => (rec.onstop = r));
    rec.start();
    for (const img of imgs) {
      const end = performance.now() + 2000;
      while (performance.now() < end) {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, 720, 1280);
        const s = Math.min(720 / img.width, 1280 / img.height);
        const w = img.width * s;
        const h = img.height * s;
        ctx.drawImage(img, (720 - w) / 2, (1280 - h) / 2, w, h);
        await wait(33);
      }
    }
    rec.stop();
    await done;
    setVideo(URL.createObjectURL(new Blob(chunks, { type: 'video/webm' })));
    setBusy(false);
  }

  const round = {
    background: '#18181a', border: 'none', color: '#fff',
    borderRadius: 14, padding: '12px 16px', fontSize: 16,
  };

  return (
    <main style={{ background: '#000', color: '#fff', minHeight: '100vh', paddingBottom: 190, fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16 }}>
        <a href="/" style={{ ...round, textDecoration: 'none' }}>&#8592;</a>
        <span style={{ fontSize: 20, flex: 1 }}>{title}</span>
        <span style={{ ...round }}>&#9906; &nbsp;&#8942;</span>
      </header>

      {assets.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: 200, color: '#999' }}>
          <p>No assets yet.<br />Create one or upload from your gallery.</p>
          <button style={round} onClick={() => fileRef.current.click()}>&#8679; Upload</button>
        </div>
      ) : (
        <div style={{ padding: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {assets.map((a) => (
              <img key={a.id} src={a.url} onClick={() => toggle(a.id)}
                style={{
                  width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 10,
                  outline: sel.includes(a.id) ? '3px solid #4da3ff' : 'none',
                }} />
            ))}
          </div>
          <p style={{ marginTop: 16 }}>
            <button style={round} onClick={() => fileRef.current.click()}>&#8679; Upload more</button>{' '}
            <button style={{ ...round, background: '#eee', color: '#000' }}
              onClick={makeVideo} disabled={busy}>
              {busy ? 'Making video...' : 'Make video'}
            </button>
          </p>
          <p style={{ color: '#999', fontSize: 14 }}>Tap photos to select them. None selected = all.</p>
          {video && (
            <div>
              <video src={video} controls style={{ width: '100%' }} />
              <p><a style={{ color: '#6aa8ff' }} href={video} download="videogen.webm">Download video</a></p>
            </div>
          )}
        </div>
      )}

      <input ref={fileRef} type="file" accept="image/*" multiple
        onChange={onUpload} style={{ display: 'none' }} />
      <canvas ref={canvasRef} width={720} height={1280} style={{ width: 1, height: 1 }} />

      <div style={{
        position: 'fixed', left: 0, right: 0, bottom: 0, background: '#141416',
        borderRadius: '28px 28px 0 0', padding: 20,
      }}>
        {msg && <p style={{ color: '#f5b84c', fontSize: 14, marginTop: 0 }}>{msg}</p>}
        <input value={prompt} onChange={(e) => setPrompt(e.target.value)}
          placeholder="What do you want to make?"
          style={{
            width: '100%', background: 'transparent', border: 'none', outline: 'none',
            color: '#fff', fontSize: 20, marginBottom: 20, boxSizing: 'border-box',
          }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button style={{ ...round, background: 'transparent', fontSize: 28, padding: 0 }}
            onClick={() => fileRef.current.click()}>+</button>
          <span style={{ flex: 1 }} />
          <button style={{ ...round, borderRadius: 28 }}
            onClick={() => setMode(mode === 'Image' ? 'Video' : 'Image')}>{mode}</button>
          <button style={{ ...round, borderRadius: 28 }}
            onClick={() => setCount(count >= 4 ? 1 : count + 1)}>x{count}</button>
          <button style={{ ...round, borderRadius: 28, background: '#2a2a2d' }}
            onClick={send}>&#8594;</button>
        </div>
      </div>
    </main>
  );
}
