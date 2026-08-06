# IndexNow Production Verification

- Verification completed: 2026-08-06T18:05:14.537Z
- DigitalOcean app: `broey-website`
- App ID: `d53e2714-0516-49bc-ab95-2943a2bf3d5d`
- Component: `broeywebsite2025`
- Configuration deployment ID: `990a4abc-d960-4b90-ae8e-7937d0c22729`
- Production source deployment ID: `5a0a266d-b076-4e6a-85ae-d052e8efd0ec`
- Expected commit: `d34b4ff8850abcb9b3398fc8e065f6885988cf3a`
- Deployed commit: `d34b4ff8850abcb9b3398fc8e065f6885988cf3a`
- Production key fingerprint: `57f2…d70a`

## DigitalOcean configuration

- Variable: `INDEXNOW_KEY`
- Scope: run time only
- Encryption: enabled
- Existing component environment variables: preserved
- Autodeploy: off
- Deployment result: success
- App health after deployment: healthy
- Primary domain: `broey.net` (active)
- `www.broey.net`: active, redirects to `broey.net` with HTTP 301 over HTTPS

## Public key-file verification

- HTTP status: 200
- Content type: `text/plain; charset=utf-8`
- Response body: exact key match
- Extra whitespace or markup: none
- Authentication: none
- Redirect: none
- `X-Robots-Tag`: `noindex, nofollow`
- Key route in sitemap: absent
- Full key and full verification URL: intentionally omitted

An incorrect UUID-shaped key filename returned HTTP 404 with no redirect.

## Regression checks

- `/`: HTTP 200
- `/music`: HTTP 200
- `/robots.txt`: HTTP 200, `text/plain`
- `/sitemap.xml`: HTTP 200, `application/xml`
- Sitemap URL count: 22
- Sitemap key-route entry: absent
- Sitemap URLs use `https://broey.net`: yes
- Canonicals checked on `/`, `/music`, `/about`, `/press`, and `/music/free`: all use `https://broey.net`
- Public browser assets checked: 11 JavaScript assets
- Production key found in public browser assets: no
- `www.broey.net` apex redirect: HTTP 301 to `https://broey.net/`

## Dry run

The local command completed successfully with the key available only in the child process environment. It displayed five canonical URLs, declared that no request was sent, and did not print the key.

## Initial live submission

- UTC timestamp: `2026-08-06T18:05:14.537Z`
- URL count: 5
- HTTP status: 202
- Classification: `validation-pending`
- Safe message: IndexNow received the URLs while key validation is pending.
- Retry needed now: no

Submitted URLs:

- `https://broey.net/`
- `https://broey.net/music`
- `https://broey.net/about`
- `https://broey.net/press`
- `https://broey.net/music/free`

## Remaining Bing verification

After Bing processes the accepted submission, confirm in Bing Webmaster Tools that the five priority URLs appear in IndexNow reporting and that key validation is no longer pending. Do not resubmit immediately while the HTTP 202 result is pending.

## Final status

The production key route is live and conforms to IndexNow requirements. The first controlled five-URL submission was accepted with HTTP 202. Production setup and the initial submission are complete; Bing's asynchronous key-validation/reporting confirmation remains pending.
