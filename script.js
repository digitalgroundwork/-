// interactive 3D logo mark — pointer tilt + slow idle drift
// (only runs if a #logo3dStage / #logo3dObj exist on the page)
(function(){
  const stage = document.getElementById('logo3dStage');
  const obj = document.getElementById('logo3dObj');
  if(!stage || !obj) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduceMotion){ return; }

  const maxTilt = 16;
  let targetX = 0, targetY = 0;
  let curX = 0, curY = 0;
  let hovering = false;
  let t = 0;

  function setTargetFromPoint(clientX, clientY){
    const rect = stage.getBoundingClientRect();
    const relX = (clientX - rect.left) / rect.width;
    const relY = (clientY - rect.top) / rect.height;
    targetY = (relX - 0.5) * 2 * maxTilt;
    targetX = -(relY - 0.5) * 2 * maxTilt;
  }

  stage.addEventListener('pointermove', (e) => {
    hovering = true;
    setTargetFromPoint(e.clientX, e.clientY);
  });
  stage.addEventListener('pointerdown', (e) => {
    hovering = true;
    setTargetFromPoint(e.clientX, e.clientY);
  });
  stage.addEventListener('pointerleave', () => { hovering = false; });
  stage.addEventListener('pointerup', () => { hovering = false; });
  stage.addEventListener('pointercancel', () => { hovering = false; });

  function frame(){
    t += 0.006;
    const idleY = Math.sin(t) * 7;
    const idleX = Math.cos(t * 0.8) * 3.5;
    const idleLift = Math.sin(t * 0.9) * 6;

    const wantX = hovering ? targetX : idleX;
    const wantY = hovering ? targetY : idleY;

    curX += (wantX - curX) * 0.07;
    curY += (wantY - curY) * 0.07;

    const lift = hovering ? 0 : idleLift;

    obj.style.transform = `translateY(${lift}px) rotateX(${curX}deg) rotateY(${curY}deg)`;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();

// scroll reveal — applies to every .reveal / .dim-divider on any page
const revealEls = document.querySelectorAll('.reveal, .dim-divider');
const io = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });
revealEls.forEach(el => io.observe(el));

// live site preview embeds: works for any number of .browser-body blocks on
// a page (homepage teaser, work page, future case-study pages, etc). If an
// iframe hasn't loaded shortly, assume the host blocks framing and fall
// back to the "open it directly" card instead of showing a blank box.
document.querySelectorAll('.browser-body').forEach((body) => {
  const frame = body.querySelector('iframe');
  const fallback = body.querySelector('.frame-fallback');
  if (!frame || !fallback) return;

  let frameLoaded = false;
  frame.addEventListener('load', () => { frameLoaded = true; });
  setTimeout(() => {
    if (!frameLoaded) {
      frame.style.display = 'none';
      fallback.classList.add('show');
    }
  }, 3500);
});

// quote form submission — only runs on pages that have #quoteForm
// This posts to Formspree (https://formspree.io) — a free service that emails
// form submissions straight to your inbox with no backend of your own required.
// TO ACTIVATE: create a free Formspree form, then replace YOUR_FORM_ID below
// with the ID from your Formspree dashboard URL (e.g. https://formspree.io/f/xxxxabcd).
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/YOUR_FORM_ID';

const form = document.getElementById('quoteForm');
if (form) {
  const msg = document.getElementById('ctaMsg');
  const submitBtn = document.getElementById('ctaSubmit');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (FORMSPREE_ENDPOINT.includes('YOUR_FORM_ID')) {
      msg.textContent = "Form isn't connected yet — add your Formspree ID in the code to go live.";
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';
    msg.textContent = '';

    try {
      const response = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: new FormData(form)
      });

      if (response.ok) {
        msg.textContent = "Got it — we'll be in touch within a day.";
        form.reset();
      } else {
        msg.textContent = "Something went wrong — mind trying again, or emailing us directly?";
      }
    } catch (err) {
      msg.textContent = "Something went wrong — mind trying again, or emailing us directly?";
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send it';
    }
  });
}
