import {
  readBlockConfig, decorateIcons, getMetadata, loadBlocks,
} from '../../scripts/lib-franklin.js';

import {
  decorateMain,
} from '../../scripts/scripts.js';

/**
 * loads and decorates the footer
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const cfg = readBlockConfig(block);
  block.textContent = '';

  const footerPath = cfg.footer || '/careers/footer';

  const contentPaths = {
    footer: {
      path: `${footerPath}.plain.html`,
      isFragment: false,
    },
  };

  const globalFooterPath = getMetadata('global-footer') || '/careers/global-footer';
  if (globalFooterPath && globalFooterPath !== 'none') {
    contentPaths.globalfooter = {
      path: `${globalFooterPath}.plain.html`,
      isFragment: false,
    };
  }

  const contentEntries = Object.entries(contentPaths);
  const resp = await Promise.allSettled(contentEntries.map(
    ([name, content]) => (
      fetch(content.path, window.location.pathname.endsWith(
        `/${name}`,
      ) ? { cache: 'reload' } : {})),
  ));

  const contentBlocks = await Promise.all(resp.map(async ({ status, value }, index) => {
    // determine block type
    const [blockName, blockConfig] = contentEntries[index];
    const blockEntry = { name: blockName };

    if (status === 'fulfilled') {
      const blockWrapper = document.createElement('div');
      blockWrapper.classList.add(`${blockName}-wrapper`);
      const html = await value.text();
      if (blockConfig.isFragment) {
        const fragment = document.createElement('main');
        fragment.innerHTML = html;
        decorateMain(fragment);
        await loadBlocks(fragment);
        const fragmentSection = fragment.querySelector(':scope .section');
        if (fragmentSection) {
          blockWrapper.append(...fragmentSection.childNodes);
        }
      } else {
        blockWrapper.innerHTML = html;
        await decorateIcons(blockWrapper);
      }
      blockEntry.content = blockWrapper;
    }
    return blockEntry;
  }));

  // add footer
  const { content: footer } = contentBlocks.find(
    (cb) => cb.name === 'footer',
  ) || {};

  if (footer) {
    block.append(footer);
  }

  // add global footer
  const { content: globalfooter } = contentBlocks.find(
    (cb) => cb.name === 'globalfooter',
  ) || {};

  if (globalfooter) {
    block.append(globalfooter);
  }

  if (footer) {
    footer.firstElementChild.classList.add('footer-content');
    // decorate footer buttons
    const allButtons = footer.querySelectorAll('strong > a');
    allButtons.forEach((button) => {
      button.closest('p').classList.add('button-container');
      button.classList.add('button', 'primary');
    });

    // decorate footer content
    const colContainer = footer.querySelector('div.footer-links > div');
    const cols = [...colContainer.children];
    const propertyContainer = document.createElement('div');
    propertyContainer.classList.add('footer-property-content');
    const linkContainer = document.createElement('div');
    linkContainer.classList.add('footer-property-links');
    propertyContainer.appendChild(linkContainer);
    colContainer.appendChild(propertyContainer);
    cols.forEach((col, index, allCols) => {
      if (index > 0 && index < allCols.length) {
        linkContainer.appendChild(col);
      }
      if (index === allCols.length - 1) {
        col.classList.add('footer-property-social');
        const socialLinks = col.querySelectorAll('a');
        [...socialLinks].forEach((link) => {
          link.target = '_blank';
          const textNode = [...link.childNodes].find((node) => node.nodeType === 3);
          const span = document.createElement('span');
          link.setAttribute('aria-label', `${textNode.textContent.toLowerCase()} link`);
          span.appendChild(textNode);
          link.appendChild(span);
        });
        propertyContainer.appendChild(col);
      }
    });

    // decorate property link headers
    const headings = footer.querySelectorAll('.footer-property-links h2');
    await Promise.all([...headings].map(async (heading) => {
      const button = document.createElement('button');
      heading.parentElement.insertBefore(button, heading);
      button.appendChild(heading);
      // add svg
      try {
        const response = await fetch(`${window.hlx.codeBasePath}/icons/arrow-down.svg`);
        if (!response.ok) {
          return;
        }
        const svg = await response.text();
        const svgSpan = document.createElement('span');
        svgSpan.innerHTML = svg;
        button.appendChild(svgSpan);
        button.addEventListener('click', () => {
          button.classList.toggle('open');
          button.nextElementSibling.classList.toggle('open');
        });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(err);
      }
    }));
  }

  if (globalfooter) {
    globalfooter.firstElementChild.classList.add('global-footer-content');
    const globalFooterLinks = globalfooter.querySelector('.global-footer-content > div > div');
    globalFooterLinks.classList.add('global-footer-links');
    const globalFooterLinkTags = globalFooterLinks.querySelectorAll('a');
    globalFooterLinkTags.forEach((link) => {
      const label = link.href.split('https://www.caesars.com/')[1];
      link.setAttribute('aria-label', label);
    });
  }
}
