/**
 * Carousel Block
 *
 * Features:
 * - smooth scrolling
 * - mouse drag between slides
 * - swipe between slides
 * - endless sliding
 * - next and previous navigation buttons
 */

const DEFAULT_SCROLL_INTERVAL_MS = 5000;
const SLIDE_ID_PREFIX = 'carousel-slide';
const NAVIGATION_DIRECTION_PREV = 'prev';
const NAVIGATION_DIRECTION_NEXT = 'next';
const SLIDE_ANIMATION_DURATION_MS = 640;

const DEFAULT_CONFIG = Object.freeze({
  interval: DEFAULT_SCROLL_INTERVAL_MS,
});

class CarouselState {
  constructor(curSlide, interval, firstVisibleSlide = 1, maxVisibleSlides = 0) {
    this.firstVisibleSlide = firstVisibleSlide;
    this.maxVisibleSlides = maxVisibleSlides;
    this.curSlide = curSlide;
    this.interval = interval;
    this.scrollInterval = null; /* for auto-scroll interval handling */
  }
}

/**
 * Clear any active scroll intervals
 * @param blockState Current block state
 */
function stopAutoScroll(blockState) {
  clearInterval(blockState.scrollInterval);
  blockState.scrollInterval = undefined;
}

/**
 * Scroll a single slide into view.
 * @param carousel The carousel
 * @param blockState Current block state
 * @param slideIndex {number} The slide index
 * @param scrollBehavior Scroll behavior to use for scrolling
 */
function scrollToSlide(carousel, blockState, slideIndex = 1, scrollBehavior = 'smooth') {
  const carouselSlider = carousel.querySelector('.carousel-slide-container');
  if (slideIndex >= blockState.firstVisibleSlide && slideIndex <= blockState.maxVisibleSlides) {
    // normal sliding in-between slides
    const leftSlideOffset = carouselSlider.offsetWidth * slideIndex;
    carouselSlider.scrollTo({
      left: leftSlideOffset,
      behavior: scrollBehavior,
    });

    // sync slide state
    [...carouselSlider.children].forEach((slide, index) => {
      if (index === slideIndex) {
        slide.removeAttribute('tabindex');
      } else {
        slide.setAttribute('tabindex', '-1');
      }
    });
    blockState.curSlide = slideIndex;
  } else if (slideIndex === 0) {
    // sliding from first to last
    let leftSlideOffset = carouselSlider.offsetWidth * slideIndex;
    carouselSlider.scrollTo({ left: leftSlideOffset, behavior: 'smooth' });
    leftSlideOffset = carouselSlider.offsetWidth * blockState.maxVisibleSlides;

    setTimeout(() => {
      carouselSlider.scrollTo({ left: leftSlideOffset, behavior: 'instant' });
    }, SLIDE_ANIMATION_DURATION_MS);

    // sync slide state
    [...carouselSlider.children].forEach((slide, index) => {
      if (index === blockState.maxVisibleSlides) {
        slide.removeAttribute('tabindex');
      } else {
        slide.setAttribute('tabindex', '-1');
      }
    });
    blockState.curSlide = blockState.maxVisibleSlides;
  } else if (slideIndex === blockState.maxVisibleSlides + 1) {
    // sliding from last to first
    let leftSlideOffset;
    leftSlideOffset = carouselSlider.offsetWidth * slideIndex;
    carouselSlider.scrollTo({ left: leftSlideOffset, behavior: 'smooth' });
    leftSlideOffset = carouselSlider.offsetWidth * blockState.firstVisibleSlide;

    setTimeout(() => {
      carouselSlider.scrollTo({ left: leftSlideOffset, behavior: 'instant' });
    }, SLIDE_ANIMATION_DURATION_MS);

    // sync slide state
    [...carouselSlider.children].forEach((slide, index) => {
      if (index === blockState.firstVisibleSlide) {
        slide.removeAttribute('tabindex');
      } else {
        slide.setAttribute('tabindex', '-1');
      }
    });
    blockState.curSlide = blockState.firstVisibleSlide;
  }
}

/**
 * Based on the direction of a scroll snap the scroll position based on the
 * offset width of the scrollable element. The snap threshold is determined
 * by the direction of the scroll to ensure that snap direction is natural.
 * @param el the scrollable element
 * @param blockState Current block state
 * @param dir the direction of the scroll
 */
function snapScroll(el, blockState, dir = 1) {
  if (!el) {
    return;
  }

  const snapLimit = 0.25;
  let threshold = el.offsetWidth * snapLimit;
  if (dir >= 0) {
    threshold -= (threshold * snapLimit);
  } else {
    threshold += (threshold * snapLimit);
  }
  const block = Math.floor(el.scrollLeft / el.offsetWidth);
  const pos = el.scrollLeft - (el.offsetWidth * block);
  const snapToBlock = pos <= threshold ? block : block + 1;
  scrollToSlide(el.closest('.carousel'), blockState, snapToBlock);
}

/**
 * Build a navigation button for controlling the direction of carousel slides.
 * @param blockState Current block state
 * @param navigationDirection A string of either 'prev or 'next'
 * @return {HTMLDivElement} The resulting nav element
 */
function buildNav(blockState, navigationDirection) {
  const btn = document.createElement('div');
  btn.classList.add('carousel-nav', `carousel-nav-${navigationDirection}`);
  btn.addEventListener('click', (e) => {
    stopAutoScroll(blockState);
    let nextSlide = blockState.firstVisibleSlide;
    if (navigationDirection === NAVIGATION_DIRECTION_PREV) {
      nextSlide = blockState.curSlide === blockState.firstVisibleSlide
        ? 0
        : blockState.curSlide - 1;
    } else if (navigationDirection === NAVIGATION_DIRECTION_NEXT) {
      nextSlide = blockState.curSlide === blockState.maxVisibleSlides
        ? blockState.maxVisibleSlides + 1
        : blockState.curSlide + 1;
    }

    scrollToSlide(e.target.closest('.carousel'), blockState, nextSlide);
  });
  return btn;
}

/**
 * Decorate a base slide element.
 * @param blockState Current block state
 * @param slide A base block slide element
 * @param index The slide's position
 * @return {HTMLUListElement} A decorated carousel slide element
 */
function buildSlide(blockState, slide, index) {
  slide.setAttribute('id', `${SLIDE_ID_PREFIX}${index}`);
  slide.setAttribute('data-slide-index', index);
  if (index !== blockState.firstVisibleSlide) {
    slide.setAttribute('tabindex', '-1');
  }

  if (index === blockState.firstVisibleSlide
    || index === blockState.firstVisibleSlide + 1) {
    slide.querySelectorAll('img').forEach((image) => {
      image.loading = 'eager';
      image.fetchPriority = 'high';
    });
  }

  slide.classList.add('carousel-slide');

  if (slide.children.length === 3) {
    // image or video, alt-image and text
    slide.children[0].classList.add('carousel-main-image');
    const slideAltImage = slide.children[1];
    if (!slideAltImage.classList.contains('carousel-alt-video')) {
      slideAltImage.classList.add('carousel-alt-image');
    }
    slide.children[2].classList.add('carousel-text');
  } else {
    // image or video and text
    if (!slide.children[0].classList.contains('carousel-alt-video')) {
      slide.children[0].classList.add('carousel-only-image');
    }
    slide.children[1].classList.add('carousel-text');
  }

  slide.style.transform = `translateX(calc(${index * 100}%))`;
  return slide;
}

/**
 * Clone an existing carousel item
 * @param {Element} item carousel item to be cloned
 * @param targetIndex Index to use for the cloned item
 * @returns the clone of the carousel item
 */
function createClone(item, targetIndex) {
  const clone = item.cloneNode(true);
  clone.id = `${clone.id}-clone`;
  clone.setAttribute('data-slide-index', targetIndex);
  clone.style.transform = `translateX(${targetIndex * 100}%)`;
  return clone;
}

/**
 * Create clone items at the beginning and end of the carousel
 * to create the illusion of infinite scrolling
 * @param {Element} element carousel to add clones to
 */
function addClones(element) {
  if (element.children.length < 2) return;

  const initialChildren = [...element.children];

  const cloneForBeginning = createClone(initialChildren[initialChildren.length - 1], 0);
  element.firstChild.before(cloneForBeginning);
  element.firstChild.querySelectorAll('img').forEach((image) => {
    image.loading = 'eager';
  });

  const cloneForEnd = createClone(initialChildren[0], initialChildren.length + 1);
  element.lastChild.after(cloneForEnd);
}

/**
 * Start auto-scrolling
 * @param {*} block Block
 * @param blockState Current block state
 */
function startAutoScroll(block, blockState) {
  if (blockState.interval === 0) return; /* Means no auto-scrolling */

  if (!blockState.scrollInterval) {
    blockState.scrollInterval = setInterval(() => {
      const targetSlide = blockState.curSlide <= blockState.maxVisibleSlides
        ? blockState.curSlide + 1
        : 0;
      scrollToSlide(block, blockState, targetSlide);
    }, blockState.interval);
  }
}

/**
 * Decorate and transform a carousel block.
 * @param block HTML block from Franklin
 */
export default function decorate(block) {
  const blockState = new CarouselState(
    1,
    DEFAULT_CONFIG.interval,
    1,
    0,
  );

  // turn video links into displayable videos
  block.querySelectorAll('a').forEach((videoLink) => {
    const foundLink = videoLink.href;
    if (foundLink && foundLink.endsWith('.mp4')) {
      const divToReplace = videoLink.closest('div');
      const videoDiv = document.createElement('div');
      const videoElement = document.createElement('video');

      divToReplace.classList.add('carousel-alt-video');
      videoDiv.classList.add('carousel-video');

      videoElement.muted = true;
      videoElement.innerHTML = `<source src="${foundLink}" type="video/mp4">`;

      videoDiv.appendChild(videoElement);
      divToReplace.appendChild(videoElement);
      videoLink.remove();
    }
  });

  const carousel = document.createElement('div');
  carousel.classList.add('carousel-slide-container');

  const slides = [...block.children];
  blockState.maxVisibleSlides = slides.length;
  const slidesToAdd = new Array(blockState.maxVisibleSlides);
  slides.forEach((slide, index) => {
    slidesToAdd[index] = buildSlide(blockState, slide, index + 1);
  });

  carousel.append(...slidesToAdd);
  addClones(carousel);
  block.append(carousel);

  if (slides.length > 1) {
    const prevBtn = buildNav(blockState, 'prev');
    const nextBtn = buildNav(blockState, 'next');
    block.append(prevBtn, nextBtn);
  }

  const mediaVideoWidthQueryMatcher = window.matchMedia('only screen and (max-width: 1170px)');
  const mediaVideoWidthChangeHandler = (event) => {
    if (event.matches === false) {
      block.querySelectorAll('video').forEach((videoElement) => {
        videoElement.autoplay = true;
        videoElement.loop = true;
        videoElement.playsinline = true;
        videoElement.muted = true;
        videoElement.play();
      });
    } else {
      block.querySelectorAll('video').forEach((videoElement) => {
        videoElement.muted = true;
        videoElement.autoplay = false;
        videoElement.loop = false;
        videoElement.playsinline = false;
      });
    }
  };
  mediaVideoWidthChangeHandler(mediaVideoWidthQueryMatcher);

  setTimeout(() => {
    // scroll to first slide once all DOM has been built
    scrollToSlide(block, blockState, blockState.firstVisibleSlide, 'instant');
  }, 100);

  // make carousel draggable and swipeable
  let isDown = false;
  let startX = 0;
  let startScroll = 0;
  let prevScroll = 0;
  const movementStartEventHandler = (e) => {
    let offset = 0;
    if (e.changedTouches && e.changedTouches.length >= 1) {
      offset = e.changedTouches[0].screenX;
    } else {
      offset = e.pageX;
    }
    isDown = true;
    startX = offset - carousel.offsetLeft;
    startScroll = carousel.scrollLeft;
    prevScroll = startScroll;
  };
  carousel.addEventListener('mousedown', movementStartEventHandler, { passive: true });
  carousel.addEventListener('touchstart', movementStartEventHandler, { passive: true });

  carousel.addEventListener('mouseenter', () => {
    stopAutoScroll(blockState);
  });
  carousel.addEventListener('mouseleave', () => {
    if (isDown) {
      snapScroll(carousel, blockState, carousel.scrollLeft > startScroll ? 1 : -1);
    }
    startAutoScroll(block, blockState);
    isDown = false;
  });

  const movementEndEventHandler = () => {
    if (isDown) {
      snapScroll(carousel, blockState, carousel.scrollLeft > startScroll ? 1 : -1);
    }
    isDown = false;
  };
  carousel.addEventListener('mouseup', movementEndEventHandler, { passive: true });
  carousel.addEventListener('touchend', movementEndEventHandler, { passive: true });

  carousel.addEventListener('mousemove', (e) => {
    if (!isDown) {
      return;
    }
    e.preventDefault();

    const x = e.pageX - carousel.offsetLeft;
    const walk = (x - startX);
    carousel.scrollLeft = prevScroll - walk;
  });
  carousel.addEventListener('touchmove', (e) => {
    if (!isDown) {
      return;
    }
    const x = e.changedTouches[0].screenX - carousel.offsetLeft;
    const walk = (x - startX);
    carousel.scrollLeft = prevScroll - walk;
  }, { passive: true });

  const observer = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          startAutoScroll(block, blockState);
          mediaVideoWidthQueryMatcher.addEventListener('change', mediaVideoWidthChangeHandler);
        } else {
          stopAutoScroll(blockState);
          mediaVideoWidthQueryMatcher.removeEventListener('change', mediaVideoWidthChangeHandler);
        }
      });
    }
  }, {
    root: null,
    rootMargin: '0px',
    threshold: 1.0,
  });
  observer.observe(block);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopAutoScroll(blockState);
    } else {
      startAutoScroll(block, blockState);
    }
  });

  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      scrollToSlide(block, blockState, blockState.firstVisibleSlide, 'instant');
    }, 500);
  });
}
