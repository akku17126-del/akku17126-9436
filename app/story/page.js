'use client';
import { useState } from 'react';

export default function Story() {
  const [idea, setIdea] = useState('');
  const [story, setStory] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function go() {
    setBusy(true); setErr(''); setStory(null);
    try {
      const r = await fetch('/api/story', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ idea }),
      });
      const d = await r.json();
      if (!r.ok) setErr(d.error || 'Failed');
      else setStory(d);
    } catch (e) {
      setErr('Network error');
    }
    setBusy(false);
  }

  return (
    <main style={{ padding: 24, maxWidth: 520, margin: '0 auto' }}>
      <h1>Story maker</h1>
      <textarea value={idea} onChange={(e) => setIdea(e.target.value)}
        placeholder="A brave little robot looks for the moon..."
        rows={4} style={{ width: '100%', fontSize: 16 }} />
      <button onClick={go} disabled={busy || !idea}
        style={{ padding: '10px 20px', fontSize: 16, marginTop: 10 }}>
        {busy ? 'Writing...' : 'Make story'}
      </button>
      {err && <p style={{ color: '#f66' }}>{err}</p>}
      {story && (
        <div>
          <h2>{story.title}</h2>
          {story.scenes.map((s, i) => (
            <div key={i} style={{ marginBottom: 16 }}>
              <b>Scene {i + 1}</b>
              <p>{s.narration}</p>
              <p style={{ color: '#999' }}>Image: {s.image_prompt}</p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
