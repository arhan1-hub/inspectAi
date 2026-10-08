import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

type Img = { url: string; kind: 'before' | 'after'; name?: string };

const fallback = (asset: string, before: Img[], after: Img[]) => ({
  mode: 'demo',
  findings: [
    { id: 'coverage', title: after.length < 3 ? 'Additional evidence recommended' : 'Evidence coverage captured', detail: after.length < 3 ? 'Add another current angle before finalizing the inspection.' : 'Multiple current-condition angles are available for human review.', status: after.length < 3 ? 'ACTION' : 'READY', confidence: 0.92 },
    { id: 'compare', title: 'Possible visible change', detail: `The inspection contains ${before.length} previous and ${after.length} current image${after.length === 1 ? '' : 's'} for comparison. Review corresponding areas before making a condition decision.`, status: 'REVIEW', confidence: 0.68 },
  ],
  summary: `${asset}: evidence is ready for human review.`,
  disclaimer: 'Automated suggestions describe visible evidence only. They are not proof of causation, fault, or responsibility.'
});

function cleanJson(text: string) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)?.[1];
  const candidate = fenced || text.match(/\{[\s\S]*\}/)?.[0];
  if (!candidate) throw new Error('Model did not return JSON.');
  return JSON.parse(candidate);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const asset = String(body.asset || 'Unnamed asset');
    const before: Img[] = Array.isArray(body.before) ? body.before : [];
    const after: Img[] = Array.isArray(body.after) ? body.after : [];
    if (!before.length || !after.length) return NextResponse.json({ error: 'At least one before and one after image are required.' }, { status: 400 });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json(fallback(asset, before, after));

    const images = [...before.slice(0, 4), ...after.slice(0, 4)];
    const content: any[] = [{ type: 'input_text', text: `You are InspectAI, a cautious physical-asset inspection assistant. Asset: ${asset}. Compare the BEFORE and AFTER photos below. Identify only visible, evidence-supported differences or evidence-quality issues. Never claim who caused damage, legal responsibility, or certainty of causation. Return ONLY valid JSON with this shape: {"summary":string,"findings":[{"id":string,"title":string,"detail":string,"status":"REVIEW"|"ACTION"|"READY","confidence":number}],"disclaimer":string}. Keep findings concise. If images do not show a clear difference, say so. Treat image order as labeled by the text immediately before each image.` }];
    for (const img of images) {
      content.push({ type: 'input_text', text: `${img.kind.toUpperCase()} PHOTO${img.name ? `: ${img.name}` : ''}` });
      content.push({ type: 'input_image', image_url: img.url, detail: 'high' });
    }

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: process.env.OPENAI_VISION_MODEL || 'gpt-5', input: [{ role: 'user', content }] })
    });
    if (!response.ok) {
      const message = await response.text();
      console.error('Vision provider error:', message.slice(0, 1000));
      return NextResponse.json({ ...fallback(asset, before, after), mode: 'fallback', warning: 'Vision provider unavailable; review the evidence manually.' });
    }
    const data = await response.json();
    const parsed = cleanJson(String(data.output_text || ''));
    return NextResponse.json({ ...parsed, mode: 'vision', disclaimer: parsed.disclaimer || 'Automated suggestions describe visible evidence only. They are not proof of causation, fault, or responsibility.' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Analysis failed. Please retry.' }, { status: 500 });
  }
}
