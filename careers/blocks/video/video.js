import { createTag } from '../../scripts/scripts.js';

const selectors = Object.freeze({
  videoModal: '.video-container',
  videoContent: '.video-content',
});

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
  const videoModal = createTag('div', { class: 'video-player', 'aria-modal': 'true', role: 'dialog' });
  const videoContainer = createTag('div', { class: 'video-container' });

  const videoContent = createTag('div', { class: 'video-content' });
  if (getVideoType(href) === 'youtube') {
    // Create a YouTube compatible iFrame
    const videoId = getYouTubeId(href);
    videoContent.dataset.ytid = videoId;
    videoContent.innerHTML = `<div id="ytFrame-${videoId}"></div>`;
    if (!window.YT) {
      // onYouTubeIframeAPIReady will load the video after the script is loaded
      window.onYouTubeIframeAPIReady = () => loadYouTubePlayer(
        videoContent.firstElementChild,
        videoId,
      );
    } else {
      loadYouTubePlayer(videoContent.firstElementChild, videoId);
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
  if (picture) {
    const pictureContainer = picture.closest('div');
    pictureContainer.classList.add('video-image');
    const otherContent = pictureContainer.parentNode;
    otherContent.classList.add('video-static-content');
    pictureContainer.appendChild(picture);
  }

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