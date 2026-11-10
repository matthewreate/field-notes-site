// The floor page (floor/): its figures come in as you scroll. Every figure is
// already complete in the HTML; this only animates it. Nothing runs if the
// reader asked for reduced motion.
(() => {
  if (!matchMedia("(prefers-reduced-motion: no-preference)").matches) return;
  document.documentElement.classList.add("anim");

  // Dots and records drop in once, when their figure comes into view.
  const io = new IntersectionObserver((seen) => {
    for (const e of seen) if (e.isIntersecting) { e.target.classList.add("on"); io.unobserve(e.target); }
  }, { threshold: 0.3 });
  document.querySelectorAll(".fig, .shoe").forEach((el) => io.observe(el));

  // The record turns and the crate flips with the scroll itself.
  const rec = document.querySelector(".record");
  const segs = rec ? [...rec.querySelectorAll(".seg")] : [];
  const spin = rec && rec.querySelector(".spin");
  const reveal = document.querySelector(".crate .reveal");
  const crate = reveal && reveal.closest(".fig");
  const ball = document.querySelector(".rail .dd");
  const clamp = (x) => Math.min(1, Math.max(0, x));
  // 0 as a figure's top comes up from the bottom of the screen, 1 once it's centered.
  const progress = (el) => {
    const r = el.getBoundingClientRect(), vh = innerHeight;
    return clamp((vh - r.top) / (vh / 2 + r.height / 2));
  };

  let queued = false;
  const frame = () => {
    queued = false;
    if (rec) {
      const p = progress(rec);
      spin.style.transform = `rotate(${(p - 1) * 200}deg)`;
      // the two halves ink in one after the other
      segs.forEach((s, i) => {
        const q = clamp((p - i * 0.4) / 0.55);
        s.style.strokeDashoffset = 100 - 100 * q;
      });
    }
    if (crate) reveal.setAttribute("width", 364 * progress(crate));
    if (ball) {   // the disco ball swings a little, and lights up near the end of the page
      const doc = document.documentElement;
      const q = clamp(scrollY / Math.max(1, doc.scrollHeight - innerHeight));
      ball.style.setProperty("--sway", `${Math.sin(scrollY / 140) * 3}deg`);
      ball.style.setProperty("--lit", clamp((q - 0.55) / 0.4).toFixed(3));
    }
  };
  segs.forEach((s) => { s.style.strokeDasharray = "100 100"; });
  addEventListener("scroll", () => { if (!queued) { queued = true; requestAnimationFrame(frame); } }, { passive: true });
  addEventListener("resize", frame);
  frame();
})();
