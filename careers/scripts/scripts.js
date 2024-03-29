import {
  sampleRUM,
  loadHeader,
  loadFooter,
  decorateButtons,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForLCP,
  loadBlocks,
  loadCSS,
  readBlockConfig,
} from './lib-franklin.js';

// placeholder change

const LCP_BLOCKS = ['carousel']; // add your LCP blocks to the list

const ADDITIONAL_SCRIPT_IMPORT_DELAY_MS = 5000;

/**
 * Read and return a configuration object for a block that contains both config
 * values and content. Config values can be in the first row or multiple
 * rows. When using multiple rows there must be a blank row between config and content.
 * Config rows will also be remove from the block to allow further decoration of the
 * content only.
 *
 * @param block A block to extract config from
 */
export function readBlockConfigWithContent(block) {
  const configBlock = document.createElement('div');
  const allRows = [...block.querySelectorAll(':scope>div')];
  allRows.every((row) => {
    if (row.children) {
      const cols = [...row.children];
      const isConfigRow = !!cols[1]
        && cols[0].hasChildNodes()
        && cols[0].firstChild.nodeType === Node.TEXT_NODE
        && cols[0].children.length === 0;
      if (isConfigRow) {
        configBlock.append(row);
        return true;
      }
    }
    if (row.children.length === 1 && row.firstElementChild.textContent.trim().length === 0) {
      block.removeChild(row);
    }
    return false;
  });
  const configObj = readBlockConfig(configBlock);
  Object.entries(configObj).forEach(([key, value]) => {
    const numericValue = Number(value);
    if (Number.isNaN(numericValue)) {
      configObj[key] = value;
    } else {
      configObj[key] = Number(value);
    }
  });
  return configObj;
}

/**
 * Build the preview of a text with ellipsis
 * @param {String} text Text that will be shortened
 * @param {Integer} width Width of container
 * @param {Integer} maxVisibleLines Max visible lines allowed
 * @param {*} suffix Suffix to use for ellipsis
 *  (will make sure text+ellipsis fit in `maxVisibleLines`)
 * @param {*} options Text styling option
 *
 * @return The ellipsed text (without ellipsis suffix)
 */
export function buildEllipsis(text, width, maxVisibleLines, suffix, options = {}) {
  const canvas = buildEllipsis.canvas || (buildEllipsis.canvas = document.createElement('canvas'));
  const context = canvas.getContext('2d');

  Object.entries(options).forEach(([key, value]) => {
    if (key in context) {
      context[key] = value;
    }
  });

  const words = text.split(' ');
  let testLine = '';
  let lineCount = 1;
  let shortText = '';

  words.forEach((w, index) => {
    testLine += `${w} `;
    const { width: testWidth } = context.measureText(`${testLine}${suffix}`);
    if (testWidth > width && index > 0) {
      lineCount += 1;
      testLine = `${w} `;
    }
    if (lineCount <= maxVisibleLines) {
      shortText += `${w} `;
    }
  });

  return {
    lineCount,
    shortText,
  };
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks() {
}

/**
 * Helper function to create DOM elements
 * @param {string} tag DOM element to be created
 * @param {object} attributes attributes to be added
 * @param html {HTMLElement | SVGAElement | string} Additional html to be appended to tag
 */
export function createTag(tag, attributes = {}, html = undefined) {
  const el = document.createElement(tag);
  if (html) {
    if (html instanceof HTMLElement || html instanceof SVGElement) {
      el.append(html);
    } else {
      el.insertAdjacentHTML('beforeend', html);
    }
  }
  if (attributes) {
    Object.entries(attributes).forEach(([key, val]) => {
      el.setAttribute(key, val);
    });
  }
  return el;
}

/**
 * Use an image as a whole section background
 * @param {*} main Main (section) node
 */
function buildSectionBackground(main) {
  main.querySelectorAll('.section.has-background').forEach((section) => {
    const picture = section.querySelector('picture');
    picture.closest('p').remove();
    if (picture) {
      section.appendChild(picture);
    }
  });
}

// loads additional delayed scripts
export function loadScript(url, attrs) {
  const head = document.querySelector('head');
  const script = document.createElement('script');
  script.src = url;
  if (attrs) {
    // eslint-disable-next-line no-restricted-syntax, guard-for-in
    for (const attr in attrs) {
      script.setAttribute(attr, attrs[attr]);
    }
  }
  head.append(script);
  return script;
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  // hopefully forward compatible button decoration
  decorateButtons(main);
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
  buildSectionBackground(main);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    await waitForLCP(LCP_BLOCKS);
  }
}

/**
 * Adds the favicon.
 * @param {string} href The favicon URL
 */
export function addFavIcon(href) {
  const link = document.createElement('link');
  link.rel = 'icon';
  link.href = href;
  const existingLink = document.querySelector('head link[rel="icon"]');
  if (existingLink) {
    existingLink.parentElement.replaceChild(link, existingLink);
  } else {
    document.getElementsByTagName('head')[0].appendChild(link);
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  const main = doc.querySelector('main');
  await loadBlocks(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadHeader(doc.querySelector('header'));
  loadFooter(doc.querySelector('footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  addFavIcon(`${window.hlx.codeBasePath}/styles/favicon.ico`);
  sampleRUM('lazy');
  sampleRUM.observe(main.querySelectorAll('div[data-block-name]'));
  sampleRUM.observe(main.querySelectorAll('picture > img'));
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), ADDITIONAL_SCRIPT_IMPORT_DELAY_MS);
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
