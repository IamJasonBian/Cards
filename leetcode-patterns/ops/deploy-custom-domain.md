# Deploying leetcodecards.com to Netlify

## Architecture

```
Browser (leetcodecards.com)
       │
       ▼
┌─────────────────────────────┐
│  Netlify DNS (NS delegated) │
│  dns1-4.p05.nsone.net       │
│                             │
│  A     @ → Netlify LB      │
│  CNAME www → lc-flashcards  │
│         .netlify.app        │
└──────────────┬──────────────┘
               ▼
┌─────────────────────────────┐
│  Netlify Edge / CDN         │
│  TLS: Let's Encrypt         │
│  (auto wildcard via DNS-01) │
└──────────────┬──────────────┘
               ▼
┌─────────────────────────────┐
│  Static files (dist/)       │
│  React + Vite + Tailwind    │
│  SPA redirect: /* → /index  │
└─────────────────────────────┘
```

## Netlify site

- **Site name:** lc-flashcards
- **Site ID:** c190ab5e-5a21-4f40-b1a4-f21491fffcb4
- **Default URL:** https://lc-flashcards.netlify.app
- **Custom domain:** leetcodecards.com
- **Dashboard:** https://app.netlify.com/projects/lc-flashcards

## Domain: Squarespace → Netlify DNS delegation

The domain `leetcodecards.com` is registered at **Squarespace**. DNS is **delegated to Netlify** by setting nameservers in Squarespace to:

| Nameserver |
|---|
| `dns1.p05.nsone.net` |
| `dns2.p05.nsone.net` |
| `dns3.p05.nsone.net` |
| `dns4.p05.nsone.net` |

Netlify manages DNS records automatically:

| Type | Host | Value |
|---|---|---|
| `NETLIFY` | `leetcodecards.com` | `lc-flashcards.netlify.app` |
| `NETLIFY` | `www.leetcodecards.com` | `lc-flashcards.netlify.app` |

## TLS / HTTPS

- **Provider:** Let's Encrypt (auto-provisioned by Netlify)
- **Challenge type:** DNS-01 (requires Netlify DNS — will NOT work with external DNS)
- **Certificate covers:** `leetcodecards.com`, `*.leetcodecards.com`
- **Auto-renews:** Yes

### Gotcha: SSL cert fails with external DNS

If you use A/CNAME records at an external registrar (Squarespace, GoDaddy, etc.) instead of delegating nameservers to Netlify, the wildcard cert provisioning will fail because Netlify can't write the `_acme-challenge` TXT record needed for DNS-01 validation. This results in:

```
Acme::Client::Error::RateLimited: too many failed authorizations
for "*.leetcodecards.com"
```

**Fix:** Delegate nameservers to Netlify (as done above). Do NOT use A/CNAME records at an external DNS provider for this site.

## Deploy commands

### Manual deploy from local

```bash
cd leetcode-patterns
npm install
npm run build
npx netlify link --id c190ab5e-5a21-4f40-b1a4-f21491fffcb4
npx netlify deploy --prod --dir=dist
```

### First-time setup on a new machine

```bash
npx netlify login
npx netlify link --id c190ab5e-5a21-4f40-b1a4-f21491fffcb4
```

## Troubleshooting

### ERR_CERT_COMMON_NAME_INVALID
The SSL cert doesn't cover `leetcodecards.com`. Check:
1. Nameservers at Squarespace point to Netlify (`dig leetcodecards.com NS +short`)
2. Renew cert in dashboard: https://app.netlify.com/projects/lc-flashcards/domain-management → HTTPS → Renew certificate

### Let's Encrypt rate limit
If cert provisioning hits rate limits, wait for the retry-after time shown in the error, then renew again from the dashboard.

### Deploy says "not linked"
```bash
npx netlify link --id c190ab5e-5a21-4f40-b1a4-f21491fffcb4
```
