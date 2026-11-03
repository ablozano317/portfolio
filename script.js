// script.js
document.documentElement.classList.add('section-navigation-page');


window.onload = function() {
    const loadingScreen = document.getElementById('loading-screen');
    const mainContent = document.getElementById('main-content');

    if (loadingScreen && mainContent) {
        loadingScreen.classList.add('fade-out');
        mainContent.classList.add('loaded');

        loadingScreen.addEventListener('transitionend', () => {
            loadingScreen.remove();
        });
    }

    
    const flourish = document.querySelector('.flourish');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const sections = Array.from(document.querySelectorAll('#main-content > section'));
    const sectionButtons = document.querySelectorAll('.section-nav-button[data-section-step]');
    const sectionTabs = document.querySelectorAll('.section-tab[data-section-target]');
    const typingCompletionTimers = new WeakMap();

    if (sections.length && sectionButtons.length) {
        const hashSectionIndex = sections.findIndex((section) => `#${section.id}` === window.location.hash);
        let activeSectionIndex = hashSectionIndex >= 0 ? hashSectionIndex : 0;
        const restartTyping = (section) => {
            section.querySelectorAll('h1.typing-heading').forEach((heading) => {
                window.clearTimeout(typingCompletionTimers.get(heading));
                typingCompletionTimers.delete(heading);
                heading.classList.remove('typing-complete');
                heading.style.animation = 'none';
                heading.offsetHeight;          // force reflow
                heading.style.animation = '';
            });
};

        const showSection = (index, shouldScroll = true, scrollBehavior = prefersReducedMotion ? 'auto' : 'smooth') => {
            if (index < 0 || index >= sections.length) {
                return;
            }

            activeSectionIndex = index;
            restartTyping(sections[activeSectionIndex]);
            sections.forEach((section, sectionIndex) => {
                const isActive = sectionIndex === activeSectionIndex;
                section.hidden = !isActive;
                section.classList.toggle('section-current', isActive);
            });

            sectionButtons.forEach((button) => {
                const step = button.dataset.sectionStep === 'next' ? 1 : -1;
                button.disabled = activeSectionIndex + step < 0 || activeSectionIndex + step >= sections.length;
            });

            sectionTabs.forEach((tab) => {
                const isActive = tab.dataset.sectionTarget === sections[activeSectionIndex].id;
                if (isActive) {
                    tab.setAttribute('aria-current', 'page');
                } else {
                    tab.removeAttribute('aria-current');
                }
            });

            if (shouldScroll) {
                const activeSection = sections[activeSectionIndex];
                activeSection.focus({ preventScroll: true });
                activeSection.scrollIntoView({
                    behavior: scrollBehavior,
                    block: 'center'
                });
            }
        };

        sections.forEach((section) => {
            section.tabIndex = -1;
        });

        restartTyping(sections[activeSectionIndex]);
        showSection(activeSectionIndex, true, 'auto');

        sectionButtons.forEach((button) => {
            button.addEventListener('click', () => {
                const direction = button.dataset.sectionStep === 'next' ? 1 : -1;
                showSection(activeSectionIndex + direction);
            });
        });

        sectionTabs.forEach((tab) => {
            tab.addEventListener('click', () => {
                const targetIndex = sections.findIndex((section) => section.id === tab.dataset.sectionTarget);
                showSection(targetIndex);
            });
        });

        document.querySelectorAll('#main-content a[href^="#"]').forEach((link) => {
            link.addEventListener('click', (event) => {
                const targetIndex = sections.findIndex((section) => `#${section.id}` === link.getAttribute('href'));
                if (targetIndex >= 0) {
                    event.preventDefault();
                    showSection(targetIndex);
                }
            });
        });
    }

    document.querySelectorAll('h1').forEach((heading) => {
        heading.classList.add('typing-heading');
        heading.style.setProperty('--typing-steps', heading.textContent.trim().length);
        heading.style.setProperty('--typing-duration', `${Math.max(0.7, heading.textContent.trim().length * 0.055)}s`);

        heading.addEventListener('animationend', (event) => {
            if (event.animationName === 'heading-type') {
                const cursorDelay = heading.classList.contains('projects-header') ? 0 : 2000;
                const timer = window.setTimeout(() => {
                    heading.classList.add('typing-complete');
                    typingCompletionTimers.delete(heading);
                }, cursorDelay);
                typingCompletionTimers.set(heading, timer);
            }
        });
    });

   if (!prefersReducedMotion) {
    document.querySelectorAll('.flourish, .about-flourish, .contact-flourish, .projects-flourish').forEach((target) => {
        const textWalker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT);
        const textNodes = [];

        while (textWalker.nextNode()) {
            textNodes.push(textWalker.currentNode);
        }

        textNodes.forEach((textNode) => {
            const characters = document.createDocumentFragment();

            for (const character of textNode.textContent) {
                // skip blanks so you don't create thousands of empty spans
                if (character === '\u2800' || character === ' ' || character === '\n') {
                    characters.append(document.createTextNode(character));
                    continue;
                }
                const characterElement = document.createElement('span');
                characterElement.className = 'flourish-character';
                characterElement.textContent = character;
                characterElement.style.setProperty('--typing-delay', `${Math.random() * 1600}ms`);
                characters.append(characterElement);
            }

            textNode.replaceWith(characters);
        });
    });
}
    if ('IntersectionObserver' in window) {
        const revealElements = document.querySelectorAll(
            '.project-item, .case-study-feature, .case-study-intro, ' +
            '.case-study-hero-image, .case-study-section'
        );
        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.05 });

        revealElements.forEach((element) => {
            element.classList.add('scroll-reveal');
            revealObserver.observe(element);
        });
    }
    

    const projectList = document.getElementById('project-list');
    const projectItems = projectList ? Array.from(projectList.querySelectorAll('.project-item')) : [];
    const rewindButton = document.getElementById('project-rewind');
    const forwardButton = document.getElementById('project-forward');

    if (projectList && projectItems.length && rewindButton && forwardButton) {
        let currentAbsoluteIndex = 0;
        let scrollAnimationFrame;

        projectItems.forEach((item) => {
            const clone = item.cloneNode(true);
            clone.setAttribute('aria-hidden', 'true');
            clone.classList.remove('scroll-reveal');
            projectList.append(clone);
        });

        const getLoopWidth = () => {
            const clonedFirstItem = projectList.children[projectItems.length];
            return clonedFirstItem.getBoundingClientRect().left -
                projectItems[0].getBoundingClientRect().left;
        };


        const getVisibleCount = () => {
            const itemWidth = projectItems[0].getBoundingClientRect().width;
            const gap = parseFloat(window.getComputedStyle(projectList).columnGap) || 0;
            return Math.max(1, Math.floor((projectList.clientWidth + gap) / (itemWidth + gap)));
        };

        const getMaxIndex = () => Math.max(0, projectItems.length - getVisibleCount());

        const updateControls = () => {
            rewindButton.disabled = false;
            forwardButton.disabled = false;
        };

        const moveToProject = (index) => {
            const targetIndex = Math.max(0, Math.min(index, projectList.children.length - 1));
            const targetItem = projectList.children[targetIndex];
            const listLeft = projectList.getBoundingClientRect().left;
            const projectLeft = targetItem.getBoundingClientRect().left;
            const start = projectList.scrollLeft;
            const target = start + projectLeft - listLeft;
            currentAbsoluteIndex = targetIndex;

            if (scrollAnimationFrame) {
                window.cancelAnimationFrame(scrollAnimationFrame);
                scrollAnimationFrame = undefined;
            }

            const finishMove = () => {
                const loopWidth = getLoopWidth();
                if (loopWidth > 0 && projectList.scrollLeft >= loopWidth) {
                    projectList.scrollLeft -= loopWidth;
                    currentAbsoluteIndex -= projectItems.length;
                }
                updateControls();
            };

            if (prefersReducedMotion) {
                projectList.scrollLeft = target;
                finishMove();
            } else {
                let startTime;
                const animateScroll = (time) => {
                    if (startTime === undefined) {
                        startTime = time;
                    }
                    const progress = Math.min((time - startTime) / 800, 1);
                    const easedProgress = progress < 0.5
                        ? 16 * progress ** 5
                        : 1 - ((-2 * progress + 2) ** 5) / 2;
                    projectList.scrollLeft = start + (target - start) * easedProgress;

                    if (progress < 1) {
                        scrollAnimationFrame = window.requestAnimationFrame(animateScroll);
                    } else {
                        scrollAnimationFrame = undefined;
                        finishMove();
                    }
                };
                scrollAnimationFrame = window.requestAnimationFrame(animateScroll);
            }
            updateControls();
        };

        rewindButton.addEventListener('click', () => {
            if (currentAbsoluteIndex === 0) {
                projectList.scrollLeft += getLoopWidth();
                currentAbsoluteIndex = projectItems.length;
            }
            moveToProject(currentAbsoluteIndex - 1);
        });
        forwardButton.addEventListener('click', () => {
            moveToProject(currentAbsoluteIndex + 1);
        });

        projectList.addEventListener('scroll', () => {
            updateCardEmphasis();
            const listLeft = projectList.getBoundingClientRect().left;
            const allItems = Array.from(projectList.children);
            const nearestIndex = allItems.reduce((bestIndex, item, index) => {
                const nearestDistance = Math.abs(allItems[bestIndex].getBoundingClientRect().left - listLeft);
                const itemDistance = Math.abs(item.getBoundingClientRect().left - listLeft);
                return                 itemDistance < nearestDistance ? index : bestIndex;
            }, 0);
            if (!scrollAnimationFrame) {
                currentAbsoluteIndex = nearestIndex;
            }
            updateControls();
        });
        ['pointerdown', 'touchstart', 'wheel'].forEach((eventName) => {
            projectList.addEventListener(eventName, () => {
                if (scrollAnimationFrame) {
                    window.cancelAnimationFrame(scrollAnimationFrame);
                    scrollAnimationFrame = undefined;
                }
            }, { passive: true });
        });

        window.addEventListener('resize', updateControls);
        updateControls();
        updateCardEmphasis();
    }
(function () {
  const symbols = ['⟡', '✦', '˖', '⁺', '₊', '˚', '⊹', '‧'];
  const canTrail = window.matchMedia('(hover: hover)').matches &&
                   !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!canTrail) return;

  let lastX = 0;
  let lastY = 0;
  const spacing = 24;         /* px of movement between symbols */

  document.addEventListener('mousemove', (event) => {
    const dx = event.clientX - lastX;
    const dy = event.clientY - lastY;
    if (Math.hypot(dx, dy) < spacing) return;

    lastX = event.clientX;
    lastY = event.clientY;

    const trail = document.createElement('span');
    trail.className = 'cursor-trail';
    trail.textContent = symbols[Math.floor(Math.random() * symbols.length)];
    trail.style.left = `${event.clientX}px`;
    trail.style.top = `${event.clientY}px`;
    document.body.append(trail);

    trail.addEventListener('animationend', () => trail.remove());
  });
})();

};



 // make image change on hover

 