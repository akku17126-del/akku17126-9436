'use client';
import { useRef, useState } from 'react';

function cartoonize(img) {
  const s = Math.min(720 / img.width, 1280 / img.height, 1);
  const w = Math.round(img.width * s);
  const h = Math.round(img.height * s);
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const x = c.getContext('2d', { willReadFrequently: true });
  x.filter = 'blur(2px) saturate(1.6) contrast(1.1)';
  x.drawImage(img, 0, 0, w, h);
  x.filter = 'none';
  const id = x.getImageData(0, 0, w, h);
  const d = id.data;
  const g = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    g[i] = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2];
  }
  const step = 255 / 5;
  for (let y = 0; y < h; y++) {
    for (let px = 0; px < w; px++) {
      const i = y * w + px;
      let edge = false;
      if (y > 0 && y < h - 1 && px > 0 && px < w - 1) {
        const gx = -g[i - w - 1] - 2 * g[i - 1] - g[i + w - 1] + g[i - w + 1] + 2 * g[i + 1] + g[i + w + 1];
        const gy = -g[i - w - 1] - 2 * g[i - w] - g[i - w + 1] + g[i + w - 1] + 2 * g[i + w] + g[i + w + 1];
        edge = Math.abs(gx) + Math.abs(gy) > 140;
      }
      const o = i * 4;
      if (edge) {
        d[o] = 20; d[o + 1] = 20; d[o + 2] = 20;
      } else {
        d[o] = Math.round(d[o] / step) * step;
        d[o + 1] = Math.round(d[o + 1] / step) * step;
        d[o + 2] = Math.round(d[o + 2] / step) * step;
      }
    }
  }
  x.putImageData(id, 0, 0);
  return c;
}

export default function Home() {
  const [files, setFiles] = useState([]);
  const [secs, setSecs] = useState(2);
  const [cartoon, setCartoon] = useState(true);
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
    let imgs = await Promise.all(files.map(load));
    if (cartoon) {
      const out = [];
      for (const im of imgs) {
        out.push(cartoonize(im));
        await wait(10);
      }
      imgs = out;
    }
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
      <p>
        <label>
          <input type="checkbox" checked={cartoon}
            onChange={(e) => setCartoon(e.target.checked)} />{' '}
          Cartoon style
        </label>
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
