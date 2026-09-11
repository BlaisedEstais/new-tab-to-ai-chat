# Chrome Web Store listing

Copy-paste material for the [developer dashboard](https://chrome.google.com/webstore/devconsole), in the order of its tabs. The images are in this folder (French screenshots in `fr/`); their sources are in `src/` (`npm run capture` then `npm run assets` re-renders them).

## Package

Upload `dist/new-tab-to-ai-chat-<version>.zip` (built by `npm run zip`). The title and the summary come from the package and can't be edited in the dashboard:

- **Title:** New Tab to AI Chat (French listing: New Tab to AI Chat — Nouvel onglet IA)
- **Summary:** Chrome's new tab opens Claude, ChatGPT, Gemini or any other site directly, while your cursor stays in the address bar.

## Store listing

**Description, English**

```text
Every new tab opens your AI chat: Claude, ChatGPT, Gemini or any site you choose. And your cursor stays in the address bar, so you can still search Google or type a URL right away.

Make AI part of your routine: press ⌘T / Ctrl+T and ask your AI a real question, or just type in the address bar for a quick search or to go straight to a site, like before.

WHY YOU'LL LIKE IT
• Your cursor stays in the address bar: search or type a URL instantly, like with Chrome's default new tab.
• Your real chat: the actual claude.ai, chatgpt.com or gemini.google.com, with your account, history, sidebar, projects, voice mode and file uploads. Not a wrapper, no API key.
• Fast: a few kilobytes, no framework. The site starts loading the moment the tab opens, over its own background color (no white flash).
• Claude, ChatGPT, Gemini or any URL, switched in one click from the toolbar icon. One-click suggestions for Grok, Perplexity, Le Chat, DeepSeek and Copilot. Custom URLs work for specific pages too: a project, a custom GPT, a self-hosted chat.
• Tabs show your conversation's title.
• English or French interface.

PRIVACY
Zero tracking. The extension lives entirely in your browser: no account, no server, no analytics, no ads. Nothing is ever sent to the developer or to anyone else. It's open source (MIT): every line is on GitHub.

GOOD TO KNOW
• Sign in once in a regular tab: sign-in pages can't load inside another page. The new tab then uses your usual session.
• Claude artifact previews and ChatGPT canvas previews stay blank inside the new tab (they run in the sites' own sandboxes). Open the chat in a regular tab, or turn off "Keep the cursor in the address bar".
• Chrome adds a small footer to new tab pages provided by extensions. Right-click it to hide it.

HOW IT WORKS
The extension's new tab page shows the chosen site in a full-page frame. To allow that, it removes the site's X-Frame-Options and Content-Security-Policy headers for that frame only, inside the extension's own new tab: never in your regular tabs, and never when another website tries to embed these sites. For Claude and ChatGPT, it also lets the site read its own preference cookies inside the new tab (cookie consent, sidebar state), without ever touching session cookies.

Website and privacy policy: https://blaisedestais.github.io/new-tab-to-ai-chat/
Source code: https://github.com/BlaisedEstais/new-tab-to-ai-chat

New Tab to AI Chat is an independent project, not affiliated with Anthropic, OpenAI or Google. Claude is a trademark of Anthropic, ChatGPT of OpenAI and Gemini of Google.
```

**Description, French** (add French as a language of the listing, then paste this)

```text
Chaque nouvel onglet ouvre votre chat IA : Claude, ChatGPT, Gemini ou le site de votre choix. Et le curseur reste dans la barre d'adresse : vous pouvez toujours lancer une recherche Google ou taper une URL immédiatement.

Faites de l'IA un réflexe : ⌘T / Ctrl+T et vous posez une vraie question à votre IA, ou vous tapez simplement dans la barre d'adresse pour une recherche rapide ou pour aller directement sur un site, comme avant.

POURQUOI VOUS ALLEZ L'ADOPTER
• Le curseur reste dans la barre d'adresse : recherche ou URL immédiatement, comme avec le nouvel onglet par défaut de Chrome.
• Votre vrai chat : le vrai claude.ai, chatgpt.com ou gemini.google.com, avec votre compte, votre historique, la barre latérale, vos projets, le mode vocal et l'envoi de fichiers. Pas un intermédiaire, pas de clé API.
• Rapide : quelques kilo-octets, aucun framework. Le site commence à charger dès l'ouverture de l'onglet, sur sa propre couleur de fond (pas de flash blanc).
• Claude, ChatGPT, Gemini ou n'importe quelle URL, en un clic depuis l'icône de la barre d'outils. Suggestions en un clic pour Grok, Perplexity, Le Chat, DeepSeek et Copilot. Les URL personnalisées acceptent aussi des pages précises : un projet, un GPT personnalisé, un chat auto-hébergé.
• L'onglet affiche le titre de votre conversation.
• Interface en français ou en anglais.

CONFIDENTIALITÉ
Zéro pistage. L'extension vit entièrement dans votre navigateur : pas de compte, pas de serveur, pas de statistiques, pas de pub. Rien n'est jamais envoyé au développeur ni à personne. Elle est open source (MIT) : chaque ligne est sur GitHub.

BON À SAVOIR
• Connectez-vous une fois dans un onglet normal : les pages de connexion ne peuvent pas s'afficher dans une autre page. Le nouvel onglet utilise ensuite votre session habituelle.
• Les aperçus d'artefacts de Claude et les aperçus canvas de ChatGPT restent vides dans le nouvel onglet (ils tournent dans les bacs à sable des sites). Ouvrez la conversation dans un onglet normal, ou désactivez « Garder le curseur dans la barre d'adresse ».
• Chrome ajoute un petit pied de page aux nouveaux onglets fournis par une extension : clic droit dessus pour le masquer.

COMMENT ÇA MARCHE
La page Nouvel onglet de l'extension affiche le site choisi dans un cadre plein écran. Pour cela, elle retire les en-têtes X-Frame-Options et Content-Security-Policy du site pour ce cadre uniquement, dans le nouvel onglet de l'extension : jamais dans vos onglets normaux, et jamais quand un autre site web essaie d'intégrer ces sites. Pour Claude et ChatGPT, elle permet aussi au site de relire ses propres cookies de préférences dans le nouvel onglet (consentement aux cookies, barre latérale), sans jamais toucher aux cookies de session.

Site et politique de confidentialité : https://blaisedestais.github.io/new-tab-to-ai-chat/
Code source : https://github.com/BlaisedEstais/new-tab-to-ai-chat

New Tab to AI Chat est un projet indépendant, non affilié à Anthropic, OpenAI ni Google. Claude est une marque d'Anthropic, ChatGPT d'OpenAI et Gemini de Google.
```

- **Category:** Productivity → Tools (Productivité → Outils)
- **Language:** English, plus French

**Graphic assets**

- **Store icon:** `icon-128.png`
- **Global (international) screenshots**, used for every language without its own set: `screenshot-1.png`, `screenshot-2.png`, `screenshot-3.png`
- **Localized screenshots:** English: the same three. French: `fr/screenshot-1.png`, `fr/screenshot-2.png`, `fr/screenshot-3.png`
- **Small promo tile (440×280):** `promo-small.png`
- **Marquee promo tile (1400×560):** `promo-marquee.png`

**Additional fields**

- **Official URL:** none (it requires a domain verified in Google Search Console)
- **Homepage URL:** https://blaisedestais.github.io/new-tab-to-ai-chat/
- **Support URL:** https://github.com/BlaisedEstais/new-tab-to-ai-chat/issues

## Privacy practices (Pratiques de confidentialité)

**Single purpose (Objectif unique)**

```text
Replaces Chrome's new tab page with the AI chat site the user picks (Claude, ChatGPT, Gemini or a custom URL), shown inside the new tab so the address bar keeps keyboard focus.
```

**Permission justifications (Justification des autorisations)**

- **declarativeNetRequestWithHostAccess**

  ```text
  The chat sites send X-Frame-Options / Content-Security-Policy headers that prevent them from being displayed inside the extension's new tab page. A dynamic rule removes these two response headers only for sub_frame requests to the chosen site whose top-level frame is the extension's own new tab page (condition topDomains = the extension's ID). The headers are untouched in regular tabs and when other websites embed these sites.
  ```

- **cookies**

  ```text
  Inside the new tab frame, Chrome hides claude.ai's and chatgpt.com's own SameSite=Lax cookies from their JavaScript, so the sites lose preferences such as cookie consent and the sidebar state. For these two sites only, the extension sets SameSite=None on the cookies their JavaScript can read (never on HttpOnly cookies such as the session). It never reads cookie values for its own use and never transmits them.
  ```

- **storage**

  ```text
  Saves the user's settings: new tab site, "keep the cursor in the address bar" option, interface language.
  ```

- **Host permissions (Autorisation d'accès à l'hôte)**

  ```text
  https://claude.ai/*, https://chatgpt.com/* and https://gemini.google.com/*: needed to display the site the user picked inside the new tab (the header rule only applies to sites the extension has access to), for a content script that reads the page title, icon and background color so the tab shows the conversation name (kept on the device, never transmitted), and for the cookie adjustment described above (claude.ai and chatgpt.com only). Optional https://*/* and http://*/*: requested at runtime only for the single site the user enters as a custom new tab URL, and given back when they switch away from it.
  ```

- **Remote code (Code distant):** No, I am not using remote code.

**Data usage (Utilisation des données)**

- **Website content (Contenu du site Web):** checked. Only the page title, icon and background color of the chosen chat site, read on the device to label the tab and paint the next new tab. Never transmitted, sold or shared.
- Leave every other data type unchecked.
- Certify all three statements (no selling or transfer of user data, no unrelated use, no creditworthiness or lending use).
- **Privacy policy URL (URL des règles de confidentialité):** https://blaisedestais.github.io/new-tab-to-ai-chat/privacy.html

## Distribution

- **Visibility:** Public
- **Regions:** All regions
