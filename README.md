# Food Procurement Intelligence

Vercel-ready Next.js application for personalized AI food procurement and meal planning.

## Secure architecture

The browser calls:

- `POST /api/generate` for a new plan
- `POST /api/refine` for follow-up adjustments

Those server routes call Anthropic using `ANTHROPIC_API_KEY`. The key is never sent to the browser.

## Deploy to Vercel

1. Import this repository into Vercel.
2. Add `ANTHROPIC_API_KEY` under Environment Variables.
3. Optionally add `ANTHROPIC_MODEL`.
4. Deploy.

Do not use a `NEXT_PUBLIC_` prefix for the Anthropic key.

## Local development

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.
