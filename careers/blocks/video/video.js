import { createTag } from '../../scripts/scripts.js';

/**
 * Keep track of all the YouTube players for each video on the page
 */
const playerMap = {};
const pendingPlayers = [];

const videoTypeMap = Object.freeze({
  youtube: [/youtube\.com/, /youtu\.be/],
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
const loadYouTubePlayer = (element, videoId) => {
  const onPlayerReady = (event) => {
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
const buildVideoPlayer = (href) => {
  if (getVideoType(href) !== 'youtube') {
    return null;
  }

  const videoContainer = createTag('div', { class: 'video-container' });
  const videoContent = createTag('div', { class: 'video-content' });

  // Create a YouTube compatible iFrame
  const videoId = getYouTubeId(href);
  videoContent.dataset.ytid = videoId;
  videoContent.innerHTML = `<div id="ytFrame-${videoId}"></div>`;
  if (!window.YT) {
    pendingPlayers.push({ id: videoId, element: videoContent.firstElementChild});
  } else {
    loadYouTubePlayer(videoContent.firstElementChild, videoId);
  }

  if (!window.onYouTubeIframeAPIReady) {
    // onYouTubeIframeAPIReady will load the video after the script is loaded
    window.onYouTubeIframeAPIReady = () => {
      pendingPlayers.forEach(({videoId, element}) => loadYouTubePlayer(element, videoId));
    }
  }

  videoContainer.appendChild(videoContent);

  return videoContainer;
};

export default function decorate(block) {
  // decorate picture container
  const picture = block.querySelector('picture');
  let altContainer;
  if (picture) {
    // if there is text and picture
    altContainer = picture.closest('div');
    const videoImage = document.createElement('div');
    videoImage.classList.add('video-image');
    videoImage.append(picture);
    altContainer.append(videoImage);
  } else {
    // text only
    const altText = block.querySelector('h4');
    altContainer = altText.closest('div');
  }
  const staticPlaceholder = altContainer.parentNode;
  staticPlaceholder.classList.add('video-static-content');

  // decorate video link
  const videoLink = block.querySelector('a');
  let videoHref;
  if (videoLink) {
    videoHref = videoLink.href;
    if (getVideoType(videoHref) !== 'external') {
      const videoModal = buildVideoPlayer(videoHref);
      block.append(videoModal);
    }
    videoLink.remove();
  }
}
