# DramaFlix: short drama streaming site

A mobile-first, SEO-optimised site for full Asian short dramas, built with Next.js 16, Postgres and Prisma.
Every title is **one complete vertical (9:16) video** with a portrait cover. Videos stay on Dailymotion or your own video server: in the admin panel you paste a Dailymotion link, an iframe embed, an embed URL, an `.m3u8` (HLS) link or an `.mp4` link.

## Features

**Viewers (mobile-first)**
- Home: cover slider, Continue Watching, Trending, New Releases, Top Rated and genre chips
- One page per title: vertical player, rating, length, genres, story, facts, cast and related titles
- The player loads only when the viewer taps Play, which keeps Core Web Vitals fast. It uses hls.js for `.m3u8`, a native `<video>` for `.mp4`, and an iframe for embeds.
- Backup servers: if one fails, the player switches to the next automatically
- Continue Watching (with resume position for HLS/MP4) and My List, stored on the device, so no login is needed
- Bottom navigation bar on phones, 44px+ tap targets, keyboard focus styles, PWA manifest

**SEO**
- Public pages are static HTML, served instantly and refreshed automatically when you edit in the admin panel
- Unique `<title>` ("Title (Year) Full Movie Eng Sub"), meta description, canonical and Open Graph tags on every page
- JSON-LD: `Movie` with an embedded `VideoObject` (length, thumbnail, embed URL), `BreadcrumbList`, `ItemList`, `Article`, and `WebSite` with `SearchAction`
- Sitemap index at `/sitemap.xml`, including a **video sitemap** for every title, and `robots.txt`
- Old episode URLs (`/drama/x/episode-3`) and the removed series pages redirect permanently (308)
- IndexNow ping to Bing and Yandex on publish (optional)

**Admin (`/admin`)**
- Login with server-side sessions: logging out (or revoking a session on the Security page) ends it on the server
- Titles: vertical cover with live preview, genres, country, cast, SEO overrides, homepage slider order, draft/published
- **Video box** per title: paste a link; Dailymotion links are checked and their length and thumbnail filled in. Add backup servers and reorder or disable them.
- Trash: deleted titles and posts can be restored for 30 days
- Dashboard: views, most watched, slider order, broken links, titles without a working video
- Genres, countries, actors (with SEO intro text) and blog posts

**Production**
- The server refuses to start with unsafe settings (placeholder secrets, weak admin password, non-https site URL)
- `/api/health` checks the app and database (used by Docker and uptime monitors)
- Security headers (CSP, HSTS, frame and permissions policies); admin and API responses are never indexed or cached
- Server errors are logged as one JSON line each

## Local setup

```bash
cp .env.example .env                 # then edit values
docker compose up -d                 # Postgres on localhost:5434
npm install
npx prisma migrate deploy
npm run db:seed                      # genres, countries and demo titles
npm run dev                          # http://localhost:3000, admin at /admin
```

## Adding content

1. Go to `/admin`, then **Genres & Countries**, and add any missing genres and countries.
2. Click **+ New drama**. Enter the title, write your **own** synopsis (150–300 words), paste a vertical cover image URL, choose genres and country, and enter the cast.
3. On the next screen, paste the video link in the **Video** box. Add a second link as a backup server if you have one.
4. Tick **Featured on home slider** for titles you want on the homepage, and reorder them from the dashboard.

Set `ALLOWED_SOURCE_HOSTS` to your video server's domain(s). Links from any other host are rejected, and the browser is only allowed to frame those hosts. Dailymotion is always allowed.

**Dailymotion rules:** only use the official embed player, never hide or strip Dailymotion's ads, branding or controls (the player iframe is deliberately not sandboxed), and never download and re-host videos. Keep the DMCA page (`/dmca`) up as your takedown contact.

## Deploying to production

The included stack runs everything on one Linux server with Docker: Postgres, the app, **Caddy** (automatic HTTPS certificates), and a cron container for the scheduled jobs and nightly database backups.

1. Get a Linux server with 2 GB RAM or more (Hetzner, DigitalOcean…) and install Docker.
2. Point your domain's DNS `A` record (and `www`) at the server. Open ports 80 and 443. If you use Cloudflare, set SSL to "Full (strict)".
3. Copy the project to the server, then create the settings file:
   ```bash
   cp .env.example .env
   ```
   Fill in every value. Generate secrets with `openssl rand -hex 32` (`SESSION_SECRET`), `openssl rand -hex 16` (`CRON_SECRET`) and `openssl rand -hex 24` (`POSTGRES_PASSWORD`). Set `NEXT_PUBLIC_SITE_URL=https://yourdomain.com` and `DOMAIN=yourdomain.com`.
4. Deploy:
   ```bash
   sh deploy/deploy.sh
   ```
   It starts Postgres, applies migrations, builds the app (the build prerenders pages from the database), and starts the app, Caddy and the cron container. Run the same command for every update.
5. Add the genres and countries: `docker compose -f docker-compose.prod.yml run --rm migrate npx prisma db seed` (demo titles are skipped in production).

### Deploying with Dokploy

If you already run a [Dokploy](https://dokploy.com) panel, use `docker-compose.dokploy.yml`. It leaves out Caddy, because Dokploy's Traefik handles HTTPS. It also builds the image without a running database (a throwaway one starts inside the build), so the panel's Deploy button is all you need.

**1. Point your domain at the server.** Add DNS records `A @ <server-ip>` and `A www <server-ip>`. If you use Cloudflare, keep the cloud grey (DNS only) until HTTPS works.

**2. Connect GitHub.** In Dokploy go to **Settings → Git → GitHub**, create the GitHub App and install it on this repository.

**3. Create the service.** Open a project, then **Create Service → Compose**. On the **General** tab choose provider GitHub, repository `knockxme/reels-short`, branch `main`, and Compose Path `./docker-compose.dokploy.yml`. Save.

**4. Add the settings.** Generate the secrets:
```bash
openssl rand -hex 32   # SESSION_SECRET
openssl rand -hex 16   # CRON_SECRET
openssl rand -hex 24   # POSTGRES_PASSWORD
```
Paste this into the **Environment** tab with your own values:
```env
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
NEXT_PUBLIC_SITE_NAME=DramaFlix
CONTACT_EMAIL=you@yourdomain.com
ADMIN_USERNAME=youradmin
ADMIN_PASSWORD=
SESSION_SECRET=
CRON_SECRET=
POSTGRES_USER=dramaflix
POSTGRES_PASSWORD=
POSTGRES_DB=dramaflix
BACKUP_KEEP_DAYS=14
NEXT_PUBLIC_DAILYMOTION_PLAYER_ID=
ALLOWED_SOURCE_HOSTS=
IMAGE_HOSTS=
INDEXNOW_KEY=
GOOGLE_SITE_VERIFICATION=
BING_SITE_VERIFICATION=
```
Leave out `DATABASE_URL` (the compose file builds it from the `POSTGRES_*` values) and `DOMAIN`. `ADMIN_PASSWORD` needs 12+ characters and must not start with "admin". The app refuses to start with weak or placeholder secrets.

**5. Add the domain.** On the **Domains** tab add host `yourdomain.com`, service `app`, port `3000`, path `/`, HTTPS on, certificate Let's Encrypt. Add `www.yourdomain.com` the same way if you want it.

**6. Deploy.** Click **Deploy** and follow the build on the **Deployments** tab. The first build takes about 3–8 minutes. On a server with less than 4 GB RAM, add swap first or the build may be killed:
```bash
fallocate -l 4G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

**7. Add genres and countries (once).** Over SSH on the server, where `<app-name>` is the app name shown on the service's General tab (e.g. `dramaflix-abc123`):
```bash
cd /etc/dokploy/compose/<app-name>/code
docker compose -p <app-name> -f docker-compose.dokploy.yml run --rm migrate npx prisma db seed
```

**8. Check it.** `curl https://yourdomain.com/api/health` should print `{"ok":true}`. Log in at `https://yourdomain.com/admin`. With Cloudflare, you can now turn the proxy on and set SSL/TLS to **Full (strict)**.

**Updates:** push to `main`, then click **Deploy**, or turn on **Autodeploy** on the General tab. Settings that start with `NEXT_PUBLIC_`, plus `ALLOWED_SOURCE_HOSTS` and `IMAGE_HOSTS`, need a full redeploy; other settings only need a restart.

**Logs:** the service's **Logs** tab (pick `app`). **Backups:** `/etc/dokploy/compose/<app-name>/files/backups/` on the server.

| Problem | Fix |
| --- | --- |
| Build stops with "Killed" | Out of memory: add swap (step 6) or more RAM |
| App log says "Refusing to start" | A setting in the Environment tab is missing or too weak; the log names it |
| No HTTPS certificate | DNS not pointing at the server yet, port 80 blocked, or Cloudflare proxy turned on too early |
| 404 or Bad Gateway on the domain | Domain must use service `app`, port `3000`; check the app container is healthy |

Pages prerendered during the build come from the empty build database, so right after a deploy a page can show empty once and then refresh from the real database within about a minute.

**Scheduled jobs** (in `deploy/crontab`, UTC): link checker daily at 04:00, trash cleanup at 04:30, database backup at 03:15 into `./backups` (Dokploy: `../files/backups`), kept for `BACKUP_KEEP_DAYS`. **Copy the backups off the server** regularly (e.g. `rclone` to cloud storage). Restore with `pg_restore -d <db> --clean <file>.dump`.

**Useful commands**
```bash
docker compose -f docker-compose.prod.yml ps                 # status and health
docker compose -f docker-compose.prod.yml logs -f app        # app logs (errors are JSON lines)
curl https://yourdomain.com/api/health                       # {"ok":true}
```

> Settings that start with `NEXT_PUBLIC_`, plus `ALLOWED_SOURCE_HOSTS` and `IMAGE_HOSTS`, are read when the app is built. After changing them, run `sh deploy/deploy.sh` again.
>
> Admin edits show on the site immediately. After a restart, a page cached before the restart refreshes within about a minute.
>
> The admin login rate limit is kept in memory, so run a single app container (the default).

## SEO launch checklist

- [ ] Set `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SITE_NAME` and every secret (the server will not start with placeholders)
- [ ] Add Google Search Console and Bing Webmaster Tools (set `GOOGLE_SITE_VERIFICATION` / `BING_SITE_VERIFICATION`), then submit `https://yourdomain.com/sitemap.xml`
- [ ] Set `INDEXNOW_KEY` (any 32-char hex) for instant Bing indexing
- [ ] Publish 50–100 titles with **unique** synopses before promoting the site
- [ ] Write intro text for your main genres and countries (admin, Genres & Countries)
- [ ] Publish 2–3 blog posts a week targeting searches like "best X short dramas" and "X ending explained", each linking to your title pages
- [ ] Check PageSpeed Insights on mobile for the home and title pages
- [ ] Keep the DMCA page and contact email working, and respond to takedown notices quickly

## Project structure

```
prisma/schema.prisma           database models (a title's video is its Episode row number 1)
src/app/(site)/                public pages
src/app/admin/                 admin panel + server actions (actions.ts)
src/app/api/                   health check, view counter, cron jobs
src/app/sitemap.xml, sitemaps/ XML sitemaps (with video entries)
src/components/Player.tsx      vertical video player (iframe / HLS / MP4)
src/lib/data.ts                cached database queries (cache tags)
src/lib/seo.ts                 titles, descriptions, JSON-LD
src/lib/source.ts              paste parser for iframe/URL/m3u8/mp4
src/instrumentation.ts         startup settings check + JSON error logs
docker-compose.prod.yml        production stack for a plain server (Caddy HTTPS); deploy/ has the Caddyfile, crontab and scripts
docker-compose.dokploy.yml     production stack for Dokploy (Traefik HTTPS, builds without a database)
```
