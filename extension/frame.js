// Content script for the embedded chat site.
// It does nothing unless the page is framed directly by this extension's new tab. Then it only reads the
// page's title, icon and background color, so the tab can show the conversation name and the next new tab
// can paint the right color before the site loads. It never reads your chats.
(() => {
  const extensionOrigin = new URL(chrome.runtime.getURL('/')).origin;
  const embeddedByUs =
    window !== window.top &&
    window.parent === window.top &&
    location.ancestorOrigins?.[0] === extensionOrigin;
  if (!embeddedByUs) return;

  const background = () => {
    for (const el of [document.body, document.documentElement]) {
      const color = el && getComputedStyle(el).backgroundColor;
      if (color && color !== 'rgba(0, 0, 0, 0)' && color !== 'transparent') return color;
    }
    return '';
  };

  let last = '';
  let pending = 0;
  const report = () => {
    pending = 0;
    const page = {
      type: 'straight-to-chat:page',
      title: document.title,
      icon: document.querySelector('link[rel~="icon"]')?.href || '',
      bg: background(),
    };
    const state = JSON.stringify(page);
    if (state === last) return;
    last = state;
    window.parent.postMessage(page, extensionOrigin);
  };

  report();
  // Chat apps touch <head> often: batch the checks (a timer, unlike animation frames, also runs in
  // background tabs, whose titles still show in the tab strip).
  new MutationObserver(() => (pending ||= setTimeout(report, 50))).observe(document.head, {
    subtree: true,
    childList: true,
    characterData: true,
    attributeFilter: ['href'],
  });
})();
