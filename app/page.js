'use client';
import { useRef, useState } from 'react';

export default function Home() {
  const [files, setFiles] = useState([]);
  const [secs, setSecs] = useState(2);
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const canvasRef = useRef(null);

  const load = (f) => new Promise((res) => {
    const img = new Image();
    img.onload = () => res(img);
    img.src = URL.createObjectURL(f);
  });
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  async function make() {
    if (!files.length) return;
    setBusy(true);
    setUrl('');
    const imgs = await Promise.all(files.map(load));
    const c = canvasRef.current;
    const ctx = c.getContext('2d');
    const rec = new MediaRecorder(c.captureStream(30));
    const chunks = [];
    rec.ondataavailable = (e) => chunks.push(e.data);
    const done = new Promise((r) => (rec.onstop = r));
    rec.start();
    for (const img of imgs) {
      const end = performance.now() + secs * 1000;
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
    setUrl(URL.createObjectURL(new Blob(chunks, { type: 'video/webm' })));
    setBusy(false);
  }

  return (
    <main style={{ padding: 24, maxWidth: 480, margin: '0 auto' }}>
      <h1>videogen</h1>
      <p>Pick photos and turn them into a video.</p>
      <input type="file" accept="image/*" multiple
        onChange={(e) => setFiles([...e.target.files])} />
      <p>
        Seconds per photo:{' '}
        <input type="number" min="1" max="10" value={secs}
          onChange={(e) => setSecs(Number(e.target.value) || 2)}
          style={{ width: 60 }} />
      </p>
      <button onClick={make} disabled={busy || !files.length}
        style={{ padding: '10px 20px', fontSize: 16 }}>
        {busy ? 'Making video...' : 'Make video'}
      </button>
      <canvas ref={canvasRef} width={720} height={1280}
        style={{ width: 1, height: 1 }} />
      {url && (
        <div style={{ marginTop: 20 }}>
          <video src={url} controls style={{ width: '100%' }} />
          <p><a href={url} download="videogen.webm">Download video</a></p>
        </div>
      )}
    </main>
  );
}
