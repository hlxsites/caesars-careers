import { getMetadata, decorateIcons } from '../../scripts/lib-franklin.js';
// import { getMetadata, decorateIcons, loadBlocks } from '../../scripts/lib-franklin.js';
// import { loadScript } from '../../scripts/scripts.js';

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
// const CAESARS_DOT_COM = 'https://www.caesars.com';
const GLOBAL_HEADER_JSON = '/content/empire/en/jcr:content/root/header.model.json';
const GLOBAL_HEADER_JSON_LOCAL = '/careers/scripts/resources/header.model.json';
const GLOBAL_HEADER_LOGO_LOCAL = '/careers/icons/caesars-global-logo.svg';
// const GLOBAL_HEADER_SIGN_IN = '/fragments/header/sign-in';
// const DESKTOP_SIGN_IN_TEXT = 'Sign In';
// const MOBILE_SIGN_IN_TEXT = 'Sign Up / Sign In';

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

// async function fetchFragment(path) {
//   const resp = await fetch(`${path}.plain.html`);
//   if (resp.ok) {
//     const container = document.createElement('div');
//     container.innerHTML = await resp.text();
//     decorateMain(container);
//     await loadBlocks(container);
//     return container;
//   }
//   return null;
// }

function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('navigation');
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
 * Creates the user menu
 * @param {Element} block Header block
 */
// async function createUserMenu(block) {
//   const userMenu = document.createElement('div');
//   userMenu.classList.add('user-menu');
//   const userMenuClose = document.createElement('div');
//   userMenuClose.classList.add('user-menu-close');
//   userMenuClose.addEventListener('click', toggleUserMenu);
//   userMenu.appendChild(userMenuClose);
//   const userMenuContainer = document.createElement('div');
//   userMenuContainer.classList.add('user-menu-container');
//   const userMenuMainPanel = document.createElement('div');
//   userMenuMainPanel.classList.add('user-menu-main-panel');
//   const loginText = document.createElement('div');
//   loginText.classList.add('text-center');
//   userMenuMainPanel.appendChild(loginText);
//   const fragmentBlock = await fetchFragment(`${GLOBAL_HEADER_SIGN_IN}`);
//   userMenuContainer.appendChild(fragmentBlock);
//   userMenu.appendChild(userMenuContainer);
//   block.appendChild(userMenu);
// }

/**
 * decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  block.textContent = '';
  let globalNav;
  let globalNavSections;
  // let userObj;
  // let globalNavLogin;
  // let globalNavLogo;
  const globalNavDesktop = document.createElement('div');
  globalNavDesktop.classList.add('global-nav-desktop');
  const globalNavSection = document.createElement('div');
  globalNavSection.classList.add('global-nav-section');
  // const currentPage = encodeURIComponent(window.location.pathname);

  // Load the global galaxy script
  // const datetimeStamp = Date.now();
  // loadScript(`/a/security/js/login_galaxy.js?cachebuster=${datetimeStamp}`, {
  //   type: 'text/javascript',
  // });
  // eslint-disable-next-line no-underscore-dangle
  // if (window.__userObj) userObj = window.__userObj;
  // // eslint-disable-next-line no-console
  // console.debug(`User Object details: ${JSON.stringify(userObj)}`);

  // fetch global nav
  if (window.location.host.endsWith('caesars.com')) {
    globalNav = await fetch(`${GLOBAL_HEADER_JSON}`);
  } else {
    globalNav = await fetch(`${GLOBAL_HEADER_JSON_LOCAL}`);
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
      // // user account
      // const userAccount = document.createElement('div');
      // userAccount.classList.add('user-account');
      // // get current relative path to send as the forwardUrl
      // const signIn = document.createElement('a');
      // signIn.classList.add('sign-in');
      // signIn.setAttribute('aria-label', `${DESKTOP_SIGN_IN_TEXT}`);
      // signIn.href = `https://www.caesars.com/myrewards/profile/signin/?forwardUrl=${currentPage}`;
      // signIn.innerHTML = `${DESKTOP_SIGN_IN_TEXT}`;
      // userAccount.appendChild(signIn);
      // globalNavDesktop.appendChild(userAccount);
    }
    if (globalNavJson.logoFileReference) {
      globalNavDesktop.prepend(await createGlobalNavLogo(globalNavJson.logoFileReference));
    }
    if (globalNavJson.style) globalNavDesktop.classList.add(globalNavJson.style);
  }

  // createUserMenu(block);

  // fetch nav content
  const navPath = getMetadata('nav') || '/careers/nav';
  const resp = await fetch(`${navPath}.plain.html`, window.location.pathname.endsWith('/nav') ? { cache: 'reload' } : {});

  if (resp.ok) {
    const html = await resp.text();

    // decorate nav DOM
    const nav = document.createElement('nav');
    nav.id = 'navigation';
    nav.innerHTML = html;

    const classes = ['brand', 'sections', 'tools'];
    classes.forEach((c, i) => {
      const section = nav.children[i];
      if (section) section.classList.add(`nav-${c}`);
    });

    // Remove the text in the link and add aria-label
    nav.querySelector('.nav-brand a').innerHTML = '';
    nav.querySelector('.nav-brand a').setAttribute('aria-label', 'Caesars Careers');

    const navSections = nav.querySelector('.nav-sections');
    if (navSections) {
      const newDiv = document.createElement('div');
      newDiv.classList.add('local-nav');
      const localNavTitle = document.createElement('div');
      localNavTitle.classList.add('local-nav-title');
      localNavTitle.setAttribute('aria-expanded', true);
      localNavTitle.innerHTML = 'Property Links';
      newDiv.appendChild(localNavTitle);
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

      // const userAccountMobile = document.createElement('div');
      // userAccountMobile.classList.add('user-account-mobile');
      // const signInMobile = document.createElement('div');
      // signInMobile.classList.add('sign-in');
      // const signInLink = document.createElement('a');
      // signInLink.href = `https://www.caesars.com/myrewards/profile/signin/?forwardUrl=${currentPage}`;
      // signInLink.textContent = `${MOBILE_SIGN_IN_TEXT}`;
      // signInMobile.appendChild(signInLink);
      // userAccountMobile.append(signInMobile);
      // navSections.prepend(userAccountMobile);
    }

    // hamburger for mobile
    const hamburger = document.createElement('div');
    hamburger.classList.add('nav-hamburger');
    hamburger.innerHTML = `<button type="button" aria-controls="navigation" aria-label="Open navigation">
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

    // close the mobile menu when clicking anywhere outside of it
    window.addEventListener('click', (event) => {
      const expanded = nav.getAttribute('aria-expanded') === 'true';
      if (!screenConfig.smallDesktop.media.matches
        && !screenConfig.largeDesktop.media.matches && expanded) {
        const rect = navSections.getBoundingClientRect();
        if (event.clientX > rect.right) {
          toggleMenu(nav, navSections);
        }
      }
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
  }
}
