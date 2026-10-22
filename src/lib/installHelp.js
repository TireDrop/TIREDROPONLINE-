/**
 * What kind of device and browser a visitor has, for the "Add to Home Screen"
 * button (src/components/app/AddToHomeButton.jsx). Pure: pass a navigator-like
 * object, so the unit test runs it under Node with sample user agents.
 *
 *   platform  "ios" | "android" | "desktop"
 *   browser   "safari" | "chrome" | "inapp" | "other"
 *
 * Why it matters: no website can open the iPhone's "Add to Home Screen" sheet
 * for the visitor (Apple allows only the visitor's own tap on Safari's Share
 * button), while Android and desktop Chrome and Edge hand the site a real
 * install dialog. Inside another app's browser (Facebook, Instagram...) a
 * page cannot be added at all, so the visitor is sent to their own browser.
 */

const IN_APP = /FBAN|FBAV|Instagram|Line\/|Snapchat|GSA|Twitter|TikTok|MicroMessenger|Pinterest|LinkedInApp/i;

export function deviceKind(nav = typeof navigator === "undefined" ? null : navigator) {
  const ua = nav?.userAgent || "";
  const ios = /iPad|iPhone|iPod/.test(ua) || (nav?.platform === "MacIntel" && (nav?.maxTouchPoints || 0) > 1);
  const android = /Android/i.test(ua);
  const platform = ios ? "ios" : android ? "android" : "desktop";
  let browser = "other";
  if (IN_APP.test(ua)) browser = "inapp";
  else if (ios) browser = /CriOS|FxiOS|EdgiOS|OPiOS/.test(ua) ? "other" : /Safari/.test(ua) ? "safari" : "other";
  else if (/Chrome|CriOS|Edg\//.test(ua) && !/OPR\/|SamsungBrowser/.test(ua)) browser = "chrome";
  return { platform, browser, ios, android };
}

/**
 * The steps to show when the browser has no install dialog to open, or for
 * iPhone where there never is one. Each step is { text, icon } with `icon`
 * naming a drawing the component knows ("share", "menu", "add", "none").
 */
export function installSteps({ platform, browser }) {
  if (browser === "inapp") {
    return {
      title: "Open TireDrop in your browser first",
      steps: [
        { text: platform === "ios" ? "Tap the menu in this app and choose Open in Safari." : "Tap the menu in this app and choose Open in Chrome (or Open in browser).", icon: "menu" },
        { text: "When tiredroponline.com opens in your browser, tap Add to Home Screen again.", icon: "none" },
      ],
    };
  }
  if (platform === "ios") {
    return {
      title: "Add TireDrop to your Home Screen",
      steps: [
        { text: "Tap the Share button: the square with an arrow, at the bottom of Safari (top right on an iPad).", icon: "share" },
        { text: "Scroll down and tap Add to Home Screen.", icon: "add" },
        { text: "Tap Add. TireDrop is now on your Home Screen.", icon: "none" },
      ],
    };
  }
  if (platform === "android") {
    return {
      title: "Add TireDrop to your Home screen",
      steps: [
        { text: "Tap the menu: the three dots at the top right of your browser.", icon: "menu" },
        { text: "Tap Install app, or Add to Home screen.", icon: "add" },
        { text: "Tap Install or Add. TireDrop is now on your Home screen.", icon: "none" },
      ],
    };
  }
  return {
    title: "Install TireDrop on this computer",
    steps: [
      { text: "In Chrome or Edge, look for the install icon at the right end of the address bar and click it.", icon: "add" },
      { text: "Or open the browser menu and choose Install TireDrop, or Save and share, then Install page as app.", icon: "menu" },
      { text: "In Safari on a Mac, choose File, then Add to Dock.", icon: "none" },
    ],
  };
}
