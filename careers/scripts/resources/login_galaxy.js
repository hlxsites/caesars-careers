/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/* eslint-disable camelcase */
/* eslint-disable prefer-destructuring */
/* eslint-disable radix */
/* eslint-disable no-empty */
/* eslint-disable no-plusplus */
/* eslint-disable no-param-reassign */
/* eslint-disable func-names */
/* eslint-disable no-underscore-dangle */

// BEGIN userObj
const __userObj = {
  tier: '', accountBalance: '', tierScore: '', offersCount: '', lastTrUpdate: '', name: '', username: '', isLoggedIn: 'false', lastUpdated: '',
};

__userObj.readCookie = function (name) {
  try {
    name += '=';
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') { c = c.substring(1, c.length); }
      if (c.indexOf(name) === 0) { return c.substring(name.length, c.length); }
    }
  } catch (e) { }
  return '';
};

__userObj.writeCookie = function (name, value, days, path) {
  try {
    let expires = '';
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = `expires=${date.toGMTString()};`;
    }
    path = `path=${path};`;
    const domain = '';
    document.cookie = `${name}=${escape(value)};${expires}${path}${domain}`;
  } catch (e) { }
};

__userObj.cookieCheck = function () {
  return (this.readCookie('userInfoCookie') !== '' && this.readCookie('userSessionCookie') !== '' && this.readCookie('accountId') !== '' && this.readCookie('sectoken') !== '');
};
__userObj.accountRefresh = function () {
  __userObj.ajaxRequest(true);
};
__userObj.checkIsLoggedIn = function () {
  let isLoggedIn = false;
  if (__userObj.cookieCheck()) {
    isLoggedIn = true;

    // Here we are using two ways to get the value from
    // localStorage(using getItem and direct calling).
    let key = localStorage.getItem(`_keepalive_${this.readCookie('accountId')}`);

    if (key == null || typeof (key) !== 'undefined') {
      key = localStorage[`_keepalive_${this.readCookie('accountId')}`];
    }

    // if the key is older than 5 minutes call keepalive
    if (key == null || parseInt(Date.now()) - parseInt(key) > 300000) {
      // call keepalive
      __userObj.ajaxRequest(false);
      // check cookies to see if user is still logged in
      if (!__userObj.cookieCheck()) {
        isLoggedIn = false;
      }
    }
  }

  return isLoggedIn;
};

__userObj.load = function () {
  let userInfoCookie = this.readCookie('userInfoCookie');
  const userInfoCookieX = this.readCookie('userInfoCookieX');
  let demarcationCookie = this.readCookie('demarcationCookie');

  demarcationCookie = (demarcationCookie === '') ? 'X##X' : demarcationCookie;

  // if userInfoCookieX is available then use that cookie to populate field
  if (userInfoCookie === '' && userInfoCookieX !== '') {
    userInfoCookie = userInfoCookieX;
  }

  const userInfoCookieArray = userInfoCookie.split(demarcationCookie);

  if (userInfoCookieArray.length >= 6) {
    this.name = userInfoCookieArray[0];

    if (userInfoCookieArray[1] === 'TOTAL GOLD') {
      userInfoCookieArray[1] = 'GOLD';
    }
    this.tier = userInfoCookieArray[1];
    this.accountBalance = userInfoCookieArray[2];
    this.tierScore = userInfoCookieArray[3];
    this.offersCount = userInfoCookieArray[4];
    this.lastTrUpdate = userInfoCookieArray[5];
    this.isLoggedIn = this.checkIsLoggedIn() ? 'true' : 'false';
    this.lastUpdated = new Date().toUTCString();
    // if the user didn't check the remember me username would be undefined.
    this.username = userInfoCookieArray[6];
  }
};

__userObj.ajaxRequest = async function (fullRefresh) {
  // perform logged in keep alive logic -->
  try {
    const keepAliveUrl = `/a/security/keepalive.aspx?fullrefresh=${fullRefresh}&__cb=${new Date().getTime()}`;
    const response = await fetch(keepAliveUrl);
    if (response) {
      if (__userObj.cookieCheck()) {
        // reset keep alive timer
        __userObj.setKeepAliveCountdown();
        if (response.indexOf('True') > -1) {
          // update data
          __userObj.load();
        }
      } else {
        // update the userObj with the logged in status
        __userObj.isLoggedIn = false;
      }
    }
  } catch (e) {
    // do nothing since we weren't able to validate the session
  }
};
__userObj.setKeepAliveCountdown = function () {
  localStorage.removeItem(`_keepalive_${__userObj.readCookie('accountId')}`);
  const key = `_keepalive_${__userObj.readCookie('accountId')}`;
  const now = Date.now();
  localStorage.setItem(key, now);
};
__userObj.removeKeepAliveCountdown = function () {
  if (localStorage.length > 0) {
    localStorage.forEach((key) => {
      if (key.indexOf('_keepalive_') === 0) {
        localStorage.removeItem(key);
      }
    });
  }
};

__userObj.load();
// END userObj

// BEGIN cobranded
function isValidDomain(domain) {
  if (domain.toLocaleLowerCase() === 'localhost' || domain.toLocaleLowerCase().endsWith('.hlx.page') || domain.toLocaleLowerCase().endsWith('.hlx.live') || domain.toLocaleLowerCase() === 'www.totalrewards.com' || domain.toLocaleLowerCase().indexOf('.caesars.com') > -1) {
    return true;
  }
  return false;
}

function CBCS_GetDomain() {
  const thisDomain = window.location.host;
  if (isValidDomain(thisDomain)) {
    return `https://${thisDomain}/`;
  }
  return 'https://www.caesars.com/';
}

document.addEventListener('DOMContentLoaded', () => {
  const currentDomain = window.location.host;
  if (!isValidDomain(currentDomain)) {
    return;
  }
  if (__userObj.isLoggedIn === 'true') {
    const cobrand_script_tag = document.createElement('script');
    cobrand_script_tag.src = `${CBCS_GetDomain()}cobranded/js/cobranding.js`;
    document.body.appendChild(cobrand_script_tag);
  }
});

function closeCBCSIframe() {
  cobranding.closeCBCSIframe();
}
// END cobranded
