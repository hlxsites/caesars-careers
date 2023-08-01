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
const buildVideoPlayer = (href) => {
  if (getVideoType(href) !== 'youtube') {
    return null;
  }

  const videoPlayer = createTag('div', { class: 'video-player' });

  const iframe = createTag('iframe', { class: 'yt-iframe' });
  iframe.id = 'existing-iframe-example';
  iframe.frameborder = 0;
  iframe.width = 640;
  iframe.height = 360;
  iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
  iframe.title = "YouTube video player";
  iframe.toggleAttribute('allowfullscreen');
  iframe.src = 'https://www.youtube.com/embed/l4iGvndOpxA?enablejsapi=1';
  console.log("iframe src: ", href)

  var player;
  function onYouTubeIframeAPIReady() {
    player = new YT.Player('existing-iframe-example', {
        events: {
          'onReady': onPlayerReady,
          'onStateChange': onPlayerStateChange
        }
    });
  }
  function onPlayerReady(event) {
    document.getElementById('existing-iframe-example').style.borderColor = '#FF6D00';
  }
  function changeBorderColor(playerStatus) {
    var color;
    if (playerStatus == -1) {
      color = "#37474F"; // unstarted = gray
    } else if (playerStatus == 0) {
      color = "#FFFF00"; // ended = yellow
    } else if (playerStatus == 1) {
      color = "#33691E"; // playing = green
    } else if (playerStatus == 2) {
      color = "#DD2C00"; // paused = red
    } else if (playerStatus == 3) {
      color = "#AA00FF"; // buffering = purple
    } else if (playerStatus == 5) {
      color = "#FF6DOO"; // video cued = orange
    }
    if (color) {
      document.getElementById('existing-iframe-example').style.borderColor = color;
    }
  }
  function onPlayerStateChange(event) {
    changeBorderColor(event.data);
  }

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
