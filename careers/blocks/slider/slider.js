let visibleSlides = 3;

const isADesktop = () => {
  const mediaDesktop = window.matchMedia('only screen and (min-width: 1170px)');
  return mediaDesktop.matches;
};

const getPositionX = (event) => (event.type.includes('mouse')
  ? event.pageX
  : event.touches[0].clientX);

const setSliderPosition = (currentTranslate, slider) => {
  slider.style.transform = `translateX(${currentTranslate}px)`;
};

export default function decorate(block) {
  const cardWrapper = document.createElement('div');
  cardWrapper.classList.add('card-wrapper');

  block.querySelectorAll('div.slider > div').forEach((div) => {
    block.classList.forEach((className) => {
      if (className.startsWith('max-visible-')) {
        // If the classname is 'max-visible-4', numberOfCardsDisplayed = 4
        visibleSlides = className.substring(12);
      }
    });
    cardWrapper.appendChild(div);
    div.classList.add('card');

    const picture = div.querySelector('picture');
    if (picture) {
      const imageParent = picture.closest('div');
      imageParent.classList.add('card-image');
      div.classList.add('tall-card');
    }

    const contentDivs = div.querySelectorAll(':scope > div:not(.card-image)');
    contentDivs[0].classList.add('short-description');
  });

  block.appendChild(cardWrapper);

  // add slider arrow buttons
  const slides = [...block.querySelectorAll('.card')];
  if (slides.length > visibleSlides) {
    const arrowLeft = document.createElement('div');
    arrowLeft.classList.add('slider-button', 'left');
    block.appendChild(arrowLeft);

    const arrowRight = document.createElement('div');
    arrowRight.classList.add('slider-button', 'right');
    block.appendChild(arrowRight);
  }

  const shortDescriptionDivs = block.querySelectorAll('.short-description');
  shortDescriptionDivs.forEach((div) => {
    const ellipsableText = div.querySelector('p');
    const fullTextContent = ellipsableText && ellipsableText.innerText;

    const clickableCloseButton = document.createElement('span');

    clickableCloseButton.classList.add('hidden-close-button');

    clickableCloseButton.innerHTML = '';
    clickableCloseButton.classList.add('close-button');
    div.append(clickableCloseButton);

    ellipsableText?.addEventListener('click', () => {
      div.classList.add('extended-text');
      ellipsableText.innerHTML = `${fullTextContent}`;
      clickableCloseButton.classList.remove('hidden-close-button');
      clickableCloseButton.classList.add('active-close-button');
    });
    clickableCloseButton.addEventListener('click', () => {
      div.classList.remove('extended-text');
      clickableCloseButton.classList.remove('active-close-button');
      clickableCloseButton.classList.add('hidden-close-button');
    });
  });

  let isDragging = false;
  let startPos = 0;
  let currentTranslate = 0;
  let prevTranslate = 0;
  let animationID = 0;
  let currentIndex = 0;
  let indexFactor = 0;

  function animation() {
    setSliderPosition(currentTranslate, cardWrapper);
    if (isDragging) {
      requestAnimationFrame(animation);
    }
  }

  function touchStart(index) {
    return (event) => {
      currentIndex = index;
      startPos = getPositionX(event);
      isDragging = true;
    };
  }

  function setPositionByIndex() {
    if (currentIndex === 0) {
      currentTranslate = 0;
    } else if (currentIndex === slides.length) {
      currentTranslate = prevTranslate;
    } else {
      currentTranslate = prevTranslate - (indexFactor) * (slides[0].offsetWidth + 10);
    }
    prevTranslate = currentTranslate;
    setSliderPosition(currentTranslate, cardWrapper);
  }

  function touchEnd() {
    isDragging = false;

    const movedBy = currentTranslate - prevTranslate;
    if ((!isADesktop() || slides.length > visibleSlides)
      && movedBy < 0 && currentIndex < slides.length) {
      currentIndex += 1;
      indexFactor = 1;
    }
    if ((!isADesktop() || slides.length > visibleSlides)
      && movedBy > 0 && currentIndex > 0) {
      currentIndex -= 1;
      indexFactor = -1;
    }

    if (movedBy !== 0) {
      setPositionByIndex();
    }
    cancelAnimationFrame(animationID);
  }

  block.querySelector('.slider-button.left')?.addEventListener('click', () => {
    if (currentIndex > 0) {
      currentIndex -= 1;
      indexFactor = -1;
      setPositionByIndex();
    }
  }, { passive: true });

  block.querySelector('.slider-button.right')?.addEventListener('click', () => {
    if (slides.length - currentIndex > visibleSlides) {
      currentIndex += 1;
      indexFactor = 1;
      setPositionByIndex();
    }
  }, { passive: true });

  function touchMove(event) {
    if (isDragging) {
      animationID = requestAnimationFrame(animation);
      const currentPosition = getPositionX(event);
      currentTranslate = prevTranslate + currentPosition - startPos;
    }
  }

  // Card slider animation
  slides.forEach((slide, index) => {
    const slideImage = slide.querySelector('img');
    slideImage?.addEventListener('dragstart', (e) => e.preventDefault());
    slide.addEventListener('touchstart', touchStart(index), { passive: true });
    slide.addEventListener('touchend', touchEnd, { passive: true });
    slide.addEventListener('touchmove', touchMove, { passive: true });
    slide.addEventListener('mousedown', touchStart(index), { passive: true });
    slide.addEventListener('mouseup', touchEnd, { passive: true });
    slide.addEventListener('mouseleave', touchEnd, { passive: true });
    slide.addEventListener('mousemove', touchMove, { passive: true });
  });
}
