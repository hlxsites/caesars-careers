import { sampleRUM } from './lib-franklin.js';
// eslint-disable-next-line import/no-cycle
import { loadScript } from './scripts.js';

// Core Web Vitals RUM collection
sampleRUM('cwv');

const adobeLaunchDev = 'https://assets.adobedtm.com/6a2d3120441b/542932800399/launch-EN626eef28bcaf48c888ab0f5892b90510-development.min.js';
const adobeLaunchStage = 'https://assets.adobedtm.com/6a2d3120441b/542932800399/launch-EN2a6f725268ea4ce5be8f4ae9f41c2ee7-staging.min.js';
const adobeLaunchProd = 'https://assets.adobedtm.com/6a2d3120441b/542932800399/launch-ENc8ccf2ef24a24a7a93d1dfb757ad2f96.min.js';

if (window.location.host.startsWith('localhost')) {
  loadScript(adobeLaunchDev);
} else if (window.location.host.endsWith('.page') || window.location.host.endsWith('.live')) {
  loadScript(adobeLaunchStage);
} else if (window.location.host.endsWith('caesars.com')) {
  loadScript(adobeLaunchProd);
}

// add more delayed functionality here
// for YouTube videos
if (document.querySelector('[data-ytid]')) {
  loadScript('https://www.youtube.com/iframe_api', {
    type: 'text/javascript',
  });
}
