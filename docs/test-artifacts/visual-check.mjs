import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const ARTIFACT_DIR = 'G:/my-sitess/ThySite/docs/test-artifacts';
const BASE_URL = 'http://127.0.0.1:4321/';
const targets = await fetch('http://127.0.0.1:9223/json/list').then(response =>
  response.json()
);
const target = targets.find(item => item.type === 'page');
if (!target) throw new Error('No Chrome page target available');

const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', reject, { once: true });
});

let nextId = 1;
const pending = new Map();
const eventWaiters = new Map();
socket.addEventListener('message', event => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(JSON.stringify(message.error)));
    else resolve(message.result);
    return;
  }
  const waiters = eventWaiters.get(message.method) ?? [];
  eventWaiters.delete(message.method);
  for (const resolve of waiters) resolve(message.params);
});

function command(method, params = {}) {
  const id = nextId++;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
}

function nextEvent(method) {
  return new Promise(resolve => {
    const waiters = eventWaiters.get(method) ?? [];
    waiters.push(resolve);
    eventWaiters.set(method, waiters);
  });
}

async function navigate(url) {
  const loaded = nextEvent('Page.loadEventFired');
  await command('Page.navigate', { url });
  await loaded;
}

async function reload() {
  const loaded = nextEvent('Page.loadEventFired');
  await command('Page.reload', { ignoreCache: true });
  await loaded;
}

async function evaluate(expression) {
  const result = await command('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text);
  }
  return result.result.value;
}

async function viewport(width, height) {
  await command('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: false,
  });
}

async function capture(name) {
  const result = await command('Page.captureScreenshot', {
    format: 'png',
    fromSurface: true,
    captureBeyondViewport: false,
  });
  await writeFile(join(ARTIFACT_DIR, name), Buffer.from(result.data, 'base64'));
}

const metricsExpression = `(() => {
  const visible = element => Boolean(element && element.getClientRects().length && getComputedStyle(element).visibility !== 'hidden');
  const styleOf = element => {
    if (!element) return null;
    const style = getComputedStyle(element);
    return {
      backgroundColor: style.backgroundColor,
      backgroundImage: style.backgroundImage,
      color: style.color,
      fill: style.fill,
    };
  };
  const wordmark = document.querySelector('a[aria-label="Buckleson home"]');
  const desktopNav = [...document.querySelectorAll('nav a')].filter(visible).map(link => link.textContent.trim()).filter(Boolean);
  const mobileMenu = document.querySelector('button[aria-label="Toggle navigation"]');
  const themeButtons = [...document.querySelectorAll('[data-hs-theme-click-value]')];
  const primaryCta = document.querySelector('main section a.bg-brand-600, section a.bg-brand-600');
  const headingHighlight = document.querySelector('h1 .text-brand-500');
  const star = document.querySelector('svg.text-brand-500');
  const banner = document.querySelector('astro-banner [role="region"] > div');
  const activeNav = document.querySelector('nav a[aria-current="page"]');
  const wordmarkDot = wordmark?.querySelector('.bg-brand-500');
  const heroImage = document.querySelector('section img.scale-110.object-cover');
  const style = getComputedStyle(document.body);
  return {
    innerWidth,
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    noHorizontalOverflow: document.documentElement.scrollWidth <= document.documentElement.clientWidth,
    wordmarkVisible: visible(wordmark),
    wordmarkText: wordmark?.textContent.trim() ?? null,
    visibleNavLabels: desktopNav,
    mobileMenuVisible: visible(mobileMenu),
    visibleThemeButtons: themeButtons.filter(visible).map(button => ({ label: button.getAttribute('aria-label'), value: button.dataset.hsThemeClickValue })),
    dark: document.documentElement.classList.contains('dark'),
    storedTheme: localStorage.getItem('hs_theme'),
    bodyBackground: style.backgroundColor,
    bodyColor: style.color,
    brand500: getComputedStyle(document.documentElement).getPropertyValue('--color-brand-500').trim(),
    primaryCta: styleOf(primaryCta),
    headingHighlight: styleOf(headingHighlight),
    star: styleOf(star),
    banner: styleOf(banner),
    activeNav: styleOf(activeNav),
    wordmarkDot: styleOf(wordmarkDot),
    heroImage: heroImage ? {
      visible: visible(heroImage),
      complete: heroImage.complete,
      naturalWidth: heroImage.naturalWidth,
      currentSrc: heroImage.currentSrc,
    } : null,
  };
})()`;

await command('Page.enable');
await command('Runtime.enable');
await navigate(BASE_URL);
await evaluate(
  `localStorage.setItem('hs_theme', 'default'); localStorage.removeItem('banner-dismissed:dismiss-button')`
);
await reload();

const results = { light: {}, theme: {}, focus: {} };
for (const [name, width, height] of [
  ['mobile', 390, 844],
  ['tablet', 768, 1024],
  ['desktop', 1440, 1000],
]) {
  await viewport(width, height);
  results.light[name] = await evaluate(metricsExpression);
  await capture(`home-light-${name}-${width}x${height}-verified.png`);
}

await viewport(390, 844);
results.light.mobileControls = await evaluate(`(() => {
  const visible = element => Boolean(element && element.getClientRects().length && getComputedStyle(element).visibility !== 'hidden');
  const buttons = [...document.querySelectorAll('button')].map((button, index) => ({ index, label: button.getAttribute('aria-label'), title: button.title, visible: visible(button) }));
  return buttons;
})()`);

await viewport(1440, 1000);
await reload();
await new Promise(resolve => setTimeout(resolve, 200));
await command('Input.dispatchKeyEvent', {
  type: 'keyDown',
  key: 'Tab',
  code: 'Tab',
  windowsVirtualKeyCode: 9,
});
await command('Input.dispatchKeyEvent', {
  type: 'keyUp',
  key: 'Tab',
  code: 'Tab',
  windowsVirtualKeyCode: 9,
});
results.focus = await evaluate(`(() => {
  const element = document.activeElement;
  const style = getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  return {
    tag: element.tagName,
    text: element.textContent.trim(),
    href: element.getAttribute('href'),
    visible: rect.width > 0 && rect.height > 0,
    rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
    outline: style.outline,
    boxShadow: style.boxShadow,
    background: style.backgroundColor,
    color: style.color,
  };
})()`);
await capture('home-focus-visible-desktop-1440x1000.png');
await evaluate(`document.activeElement.blur()`);

await evaluate(
  `document.querySelector('[data-hs-theme-click-value="dark"]').click()`
);
await new Promise(resolve => setTimeout(resolve, 400));
results.theme.darkAfterSwitch = await evaluate(metricsExpression);
await capture('home-dark-desktop-1440x1000.png');
await reload();
results.theme.darkAfterReload = await evaluate(metricsExpression);

await evaluate(
  `document.querySelector('[data-hs-theme-click-value="default"]').click()`
);
await new Promise(resolve => setTimeout(resolve, 400));
results.theme.lightAfterSwitchBack = await evaluate(metricsExpression);
await capture('home-light-restored-desktop-1440x1000.png');
await reload();
results.theme.lightAfterReload = await evaluate(metricsExpression);

const checks = {
  responsiveLight: Object.values(results.light)
    .filter(value => value && !Array.isArray(value))
    .every(
      value =>
        value.noHorizontalOverflow &&
        value.wordmarkVisible &&
        value.visibleThemeButtons.length > 0 &&
        value.bodyBackground === 'rgb(255, 255, 255)' &&
        value.bodyColor === 'rgb(17, 24, 39)' &&
        value.brand500 === '#8f00ff' &&
        value.primaryCta?.backgroundColor === 'rgb(115, 0, 230)' &&
        value.primaryCta?.color === 'rgb(255, 255, 255)' &&
        value.headingHighlight?.color === 'rgb(143, 0, 255)' &&
        value.star?.color === 'rgb(143, 0, 255)' &&
        value.banner?.backgroundColor === 'rgb(115, 0, 230)' &&
        value.banner?.backgroundImage === 'none' &&
        value.activeNav?.color === 'rgb(115, 0, 230)' &&
        value.wordmarkDot?.backgroundColor === 'rgb(143, 0, 255)' &&
        value.heroImage?.visible &&
        value.heroImage?.complete &&
        value.heroImage?.naturalWidth > 0
    ),
  responsiveNavigation:
    results.light.mobile.mobileMenuVisible &&
    results.light.mobile.visibleThemeButtons.length === 1 &&
    results.light.tablet.visibleNavLabels.includes('Home') &&
    results.light.desktop.visibleNavLabels.includes('Contact'),
  darkPreserved:
    results.theme.darkAfterSwitch.dark &&
    results.theme.darkAfterSwitch.storedTheme === 'dark' &&
    results.theme.darkAfterSwitch.bodyBackground === 'oklch(0.269 0 0)' &&
    results.theme.darkAfterSwitch.primaryCta?.backgroundColor ===
      'oklch(0.674 0.2072 39.23)' &&
    results.theme.darkAfterSwitch.headingHighlight?.color ===
      'oklch(0.852 0.199 91.936)' &&
    results.theme.darkAfterSwitch.star?.color === 'oklch(0.852 0.199 91.936)' &&
    results.theme.darkAfterSwitch.banner?.backgroundImage.includes(
      'banner-pattern.svg'
    ) &&
    results.theme.darkAfterSwitch.banner?.backgroundColor ===
      'oklch(0.922 0 0)' &&
    results.theme.darkAfterSwitch.activeNav?.color ===
      'oklch(0.7072 0.182 40.56)' &&
    results.theme.darkAfterSwitch.wordmarkDot?.backgroundColor ===
      'oklch(0.852 0.199 91.936)' &&
    results.theme.darkAfterReload.dark &&
    results.theme.darkAfterReload.storedTheme === 'dark',
  lightRestored:
    !results.theme.lightAfterSwitchBack.dark &&
    results.theme.lightAfterSwitchBack.storedTheme === 'default' &&
    results.theme.lightAfterSwitchBack.bodyBackground ===
      'rgb(255, 255, 255)' &&
    results.theme.lightAfterSwitchBack.primaryCta?.backgroundColor ===
      'rgb(115, 0, 230)' &&
    !results.theme.lightAfterReload.dark &&
    results.theme.lightAfterReload.storedTheme === 'default',
  focusVisible:
    results.focus.visible &&
    results.focus.text === 'Skip to content' &&
    (results.focus.outline !== 'none' || results.focus.boxShadow !== 'none'),
};
results.checks = checks;

await writeFile(
  join(ARTIFACT_DIR, 'visual-check-results.json'),
  JSON.stringify(results, null, 2)
);
console.log(JSON.stringify(results, null, 2));
socket.close();
if (Object.values(checks).some(value => !value)) process.exitCode = 1;
