# Chrome Web Store listing

Copy-paste material for the [developer dashboard](https://chrome.google.com/webstore/devconsole). The images are in this folder; their sources are in `src/` (`npm run assets` re-renders them).

## Package tab

Upload `dist/straight-to-chat-<version>.zip` (built by `npm run zip`). The name and summary come from the package:

- **Name:** Straight to Chat — AI New Tab
- **Summary:** ChatGPT or Claude in every new tab, while your cursor stays in the address bar. Open source, no tracking.

## Store listing tab

**Description (English)**

```text
Your AI chat in every new tab, and your cursor stays in the address bar.

Straight to Chat opens ChatGPT or Claude (or any site you choose) every time you open a new tab. Unlike redirect extensions, it keeps the cursor in the address bar: type a search or a URL right away as usual, or click into the chat to ask something.

WHY YOU'LL LIKE IT
• The address bar keeps the cursor: search or type a URL instantly, like Chrome's default new tab.
• Your real chat: the actual chatgpt.com or claude.ai, with your account, history, projects, voice mode and file uploads. Not a wrapper, no API key.
• Fast: no framework, a few kilobytes. The site starts loading the moment the tab opens, over the background color it uses itself.
• ChatGPT, Claude or any URL, switched in one click from the toolbar icon. Custom URLs work for specific pages too: a project, a custom GPT, a self-hosted chat on localhost.
• Tabs show your conversation's title.
• Private: no analytics, no ads, no remote code, no server. Open source (MIT).

GOOD TO KNOW
• Sign in once in a regular tab: sign-in pages can't load inside another page. The new tab then uses your usual session.
• Claude artifact previews and ChatGPT canvas previews run in the sites' own sandboxes and stay blank inside the new tab. Open the chat in a regular tab, or turn off "Keep the cursor in the address bar" in the options.
• Chrome adds a small footer to new tab pages provided by extensions. Right-click it to hide it.

HOW IT WORKS
The extension's new tab page shows the chosen site in a full-page frame. To allow that, it removes the site's X-Frame-Options and Content-Security-Policy headers for that frame, only inside the extension's own new tab: never in your regular tabs, and never when another website tries to embed these sites.

Source code, permissions explained, privacy policy: https://github.com/BlaisedEstais/straight-to-chat

Straight to Chat is an independent project, not affiliated with OpenAI or Anthropic. ChatGPT is a trademark of OpenAI. Claude is a trademark of Anthropic.
```

**Description (French)**: add it under *Store listing → Language: French*.

```text
Votre chat IA dans chaque nouvel onglet, et le curseur reste dans la barre d'adresse.

Straight to Chat ouvre ChatGPT ou Claude (ou le site de votre choix) à chaque nouvel onglet. Contrairement aux extensions de redirection, le curseur reste dans la barre d'adresse : tapez une recherche ou une URL tout de suite, comme d'habitude, ou cliquez dans le chat pour poser une question.

POURQUOI VOUS ALLEZ L'ADOPTER
• Le curseur reste dans la barre d'adresse : recherche ou URL immédiatement, comme avec le nouvel onglet par défaut de Chrome.
• Votre vrai chat : le vrai chatgpt.com ou claude.ai, avec votre compte, votre historique, vos projets, le mode vocal et l'envoi de fichiers. Pas un intermédiaire, pas de clé API.
• Rapide : aucun framework, quelques kilo-octets. Le site commence à charger dès l'ouverture de l'onglet, sur la couleur de fond qu'il utilise lui-même.
• ChatGPT, Claude ou n'importe quelle URL, en un clic depuis l'icône de la barre d'outils. Les URL personnalisées acceptent aussi des pages précises : un projet, un GPT personnalisé, un chat auto-hébergé sur localhost.
• L'onglet affiche le titre de votre conversation.
• Respect de la vie privée : aucune statistique, aucune pub, aucun code distant, aucun serveur. Open source (MIT).

BON À SAVOIR
• Connectez-vous une fois dans un onglet normal : les pages de connexion ne peuvent pas s'afficher dans une autre page. Le nouvel onglet utilise ensuite votre session habituelle.
• Les aperçus d'artefacts de Claude et les aperçus canvas de ChatGPT tournent dans les bacs à sable des sites et restent vides dans le nouvel onglet. Ouvrez la conversation dans un onglet normal, ou désactivez « Garder le curseur dans la barre d'adresse » dans les options.
• Chrome ajoute un petit pied de page aux nouveaux onglets fournis par une extension : clic droit dessus pour le masquer.

COMMENT ÇA MARCHE
La page Nouvel onglet de l'extension affiche le site choisi dans un cadre plein écran. Pour cela, elle retire les en-têtes X-Frame-Options et Content-Security-Policy du site pour ce cadre, uniquement dans le nouvel onglet de l'extension : jamais dans vos onglets normaux, et jamais quand un autre site web essaie d'intégrer ces sites.

Code source, permissions expliquées, politique de confidentialité : https://github.com/BlaisedEstais/straight-to-chat

Straight to Chat est un projet indépendant, non affilié à OpenAI ni à Anthropic. ChatGPT est une marque d'OpenAI. Claude est une marque d'Anthropic.
```

- **Category:** Productivity → Tools
- **Store icon:** `icon-128.png`
- **Screenshots (1280×800):** `screenshot-1.png`, `screenshot-2.png`, `screenshot-3.png`
- **Small promo tile (440×280):** `promo-small.png`
- **Marquee promo tile (1400×560):** `promo-marquee.png`
- **Homepage URL:** https://github.com/BlaisedEstais/straight-to-chat

## Privacy practices tab

**Single purpose**

```text
Replaces Chrome's new tab page with the AI chat site the user picks (ChatGPT, Claude or a custom URL), shown inside the new tab so the address bar keeps keyboard focus.
```

**Permission justifications**

- **declarativeNetRequestWithHostAccess**

  ```text
  chatgpt.com and claude.ai send X-Frame-Options / Content-Security-Policy headers that prevent them from being displayed inside the extension's new tab page. A dynamic rule removes these two response headers only for sub_frame requests to the chosen site whose top-level frame is the extension's own new tab page (condition topDomains = the extension's ID). The headers are untouched in regular tabs and when other websites embed these sites.
  ```

- **storage**

  ```text
  Saves the user's choice of new tab site and the "keep the cursor in the address bar" option.
  ```

- **Host permissions**

  ```text
  https://chatgpt.com/* and https://claude.ai/*: needed to display the site the user picked inside the new tab (the header rule only applies to sites the extension has access to), and for a content script that reads the page title, icon and background color so the tab shows the conversation name (kept on the device, never transmitted). Optional https://*/* and http://*/*: requested at runtime only for the single site the user enters as a custom new tab URL, and given back when they switch away from it.
  ```

- **Remote code:** No, I am not using remote code.

**Data usage**

- **Website content:** checked. Only the page title, icon and background color of the chosen chat site, read on the device to label the tab and paint the next new tab. Never transmitted, sold or shared.
- Leave every other data type unchecked.
- Certify all three statements (no selling or transfer of user data, no unrelated use, no creditworthiness or lending use).
- **Privacy policy URL:** https://github.com/BlaisedEstais/straight-to-chat/blob/main/PRIVACY.md

## Distribution tab

- **Visibility:** Public
- **Regions:** All regions
