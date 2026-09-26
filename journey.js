(() => {
  const pages = ['assessment.html', 'review.html', 'skills-assessment.html', 'results.html', 'next-steps.html'];
  const flags = ['north-star-review-complete', 'north-star-skills-complete', 'north-star-results-complete'];
  const rated = value => Number.isInteger(value) && value >= 0 && value <= 3;
  const completion = () => {
    let profile = {};
    try { profile = JSON.parse(sessionStorage.getItem('pathfinder-student-profile-v1')) || {}; }
    catch { /* Invalid saved answers count as incomplete. */ }
    const profileDone = Array.from({ length: 10 }, (_, i) => rated(profile.skills?.[i])).every(Boolean)
      && Array.from({ length: 6 }, (_, i) => rated(profile.interest?.[i])).every(Boolean)
      && Array.from({ length: 3 }, (_, i) => Number.isInteger(profile.style?.[i]) && profile.style[i] >= 0 && profile.style[i] <= 1).every(Boolean);
    const done = [profileDone];
    flags.forEach(key => done.push(done.at(-1) && sessionStorage.getItem(key) === 'true'));
    return done;
  };
  const firstOpen = completion().findIndex(value => !value);
  const unlocked = firstOpen === -1 ? 4 : firstOpen;
  const current = pages.indexOf(location.pathname.split('/').pop());
  if (current > unlocked) {
    location.replace(pages[unlocked]);
    return;
  }

  const nav = document.querySelector('.flow-nav');
  const render = () => {
    const complete = completion();
    const firstOpen = complete.findIndex(value => !value);
    const allowed = firstOpen === -1 ? 4 : firstOpen;
    [...nav.children].forEach((step, index) => {
      if (index > allowed && step.tagName === 'A') {
        const locked = document.createElement('span');
        locked.textContent = step.textContent;
        locked.setAttribute('aria-disabled', 'true');
        step.replaceWith(locked);
        step = locked;
      }
      step.classList.toggle('completed', !!complete[index]);
      step.setAttribute('aria-label', `Step ${index + 1} of 5: ${step.textContent.trim()}${complete[index] ? ', completed' : index === current ? ', current' : ', locked'}`);
    });
  };
  window.updateJourney = render;
  render();

  if (current === 1) document.querySelector('a[href="skills-assessment.html"]:not(.flow-nav a)')?.addEventListener('click', () => sessionStorage.setItem(flags[0], 'true'));
  if (current === 2) document.querySelector('a[href="results.html"]:not(.flow-nav a)')?.addEventListener('click', () => sessionStorage.setItem(flags[1], 'true'));
  if (current === 3) document.querySelector('a[href="next-steps.html"]:not(.flow-nav a)')?.addEventListener('click', () => sessionStorage.setItem(flags[2], 'true'));
})();
