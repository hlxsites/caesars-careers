import { createTag } from '../../scripts/scripts.js';

/**
 * Keep track of all the YouTube players for each video on the page
 */
const playerMap = {};

const videoTypeMap = Object.freeze({
  youtube: [/youtube\.com/, /youtu\.be/]
});

/**
 * Determine the type of video from its href.
 * @param href
 * @return {undefined|youtube|external}
 */
const getVideoType = (href) => {
  const videoEntry = Object.entries(videoTypeMap).find(
    ([, allowedUrls]) => allowedUrls.some((urlToCompare) => urlToCompare.test(href)),
  );
  if (videoEntry) {
    return videoEntry[0];
  }
  return null;
};

/**
 * Extract YouTube video id from its URL.
 * @param href A valid YouTube URL
 * @return {string|null}
 */
const getYouTubeId = (href) => {
  const ytExp = /(?:[?&]v=|\/embed\/|\/1\/|\/v\/|https:\/\/(?:www\.)?youtu\.be\/)([^&\n?#]+)/;
  const match = href.match(ytExp);
  if (match && match.length > 1) {
    return match[1];
  }
  return null;
};

/**
 * Create a new YT Player and store the result of its player ready event.
 * @param element iFrame element YouTube player will be attached to.
 * @param videoId The YouTube video id
 */
const loadYouTubePlayer = (element, videoId, staticPlaceholder) => {
  const onPlayerReady = (event) => {
    staticPlaceholder.classList.add('hidden');
    playerMap[videoId] = event.target;
  };
  // we have to create a new YT Player but then need to wait for its onReady event
  // before assigning it to the player map
  // eslint-disable-next-line no-new
  new window.YT.Player(element, {
    videoId,
    events: {
      onReady: onPlayerReady,
    },
  });
};

/**
 * Display video within a modal overlay. Video can be served directly or via YouTube.
 * @param href
 * @return {HTMLElement}
 */
const buildVideoPlayer = (href, staticPlaceholder) => {
  const videoModal = createTag('div', { class: 'video-player', 'aria-modal': 'true', role: 'dialog' });
  const videoContainer = createTag('div', { class: 'video-container' });

  const videoContent = createTag('div', { class: 'video-content' });
  if (getVideoType(href) === 'youtube') {
    // Create a YouTube compatible iFrame
    const videoId = getYouTubeId(href);
    videoContent.dataset.ytid = videoId;
    videoContent.innerHTML = `<div id="ytFrame-${videoId}"></div>`;
    if (!window.YT) {
      //onYouTubeIframeAPIReady will load the video after the script is loaded
      window.onYouTubeIframeAPIReady = () => loadYouTubePlayer(
        videoContent.firstElementChild,
        videoId,
        staticPlaceholder
      );
    } else {
      loadYouTubePlayer(videoContent.firstElementChild, videoId, staticPlaceholder);
    }
  } else {
    videoContent.innerHTML = `<video controls playsinline loop preload="auto">
        <source src="${href}" type="video/mp4" />
        "Your browser does not support videos"
        </video>`;
  }
  videoContainer.appendChild(videoContent);
  videoModal.appendChild(videoContainer);

  return videoModal;
};

export default function decorate(block) {
  // decorate picture container
  const picture = block.querySelector('picture');
  let staticPlaceholder, altContainer;
  if(picture){
    // if there is text and picture
    altContainer = picture.closest('div');
    staticPlaceholder = altContainer.parentNode;
    staticPlaceholder.classList.add('video-static-content');

    const videoImage = document.createElement('div');
    videoImage.classList.add('video-image');
    videoImage.append(picture);
    altContainer.append(videoImage);
  } else {
    // text only
    const altText = block.querySelector('h4');
    altContainer = altText.closest('div');
    staticPlaceholder = altContainer.parentNode;
    staticPlaceholder.classList.add('video-static-content');
  }

  // decorate video link
  const videoLink = block.querySelector('a');
  let videoHref;
  if (videoLink) {
    videoHref = videoLink.href;
    if (getVideoType(videoHref) !== 'external') {
      const videoModal = buildVideoPlayer(videoHref, staticPlaceholder);
      block.append(videoModal);
    }
    videoLink.remove();
  }
}