import { sampleRUM } from './lib-franklin.js';
// eslint-disable-next-line import/no-cycle
import { loadScript } from './scripts.js';

// Core Web Vitals RUM collection
sampleRUM('cwv');

// add more delayed functionality here
// for YouTube videos
// if (document.querySelector('[data-ytid]')) {
//   loadScript('https://www.youtube.com/iframe_api', {
//     type: 'text/javascript',
//   });
// }
