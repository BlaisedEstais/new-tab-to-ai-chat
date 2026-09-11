# Publishing to the Chrome Web Store

Everything the listing needs is in this folder: [`listing.md`](listing.md) for the text, the PNGs for the images. A few steps can only be done by the account owner:

1. **Developer account (one-time).** Open the [Chrome Web Store developer dashboard](https://chrome.google.com/webstore/devconsole) with the Google account that will own the listing, accept the developer agreement and pay the one-time US$5 registration fee. The account needs 2-Step Verification.
   - The listing shows a publisher name and a contact email: set a display name and, if you like, a dedicated contact email in the dashboard's *Account* page.
   - For the EU trader declaration, a free hobby extension is **non-trader**.
2. **Build the package:** `npm run zip` → `dist/straight-to-chat-<version>.zip`.
3. **Dashboard → New item →** upload the zip.
4. Fill in the **Store listing**, **Privacy practices** and **Distribution** tabs from [`listing.md`](listing.md), and upload the images.
5. **Submit for review.** It usually takes a few days. Extensions that modify response headers or declare broad optional host permissions (used here only for the custom URL) can get a closer look: the justifications in `listing.md` explain how narrowly both are scoped.
6. Once it's live, add the store link to the README's *Install* section and to the repository's About box.

**Updating:** bump `version` in `extension/manifest.json`, run `npm run zip`, then in the dashboard: *Package → Upload new package → Submit for review*.
