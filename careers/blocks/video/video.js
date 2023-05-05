import { createTag } from '../../scripts/scripts.js';

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
  // eslint-disable-next-line no-new
  new window.YT.Player(element, { videoId });
};

/**
 * Display video within a modal overlay. Video can be served directly or via YouTube.
 * @param href
 * @return {HTMLElement}
 */
const buildVideoPlayer = (href, block) => {
  if (getVideoType(href) !== 'youtube') {
    return null;
  }

  const videoPlayer = createTag('div', { class: 'video-player' });
  const observer = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      if (videoPlayer.dataset && videoPlayer.dataset.ytid === undefined) {
        // Create a YouTube compatible iFrame
        const videoId = getYouTubeId(href);
        videoPlayer.dataset.ytid = videoId;
        videoPlayer.innerHTML = `<div id="ytFrame-${videoId}"></div>`;
        if (!window.YT) {
          pendingPlayers.push({ id: videoId, element: videoPlayer.firstElementChild });
        } else {
          loadYouTubePlayer(videoPlayer.firstElementChild, videoId);
        }
        if (!window.onYouTubeIframeAPIReady) {
          // onYouTubeIframeAPIReady will load the video after the script is loaded
          window.onYouTubeIframeAPIReady = () => {
            pendingPlayers.forEach(({ id, element }) => loadYouTubePlayer(element, id));
          };
        }
      }
    }
  }, {
    root: null,
    rootMargin: '0px',
    threshold: 1.0,
  });
  observer.observe(block);

  return videoPlayer;
};

export default function decorate(block) {
  // decorate static content
  const videoPoster = block.querySelector(':scope > div');
  videoPoster.classList.add('video-poster');
  const picture = block.querySelector('picture');
  if (picture) {
    picture.parentElement.classList.add('video-poster-image');
  }

  // decorate video link
  const videoLink = block.querySelector('a');
  if (videoLink) {
    const videoHref = videoLink.href;
    const videoPlayer = buildVideoPlayer(videoHref, block);
    block.append(videoPlayer);
    videoLink.parentElement.remove();
  }
}
