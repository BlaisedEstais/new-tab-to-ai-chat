// Runs inside chatgpt.com and claude.ai, in the page's own JavaScript world, and only when the page is shown
// inside this extension's new tab (newtab.js names that frame "new-tab-to-ai-chat").
// There, Chrome treats the page's script cookie access as third-party: cookies it writes with the default
// SameSite=Lax are silently dropped, so choices like cookie consent or the sidebar state never stick.
// Written from here, the page's cookies are marked SameSite=None; Secure instead, so it can keep them.
(() => {
  if (window.name !== 'new-tab-to-ai-chat' || window === window.top || window.parent !== window.top) return;
  if (!location.ancestorOrigins?.[0]?.startsWith('chrome-extension://')) return;

  const relax = (cookie) =>
    String(cookie)
      .split(';')
      .filter((part, i) => i === 0 || !/^\s*(samesite|secure)\s*(=|$)/i.test(part))
      .join(';') + '; SameSite=None; Secure';

  const native = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie');
  Object.defineProperty(Document.prototype, 'cookie', {
    configurable: true,
    enumerable: native.enumerable,
    get() {
      return native.get.call(this);
    },
    set(value) {
      native.set.call(this, relax(value));
    },
  });

  const set = globalThis.CookieStore?.prototype.set;
  if (set) {
    CookieStore.prototype.set = function (nameOrOptions, value) {
      const options = typeof nameOrOptions === 'object' ? nameOrOptions : { name: nameOrOptions, value };
      return set.call(this, { ...options, sameSite: 'none' });
    };
  }
})();
