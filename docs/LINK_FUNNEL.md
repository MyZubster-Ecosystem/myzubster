# MyZubster Link Funnel

Tracked entry point: `/funnel.html`.

## Funnel

Community/social/email/GitHub -> tracked link -> MyZubster -> Zorgax/Marketplace/MYZ/Payments/LIFE -> conversion.

## Ready-to-share links

- Facebook -> Zorgax: `https://www.myzubster.com/funnel.html?source=facebook&utm_medium=social&utm_campaign=community-funnel&to=zorgax`
- Telegram -> Zorgax: `https://www.myzubster.com/funnel.html?source=telegram&utm_medium=social&utm_campaign=community-funnel&to=zorgax`
- GitHub -> Home: `https://www.myzubster.com/funnel.html?source=github&utm_medium=opensource&utm_campaign=community-funnel&to=home`
- DEV.to -> Zorgax: `https://www.myzubster.com/funnel.html?source=devto&utm_medium=content&utm_campaign=community-funnel&to=zorgax`
- Email -> LIFE/Zorgax: `https://www.myzubster.com/funnel.html?source=email&utm_medium=outreach&utm_campaign=life-pilots&to=life`
- LIFE partners -> Zorgax: `https://www.myzubster.com/funnel.html?source=life&utm_medium=partner&utm_campaign=life-pilots&to=zorgax`
- Community -> Marketplace: `https://www.myzubster.com/funnel.html?source=community&utm_medium=social&utm_campaign=marketplace&to=marketplace`
- Community -> MYZ: `https://www.myzubster.com/funnel.html?source=community&utm_medium=social&utm_campaign=myz&to=myz`
- Community -> Payments: `https://www.myzubster.com/funnel.html?source=community&utm_medium=social&utm_campaign=monetization&to=payments`

## Measurement

The funnel entry page emits the Vercel custom event `funnel_entry` with `source`, `medium`, `campaign`, and `destination`. The destination receives matching UTM parameters. `public/funnel.js` can be loaded on product pages to emit `zorgax_open`, `marketplace_open`, `monetization_open`, `pilot_open`, and generic `link_click` events.

Do not put personal data, email addresses, wallet addresses, or secrets in UTM parameters or analytics events.
