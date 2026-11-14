/* ui.js — penyempurna tampilan (tanpa mengubah app.js)
   - nav unit: bisa digeser (sentuh, seret mouse, roda mouse), chip aktif terlihat
   - penanda aktif yang meluncur antar-unit
   - header tersembunyi saat menggulir turun di ponsel, muncul lagi saat naik
   - gerak halaman saat pindah unit
   Semua fitur bersifat tambahan: bila berkas ini gagal dimuat, situs tetap jalan. */
(function () {
  'use strict';
  try {
    var root = document.documentElement;
    var header = document.getElementById('top');
    var nav = document.getElementById('nav');
    var wrap = document.getElementById('navwrap');
    var ind = document.getElementById('navind');
    var main = document.getElementById('app');
    var pop = document.getElementById('setPop');
    var ov = document.getElementById('ov');
    if (!header || !nav || !wrap || !ind || !main) return;

    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    var phone = window.matchMedia('(max-width: 759px)');
    root.classList.add('has-ui');

    /* ---------- tinggi header → variabel CSS ---------- */
    function setHH() { root.style.setProperty('--hh', header.offsetHeight + 'px'); }
    setHH();
    if (window.ResizeObserver) new ResizeObserver(setHH).observe(header);
    else window.addEventListener('resize', setHH);

    /* ---------- bayangan tepi pada nav yang bisa digeser ---------- */
    function edges() {
      var max = nav.scrollWidth - nav.clientWidth;
      wrap.style.setProperty('--fl', nav.scrollLeft > 2 ? '28px' : '0px');
      wrap.style.setProperty('--fr', nav.scrollLeft < max - 2 ? '28px' : '0px');
      nav.classList.toggle('can-scroll', max > 2);
    }

    /* ---------- penanda aktif ---------- */
    var lastKey = null;
    function revealActive(a) {
      var max = nav.scrollWidth - nav.clientWidth;
      if (max <= 2) return;
      var left = a.offsetLeft - nav.offsetLeft;
      var vis0 = nav.scrollLeft, vis1 = vis0 + nav.clientWidth;
      if (left < vis0 + 16 || left + a.offsetWidth > vis1 - 16) {
        nav.style.scrollBehavior = 'auto';
        nav.scrollLeft = Math.max(0, Math.min(max, left - (nav.clientWidth - a.offsetWidth) / 2));
        nav.style.scrollBehavior = '';
      }
    }
    function place() {
      var a = nav.querySelector('a.active');
      if (!a) { ind.classList.add('off'); lastKey = null; edges(); return; }
      var key = a.getAttribute('href');
      var changed = key !== lastKey;
      if (changed) revealActive(a);
      var wr = wrap.getBoundingClientRect();
      var ar = a.getBoundingClientRect();
      var animate = changed && lastKey !== null && !reduce.matches;
      ind.classList.toggle('move', animate);
      ind.classList.remove('off');
      ind.style.width = ar.width + 'px';
      ind.style.height = ar.height + 'px';
      ind.style.transform = 'translate(' + (ar.left - wr.left) + 'px,' + (ar.top - wr.top) + 'px)';
      lastKey = key;
      edges();
    }
    var raf = 0;
    function schedulePlace() {
      if (raf) return;
      raf = requestAnimationFrame(function () { raf = 0; place(); });
    }
    new MutationObserver(schedulePlace).observe(nav, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    nav.addEventListener('scroll', schedulePlace, { passive: true });
    window.addEventListener('resize', schedulePlace);
    window.addEventListener('hashchange', schedulePlace);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(schedulePlace);
    schedulePlace();

    /* ---------- geser dengan roda mouse ---------- */
    nav.addEventListener('wheel', function (e) {
      if (nav.scrollWidth - nav.clientWidth <= 2) return;
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        nav.scrollLeft += e.deltaY;
        e.preventDefault();
      }
    }, { passive: false });

    /* ---------- geser dengan seret mouse (nav dan linimasa) ---------- */
    var drag = null, suppress = false, DRAGSEL = 'nav.units, .tl';
    document.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0 || !e.target.closest) return;
      var el = e.target.closest(DRAGSEL);
      if (!el || el.scrollWidth <= el.clientWidth + 2) return;
      drag = { el: el, x: e.clientX, s: el.scrollLeft, moved: false };
    });
    document.addEventListener('pointermove', function (e) {
      if (!drag) return;
      var dx = e.clientX - drag.x;
      if (!drag.moved && Math.abs(dx) > 5) { drag.moved = true; drag.el.classList.add('dragging'); }
      if (drag.moved) drag.el.scrollLeft = drag.s - dx;
    });
    function endDrag() {
      if (drag && drag.moved) {
        drag.el.classList.remove('dragging');
        suppress = true;
        setTimeout(function () { suppress = false; }, 0);
      }
      drag = null;
    }
    document.addEventListener('pointerup', endDrag);
    document.addEventListener('pointercancel', endDrag);
    document.addEventListener('click', function (e) {
      if (suppress) { e.preventDefault(); e.stopPropagation(); }
    }, true);
    document.addEventListener('dragstart', function (e) {
      if (e.target.closest && e.target.closest(DRAGSEL)) e.preventDefault();
    });

    /* ---------- header: sembunyi saat turun, muncul saat naik (ponsel) ---------- */
    var lastY = window.pageYOffset || 0, ticking = false;
    function popupOpen() {
      return (pop && !pop.classList.contains('hidden')) || (ov && !ov.classList.contains('hidden'));
    }
    function onScroll() {
      ticking = false;
      var y = Math.max(0, window.pageYOffset || 0);
      var dy = y - lastY;
      header.classList.toggle('scrolled', y > 4);
      if (!phone.matches || popupOpen() || y < 90) {
        header.classList.remove('hide');
      } else if (dy > 8) {
        header.classList.add('hide');
      } else if (dy < -8) {
        header.classList.remove('hide');
      }
      if (Math.abs(dy) > 8 || y < 90) lastY = y;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
    }, { passive: true });
    onScroll();

    /* ---------- gerak halaman saat pindah unit ---------- */
    var lastHash = location.hash, flip = false;
    function afterRender() {
      document.body.classList.toggle('wide-page', main.classList.contains('wide') || !!main.querySelector('.ulay'));
      if (location.hash === lastHash) return;
      lastHash = location.hash;
      header.classList.remove('hide');
      if (reduce.matches) return;
      flip = !flip;
      main.classList.remove('ea', 'eb');
      main.classList.add(flip ? 'eb' : 'ea');
    }
    new MutationObserver(afterRender).observe(main, { childList: true, attributes: true, attributeFilter: ['class'] });
    afterRender();
  } catch (err) {
    if (window.console) console.warn('ui.js dinonaktifkan:', err);
  }
})();
