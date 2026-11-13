# Tyrone Futbol Simulator

Football Chairman–style browser career: you are the chairman. Hire managers, set the transfer budget, build the ground, run finances and fans, then sim or watch matchdays across the Tyrone pyramid.

## Play locally

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:8080](http://127.0.0.1:8080).

## Build

```bash
npm run build
npm run preview
```

## Deploy (recommended free host)

**Best free option for this stack: [Vercel](https://vercel.com)**

This project is Vite + TanStack Start (SSR/Nitro). Vercel’s free Hobby plan fits it well: HTTPS, global CDN, automatic deploys from GitHub, and good SPA/SSR support.

### One-click path

1. Push this repo to GitHub (already done if you followed the project setup).
2. Go to [vercel.com/new](https://vercel.com/new) and import the repo.
3. Framework preset: leave as detected (Vite / other).
4. Build command: `npm run build`
5. Output / install: use defaults from the repo.
6. Deploy.

### CLI path

```bash
npm i -g vercel
vercel
```

### Other free hosts (also fine)

| Host | Fit |
|------|-----|
| **Cloudflare Pages** | Strong free CDN; use if you prefer Cloudflare. May need adapter tweaks for Nitro SSR. |
| **Netlify** | Easy Git deploys; good for static/SPA. Confirm SSR adapter if using server routes. |
| **Render** | Free web service; slower cold starts than Vercel. |

Auth/database features in the template stay **off** for this game (localStorage careers). No paid DB required on the free tier.

## Save data

Careers persist in the browser (`localStorage`). Use **Settings** on the desk to write save slots or export JSON.
