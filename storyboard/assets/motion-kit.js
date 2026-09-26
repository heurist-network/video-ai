/* Motion recipes adapted from Antonia's Minara feature videos.
 * See ../references/motion-patterns.md and ./LICENSE.minara.txt.
 * No renderer or animation loop: apply a complete state at an absolute time.
 */
(function (root) {
  'use strict';
  const clamp = (v) => Math.max(0, Math.min(1, v));
  const progress = (time, start, duration) => duration <= 0
    ? Number(time >= start) : clamp((time - start) / duration);
  // GSAP power3 is quartic, not cubic.
  const power3Out = (t) => 1 - Math.pow(1 - t, 4);
  const power3InOut = (t) => t < 0.5
    ? 8 * Math.pow(t, 4) : 1 - Math.pow(-2 * t + 2, 4) / 2;
  const lerp = (a, b, t) => a + (b - a) * t;

  function textPop(elements, time, options = {}) {
    const { start = 0.2, duration = 0.58, stagger = 0.18,
      lift = 24, scale = 0.94, blur = 12 } = options;
    Array.from(elements).forEach((element, index) => {
      const k = power3Out(progress(time, start + index * stagger, duration));
      element.style.opacity = String(k);
      element.style.transform = `translateY(${lift * (1 - k)}px) scale(${lerp(scale, 1, k)})`;
      element.style.filter = `blur(${blur * (1 - k)}px)`;
    });
  }

  function camera(rig, time, options) {
    const { start = 0, duration = 0.78,
      from = { x: 0, y: 0, scale: 1 }, to } = options;
    const k = power3InOut(progress(time, start, duration));
    rig.style.transformOrigin = '50% 50%';
    rig.style.transform = `translate(${lerp(from.x, to.x, k)}px, ${lerp(from.y, to.y, k)}px) scale(${lerp(from.scale, to.scale, k)})`;
  }

  const api = { textPop, camera };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ShowcaseMotion = api;
})(typeof window !== 'undefined' ? window : globalThis);
