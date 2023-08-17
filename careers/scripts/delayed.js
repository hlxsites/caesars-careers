import { sampleRUM } from './lib-franklin.js';

// Core Web Vitals RUM collection
sampleRUM('cwv');

const adobeLaunchDev = 'https://assets.adobedtm.com/6a2d3120441b/542932800399/launch-EN626eef28bcaf48c888ab0f5892b90510-development.min.js';
const adobeLaunchStage = 'https://assets.adobedtm.com/6a2d3120441b/542932800399/launch-EN2a6f725268ea4ce5be8f4ae9f41c2ee7-staging.min.js';
const adobeLaunchProd = 'https://assets.adobedtm.com/6a2d3120441b/542932800399/launch-ENc8ccf2ef24a24a7a93d1dfb757ad2f96.min.js';

function loadScript(url, attrs, body) {
  const head = document.querySelector('head');
  const script = document.createElement('script');
  if (url) script.src = url;
  if (attrs) {
    // eslint-disable-next-line no-restricted-syntax, guard-for-in
    for (const attr in attrs) {
      script.setAttribute(attr, attrs[attr]);
    }
  }
  if (body) {
    script.type = 'text/javascript';
    script.text = body;
  }

  head.append(script);
  return script;
}

// for YouTube videos
if (document.querySelector('[data-ytid]')) {
  loadScript('https://www.youtube.com/iframe_api', {
    type: 'text/javascript',
  });
}

// Add Adobe Launch
if (window.location.host.startsWith('localhost')
    || window.location.host.endsWith('.page')) {
  loadScript(adobeLaunchDev);
} else if (window.location.host.endsWith('.live')
            || window.location.host.startsWith('stage')) {
  loadScript(adobeLaunchStage);
} else if (window.location.host.endsWith('caesars.com')) {
  loadScript(adobeLaunchProd);
}

// Add Google Tag Manager
const gtmIframe = document.createElement('iframe');
gtmIframe.classList.add('gtm-iframe');
gtmIframe.src = 'https://www.googletagmanager.com/ns.html?id=GTM-QRNS';
const gtmEl = document.createElement('noscript');
gtmEl.append(gtmIframe);
document.body.prepend(gtmEl);

const gtmCode = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
  new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
  'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
  })(window,document,'script','dataLayer','GTM-QRNS');`;

loadScript('', {}, gtmCode);

// Adobe Target
window.targetGlobalSettings = {
  bodyHidingEnabled: false,
};
