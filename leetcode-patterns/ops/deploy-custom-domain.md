# SOP: Renew TLS cert for leetcodecards.com

**Dashboard:** https://app.netlify.com/projects/lc-flashcards/domain-management

## Steps

1. Verify nameservers point to Netlify:
   ```bash
   dig leetcodecards.com NS +short
   # Expected: dns1-4.p05.nsone.net
   ```

2. Go to dashboard link above → HTTPS → click **Renew certificate**

3. Verify:
   ```bash
   curl -sv https://leetcodecards.com 2>&1 | grep "subject:"
   # Expected: subject: CN=leetcodecards.com
   ```

## If cert renewal fails

The cert uses a DNS-01 wildcard challenge. This only works when **Netlify controls DNS** via nameserver delegation. If nameservers were changed back to Squarespace, the challenge will fail with:

```
Acme::Client::Error::RateLimited: too many failed authorizations for "*.leetcodecards.com"
```

**Fix:** In Squarespace domain settings, set nameservers to:
- `dns1.p05.nsone.net`
- `dns2.p05.nsone.net`
- `dns3.p05.nsone.net`
- `dns4.p05.nsone.net`

Wait for propagation (`dig leetcodecards.com NS +short`), then retry step 2.

If rate-limited, wait for the retry-after time in the error message, then renew again.
