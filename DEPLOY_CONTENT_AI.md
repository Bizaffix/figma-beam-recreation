# Deploy AI blog & news generation (quilt-match parity)

> **Currently disabled in the app UI** — use manual **New blog post** / **New news item** on `/admin/content` until you enable AI below.

Admin **Generate blog post** / **Generate news batch** call Supabase Edge Functions that use the Lovable AI gateway (same as quilt-match).

## 1. Run SQL migrations

In Supabase SQL Editor, run (in order):

1. `supabase/migrations/20260518120000_blog_news_content.sql` — `blog_posts`, `news_items`
2. `supabase/migrations/20260518130100_blog_ai_topics.sql` — `blog_topics` seed + `content_generation_log`

## 2. Set secrets

In Supabase Dashboard → **Project Settings** → **Edge Functions** → **Secrets**:

| Secret | Required | Description |
|--------|----------|-------------|
| `LOVABLE_API_KEY` | Yes | Same key quilt-match uses for `ai.gateway.lovable.dev` |
| `CONTENT_CRON_SECRET` | Optional | For scheduled HTTP calls without admin JWT |

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are set automatically when deploying functions.

## 3. Deploy edge functions

```bash
supabase functions deploy generate-blog
supabase functions deploy generate-news
```

## 4. Test from admin UI

1. Log in as admin → **Content**
2. Click **Generate blog post** (may take 30–90 seconds)
3. New row appears as **published** with cover image when AI succeeds
4. **Generate news batch** creates 3 published news items

## 5. Optional: daily cron

Schedule HTTP POST to your project functions URL with header `x-content-cron-secret: <CONTENT_CRON_SECRET>`:

- `https://<project-ref>.supabase.co/functions/v1/generate-blog`
- `https://<project-ref>.supabase.co/functions/v1/generate-news`

Use the service role or anon key in `Authorization` only if you also pass the cron secret (see `_shared/auth.ts`).

## Troubleshooting

| Error | Fix |
|-------|-----|
| `Missing LOVABLE_API_KEY` | Add secret and redeploy functions |
| `No blog topics available` | Run `20260518130100_blog_ai_topics.sql` |
| `Failed to send a request to the Edge Function` | Deploy `generate-blog` / `generate-news` |
| `Forbidden: admin role required` | Set `profiles.role = 'admin'` for your user |
