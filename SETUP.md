# InspectAI setup

## Local demo
1. `npm install`
2. `npm run dev`
3. Open the local URL.

The app works without API keys using a clearly labeled review fallback.

## Real AI analysis
1. Copy `.env.example` to `.env.local`.
2. Set `OPENAI_API_KEY` on the server/Vercel project. Do not expose it as `NEXT_PUBLIC_*`.
3. Optional: set `OPENAI_VISION_MODEL`.
4. Redeploy.

The browser calls `/api/analyze`; the secret remains server-side.

## Cloud data phase
Run `supabase/schema.sql` in a Supabase project. Keep evidence storage private and add authenticated RLS policies before using customer data in production.
