import { getMetadata, decorateIcons, loadBlocks } from '../../scripts/lib-franklin.js';
import { createTag, decorateMain } from '../../scripts/scripts.js';

const screenConfig = Object.freeze({
  tablet: {
    media: window.matchMedia('(max-width: 1169px)'),
  },
  smallDesktop: {
    media: window.matchMedia('(min-width: 1170px) and (max-width: 1439px'),
    maxItems: 7,
  },
  largeDesktop: {
    media: window.matchMedia('(min-width: 1440px)'),
    maxItems: 9,
  },
});
const CAESARS_DOT_COM = 'https://www.caesars.com';
const CAESARS_SIGN_IN = 'https://www.caesars.com/myrewards/profile/signin/?forwardUrl=';
const CAESARS_GALAXY_LOGIN = `/a/security/js/login_galaxy.js?cachebuster=${Date.now.toString()}`;
const CAESARS_GALAXY_LOGIN_LOCAL = '/careers/scripts/resources/login_galaxy.js';
const GLOBAL_HEADER_JSON = '/content/empire/en/jcr:content/root/header.model.json';
const GLOBAL_HEADER_JSON_LOCAL = '/careers/scripts/resources/header.model.json';
const GLOBAL_HEADER_LOGO_LOCAL = '/careers/icons/caesars-global-logo.svg';
const GLOBAL_HEADER_SIGN_IN = '/careers/fragments/header/sign-in';
const DESKTOP_SIGN_IN_TEXT = 'Sign In';
const DESKTOP_MY_ACCOUNT_TEXT = 'My Account';
const MOBILE_SIGN_IN_TEXT = 'Sign Up / Sign In';
const URL_ENCODED_PATH = encodeURIComponent(window.location.pathname);

async function createGlobalNavLogo(logoFileReference) {
  // Add logo
  const logo = document.createElement('div');
  logo.classList.add('logo');
  if (logoFileReference) {
    try {
      let response;
      if (window.location.host.endsWith('.page') || window.location.host.endsWith('.live') || window.location.host.startsWith('localhost')) {
        response = await fetch(`${GLOBAL_HEADER_LOGO_LOCAL}`);
      } else {
        response = await fetch(`${logoFileReference}`);
      }
      if (!response.ok) response = await fetch(`${GLOBAL_HEADER_LOGO_LOCAL}`);
      if (response.ok) {
        const svg = await response.text();
        const svgSpan = document.createElement('span');
        svgSpan.innerHTML = svg;
        logo.appendChild(svgSpan);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('error', err);
    }
  }
  return logo;
}

async function fetchFragment(path) {
  const resp = await fetch(`${path}.plain.html`);
  if (resp.ok) {
    const container = document.createElement('div');
    container.innerHTML = await resp.text();
    decorateMain(container);
    await loadBlocks(container);
    return container;
  }
  return null;
}

function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    const navSections = nav.querySelector('.nav-sections');
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && screenConfig.smallDesktop.media.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections);
      navSectionExpanded.focus();
    } else if (!screenConfig.smallDesktop.media.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections);
      nav.querySelector('button').focus();
    }
  }
}

function openOnKeydown(e) {
  const focused = document.activeElement;
  const isNavDrop = focused.className === 'nav-drop';
  if (isNavDrop && (e.code === 'Enter' || e.code === 'Space')) {
    const dropExpanded = focused.getAttribute('aria-expanded') === 'true';
    // eslint-disable-next-line no-use-before-define
    toggleAllNavSections(focused.closest('.nav-sections'));
    focused.setAttribute('aria-expanded', dropExpanded ? 'false' : 'true');
  }
}

function focusNavSection() {
  document.activeElement.addEventListener('keydown', openOnKeydown);
}

/**
 * Toggles all nav sections
 * @param {Element} sections The container element
 * @param {Boolean} expanded Whether the element should be expanded or collapsed
 */
function toggleAllNavSections(sections, expanded = false) {
  sections.querySelectorAll('.nav-sections > ul > li').forEach((section) => {
    section.setAttribute('aria-expanded', expanded);
  });
}

function toggleNavSectionTitles(navSectionTitle, navSection) {
  const expanded = navSectionTitle.getAttribute('aria-expanded') === 'true';
  navSection.querySelectorAll('ul > li').forEach((section) => {
    section.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  });
  navSectionTitle.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  navSection.setAttribute('aria-expanded', expanded ? 'false' : 'true');
}

/**
 * Toggles the entire nav
 * @param {Element} nav The container element
 * @param {Element} navSections The nav sections within the container element
 * @param {*} forceExpanded Optional param to force nav expand behavior when not null
 */
function toggleMenu(nav, navSections, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  const globalNavSections = nav.querySelector('.nav-sections .global-nav');
  document.body.style.overflowY = (expanded || screenConfig.smallDesktop.media.matches || screenConfig.largeDesktop.media.matches) ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  toggleAllNavSections(navSections, expanded || screenConfig.smallDesktop.media.matches || screenConfig.largeDesktop.media.matches ? 'false' : 'true');
  button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  // enable nav dropdown keyboard accessibility
  const navDrops = navSections.querySelectorAll('.nav-drop');
  if (screenConfig.smallDesktop.media.matches || screenConfig.largeDesktop.media.matches) {
    if (globalNavSections) globalNavSections.setAttribute('aria-hidden', true);
    navDrops.forEach((drop) => {
      if (!drop.hasAttribute('tabindex')) {
        drop.setAttribute('role', 'button');
        drop.setAttribute('tabindex', 0);
        drop.addEventListener('focus', focusNavSection);
      }
    });
  } else {
    if (globalNavSections) globalNavSections.removeAttribute('aria-hidden', true);
    navDrops.forEach((drop) => {
      drop.removeAttribute('role');
      drop.removeAttribute('tabindex');
      drop.removeEventListener('focus', focusNavSection);
    });
  }
  // enable menu collapse on escape keypress
  if (!expanded || screenConfig.smallDesktop.media.matches
    || screenConfig.largeDesktop.media.matches) {
    // collapse menu on escape press
    window.addEventListener('keydown', closeOnEscape);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
  }
}

/**
 * shows the login modal
 */
function toggleUserMenu() {
  const userMenu = document.querySelector('.header.block .user-menu');
  if (userMenu.classList.contains('open')) {
    userMenu.classList.remove('open');
  } else {
    userMenu.classList.add('open');
  }
  if (this.classList.contains('user-account-mobile')) {
    const nav = document.querySelector('nav');
    const navSections = nav.querySelector('.nav-sections');
    toggleMenu(nav, navSections);
  }
}

/**
 * Creates the user menu
 * @param {Element} block Header block
 */
async function createUserMenu() {
  const userMenuClose = createTag('div', { class: 'user-menu-close' });
  userMenuClose.addEventListener('click', toggleUserMenu);
  const userMenu = createTag('div', { class: 'user-menu' }, userMenuClose);
  const userMenuContainer = createTag('div', { class: 'user-menu-container' });
  const fragmentBlock = await fetchFragment(`${GLOBAL_HEADER_SIGN_IN}`);
  userMenuContainer.append(fragmentBlock);
  userMenu.append(userMenuContainer);
  return userMenu;
}

/**
 * decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  block.textContent = '';
  let globalNav;
  let globalNavSections;
  const globalNavDesktop = document.createElement('div');
  globalNavDesktop.classList.add('global-nav-desktop');
  const globalNavSection = document.createElement('div');
  globalNavSection.classList.add('global-nav-section');

  // fetch global nav
  if (window.location.host.endsWith('.page') || window.location.host.endsWith('.live') || window.location.host.startsWith('localhost')) {
    globalNav = await fetch(`${GLOBAL_HEADER_JSON_LOCAL}`);
  } else {
    globalNav = await fetch(`${CAESARS_DOT_COM}${GLOBAL_HEADER_JSON}`);
  }
  if (globalNav.ok) {
    const globalNavJson = await globalNav.json();
    if (globalNavJson.navItems) {
      const globalNavDiv = document.createElement('div');
      globalNavDiv.classList.add('global-nav');
      const globalNavTitle = document.createElement('div');
      globalNavTitle.classList.add('global-nav-title');
      globalNavTitle.setAttribute('aria-expanded', false);
      globalNavTitle.innerHTML = 'Caesars Entertainment';
      globalNavDiv.appendChild(globalNavTitle);
      globalNavDiv.setAttribute('aria-expanded', false);
      const ul = document.createElement('ul');
      globalNavJson.navItems.forEach((item) => {
        const li = document.createElement('li');
        li.setAttribute('aria-expanded', false);
        const link = document.createElement('a');
        link.href = item.path;
        link.innerHTML += item.text;
        link.setAttribute('target', item.target);
        link.setAttribute('aria-label', item.text);
        li.append(link);
        ul.append(li);
      });
      globalNavDiv.appendChild(ul);
      const globalNavLinks = ul.cloneNode(true);
      globalNavSection.appendChild(globalNavLinks);
      globalNavDesktop.appendChild(globalNavSection);
      globalNavSections = globalNavDiv;
      globalNavTitle.addEventListener('click', () => {
        toggleNavSectionTitles(globalNavTitle, globalNavSections);
      });
      // user account
      const signIn = createTag('a', { href: `${CAESARS_SIGN_IN}${URL_ENCODED_PATH}`, class: 'sign-in', 'aria-label': `${DESKTOP_SIGN_IN_TEXT}` }, `${DESKTOP_SIGN_IN_TEXT}`);
      const userAccount = createTag('div', { class: 'user-account' }, signIn);
      const myAccount = createTag('a', { class: 'my-account', 'aria-label': `${DESKTOP_MY_ACCOUNT_TEXT}`, 'aria-hidden': true }, `${DESKTOP_MY_ACCOUNT_TEXT}`);
      myAccount.addEventListener('click', toggleUserMenu);
      userAccount.append(myAccount);
      globalNavDesktop.append(userAccount);
    }
    if (globalNavJson.logoFileReference) {
      globalNavDesktop.prepend(await createGlobalNavLogo(globalNavJson.logoFileReference));
    }
    if (globalNavJson.style) globalNavDesktop.classList.add(globalNavJson.style);
  }
  block.append(await createUserMenu());

  // fetch nav content
  const navPath = getMetadata('nav') || '/careers/nav';
  const resp = await fetch(`${navPath}.plain.html`, window.location.pathname.endsWith('/nav') ? { cache: 'reload' } : {});

  if (resp.ok) {
    const html = await resp.text();

    // decorate nav DOM
    const nav = document.createElement('nav');
    nav.id = 'nav';
    nav.innerHTML = html;

    const classes = ['brand', 'sections', 'tools'];
    classes.forEach((c, i) => {
      const section = nav.children[i];
      if (section) section.classList.add(`nav-${c}`);
    });

    // Remove the text in the link
    nav.querySelector('.nav-brand a').innerHTML = '';

    const navSections = nav.querySelector('.nav-sections');
    if (navSections) {
      const localNavTitle = createTag('div', { class: 'local-nav-title', 'aria-expanded': true }, 'Property Links');
      const newDiv = createTag('div', { class: 'local-nav' }, localNavTitle);
      while (navSections.hasChildNodes()) newDiv.appendChild(navSections.firstChild);
      newDiv.setAttribute('aria-expanded', true);

      // highlight current nav item if on same page
      const navLinks = newDiv.querySelectorAll('a');
      if (navLinks.length > 0) {
        navLinks.forEach((navLink) => {
          const navLinkUrl = new URL(navLink.href);
          if (navLinkUrl.pathname === window.location.pathname) {
            navLink.classList.add('active');
          }
        });
      }
      navSections.append(newDiv);
      localNavTitle.addEventListener('click', () => {
        toggleNavSectionTitles(localNavTitle, newDiv);
      });
      if (globalNavSections) navSections.append(globalNavSections);

      const signInLink = createTag('a', { href: `${CAESARS_SIGN_IN}${URL_ENCODED_PATH}`, class: 'sign-in' }, `${MOBILE_SIGN_IN_TEXT}`);
      const signInMobile = createTag('div', { class: 'sign-in' }, signInLink);
      const myAccount = createTag('a', { class: 'my-account', 'aria-label': `${DESKTOP_MY_ACCOUNT_TEXT}`, 'aria-hidden': true }, `${DESKTOP_MY_ACCOUNT_TEXT}`);
      signInMobile.append(myAccount);
      const userAccountMobile = createTag('div', { class: 'user-account-mobile' }, signInMobile);
      myAccount.addEventListener('click', toggleUserMenu);
      navSections.prepend(userAccountMobile);
    }

    // hamburger for mobile
    const hamburger = document.createElement('div');
    hamburger.classList.add('nav-hamburger');
    hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
        <span class="nav-hamburger-icon"></span>
      </button>`;
    hamburger.addEventListener('click', () => toggleMenu(nav, navSections));
    nav.prepend(hamburger);
    nav.setAttribute('aria-expanded', 'false');

    // prevent mobile nav behavior on window resize
    window.addEventListener('resize', () => {
      const localNav = block.querySelector('header nav');
      if (!screenConfig.tablet.media.matches) {
        localNav.setAttribute('aria-expanded', 'false');
      }
    });

    // close the mobile menu or user menu when clicking anywhere outside of it
    window.addEventListener('click', (event) => {
      const mobileMenuExpanded = nav.getAttribute('aria-expanded') === 'true';
      // const userMenu = block.querySelector('.user-menu');
      // const userMenuExpanded = userMenu.classList.contains('open');
      if (screenConfig.tablet.media.matches && mobileMenuExpanded) {
        const navSectionsRect = navSections.getBoundingClientRect();
        if (event.clientX > navSectionsRect.right) {
          toggleMenu(nav, navSections);
        }
      }

      // if (!screenConfig.tablet.media.matches && userMenuExpanded) {
      //   const userMenuContainer = userMenu.querySelector('.user-menu-container');
      //   const userMenuContainerRect = userMenuContainer.getBoundingClientRect();
      //   if (event.clientX < userMenuContainerRect.left) {
      //     userMenu.classList.remove('open');
      //   }
      // }
    });

    // add page scroll listener to know when header turns to sticky
    const header = block.parentNode;
    window.addEventListener('scroll', () => {
      const scrollAmount = window.scrollY;
      if (scrollAmount > 0) {
        header.classList.add('is-sticky');
      } else {
        header.classList.remove('is-sticky');
      }
    });

    decorateIcons(nav);
    const navWrapper = document.createElement('div');
    navWrapper.className = 'nav-wrapper';
    navWrapper.append(nav);
    block.prepend(globalNavDesktop);
    block.append(navWrapper);

    // Load login script
    let galaxyScriptPath = CAESARS_GALAXY_LOGIN;
    if (window.location.host.endsWith('.page') || window.location.host.endsWith('.live') || window.location.host.startsWith('localhost')) {
      galaxyScriptPath = CAESARS_GALAXY_LOGIN_LOCAL;
    }
    const galaxyLogin = createTag('script', { src: `${galaxyScriptPath}` });
    document.head.appendChild(galaxyLogin);
  }
}
