export const maxDuration = 60;

export async function POST(req) {
  const { idea } = await req.json();
  if (!idea || !process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'Missing idea or API key' }, { status: 400 });
  }
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-5-5',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content:
          'Write a short cartoon story from this idea: ' + idea +
          '. Split it into 5 scenes. Reply with JSON only, no other text, in this shape: ' +
          '{"title":"...","scenes":[{"narration":"...","image_prompt":"..."}]}. ' +
          'image_prompt describes the scene visually for a cartoon image generator.',
      }],
    }),
  });
  const data = await r.json();
  if (!r.ok) {
    return Response.json({ error: data.error?.message || 'API error' }, { status: 500 });
  }
  try {
    const text = data.content.map((b) => b.text || '').join('')
      .replace(/```json|```/g, '').trim();
    return Response.json(JSON.parse(text));
  } catch (e) {
    return Response.json({ error: 'Could not read story' }, { status: 500 });
  }
}
