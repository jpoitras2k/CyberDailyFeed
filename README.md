# Cyber Daily Feed

Mobile-first cybersecurity headline aggregator for defenders. Forked in *architecture* from Daily Trove (RSS in, on-device preferences, headline list, link-out) and retargeted for cybersecurity. This repository started empty — Daily Trove source was not present here — so the core is implemented from that architecture rather than copied file-for-file.

The app shows **headline, source, threat tags, and a link to the original article**. It does not store or render full article text.

## What shipped in this scaffold

1. **Sources** — official RSS endpoints for Dark Reading, The Hacker News, Bleeping Computer, Krebs on Security, and CISA Cybersecurity Advisories.
2. **24-hour freshness window** — every item needs a published timestamp; anything older than 24 hours is dropped from the default view. The list re-applies that cutoff every minute and re-fetches feeds every 15 minutes.
3. **Threat-category tags** instead of bias labels: ransomware, data breach, vulnerability/patch, nation-state, phishing. Filter chips live on the Today screen; selections persist on-device.
4. **On-device preferences** — keywords + tag filters in `localStorage` (`cyberdailyfeed.preferences.v1`). No account. No server-side personal data collection.
5. **Licensing posture** — headline + link only, including Krebs (no full-text republishing).

## Project layout

```
src/core/          RSS parse, freshness, tagging, ingest pipeline (no UI)
src/platform/      local storage, link-out, dev-proxy URL helper
src/ui/            Today feed + Interests screens
tests/             fixture-backed parser and freshness tests
public/privacy.html  Play Console-ready privacy policy page
```

Android packaging uses Capacitor (`ai.skylocity.cyberdailyfeed`). Generate the native project with `npx cap add android` after installing the Android SDK.

## Confirm ingestion before the UI

```bash
npm install
npm test          # RSS parse, 24h filter, tagging, CISA HTML fallback
npm run ingest:live
```

`ingest:live` hits the official endpoints and prints today's surviving headlines. CISA's XML is often blocked by CDN bot protection from datacenter IPs; the app then tries the public advisories listing and otherwise degrades without failing the whole feed.

## Run the app (web preview)

```bash
npm run dev
```

The Vite dev server proxies RSS so the browser can ingest despite CORS. Capacitor/Android builds fetch the publisher URLs directly.

## Play Store next steps (not done in this PR)

- Host `public/privacy.html` at a stable HTTPS URL (GitHub Pages or [skylocity.ai](https://skylocity.ai))
- Paste that URL into Play Console
- Developer contact **email** is required. Reuse `jpoitras2k@gmail.com` until a `privacy@skylocity.ai` mailbox exists. The website field can be `https://skylocity.ai` even while that site is still “launching soon.”

## Assumptions (adjust anytime)

- Display name: **Cyber Daily Feed** (repo: CyberDailyFeed)
- Strict rolling 24-hour window, so Krebs (and sometimes Dark Reading) may show zero items on a quiet day
- Tagging is on-device keyword heuristics on the **headline**, not a model
- An article may carry multiple tags
- Android first; iOS can share this Capacitor web layer later
