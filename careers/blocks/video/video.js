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
 * Display video within a modal overlay. Video can be served directly or via YouTube.
 * @param href
 * @return {HTMLElement}
 */
const buildVideoPlayer = (href) => {
  if (getVideoType(href) !== 'youtube') {
    return null;
  }

  const videoPlayer = createTag('div', { class: 'video-player' });

  const iframeId = 'existing-youtube-iframe'
  const iframe = createTag('iframe', { class: 'yt-iframe' });
  iframe.id = iframeId;
  iframe.frameborder = 0;
  iframe.width = 640;
  iframe.height = 360;
  iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
  iframe.title = 'YouTube video player';
  iframe.toggleAttribute('allowfullscreen');
  iframe.src = `https://www.youtube.com/embed/${getYouTubeId(href)}?enablejsapi=1`;

  videoPlayer.append(iframe);
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
    const videoPlayer = buildVideoPlayer(videoHref);
    block.append(videoPlayer);
    videoLink.parentElement.remove();
  }
}
