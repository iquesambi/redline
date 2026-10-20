(function () {
  'use strict';

  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  var mq = window.matchMedia('(max-width: 760px)');
  var isMobile = function () { return mq.matches; };
  var clamp = function (v) { return Math.max(0, Math.min(1, v)); };
  var ease = function (v) { return v < 0.5 ? 2 * v * v : 1 - Math.pow(-2 * v + 2, 2) / 2; };
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var el = function (tag, cls, html) { var n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
  var BOLT = '<svg width="12" height="16" viewBox="0 0 14 18" aria-hidden="true"><path d="M9 0L0 10.5h5.5L4 18l10-11H8.2z" fill="#D7261E"/></svg>';

  /* ---------------- Mobile menu ---------------- */
  var header = $('#header');
  var menu = $('#mobileMenu');
  var openBtn = $('#menuOpen');
  function setMenu(open) {
    menu.hidden = !open;
    header.classList.toggle('menu-open', open);
    openBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) $('#menuClose').focus();
  }
  openBtn.addEventListener('click', function () { setMenu(true); });
  $('#menuClose').addEventListener('click', function () { setMenu(false); openBtn.focus(); });
  $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) { setMenu(false); openBtn.focus(); } });

  /* ---------------- Hero animation ---------------- */
  (function () {
    var root = $('#heroAnim');
    var rowsWrap = $('[data-ha="rows"]', root);
    var scan = $('[data-ha="scan"]', root);
    var foundWrap = $('[data-ha="found"]', root);
    var ROW = 62, DUR = 10000;
    var defs = [
      { num: '1.1', title: 'Base compensation', amount: 0, w1: '92%', w2: '64%' },
      { num: '2.3', title: 'Tail coverage', amount: 6500, w1: '86%', w2: '58%' },
      { num: '3.2', title: 'Call schedule', amount: 2100, w1: '78%', w2: '70%' },
      { num: '4.1', title: 'Benefits', amount: 0, w1: '90%', w2: '48%' },
      { num: '5.4', title: 'Signing bonus repayment', amount: 1400, w1: '84%', w2: '62%' },
      { num: '6.1', title: 'Non-solicitation', amount: 0, w1: '74%', w2: '55%' }
    ];
    var n = defs.length;
    var money = function (v) { return '$' + v.toLocaleString('en-US'); };
    var rows = defs.map(function (d) {
      var r = el('div', 'ha-row');
      r.innerHTML = '<span class="ha-num">' + d.num + '</span>' +
        '<div class="ha-body"><span class="ha-title">' + d.title + '</span>' +
        '<div class="ha-line" style="width:' + d.w1 + '"></div><div class="ha-line l2" style="width:' + d.w2 + '"></div>' +
        '<div class="ha-strike s1"></div><div class="ha-strike s2"></div></div>' +
        (d.amount ? '<span class="ha-tag">+' + money(d.amount) + '</span>'
                  : '<span class="ha-ok"><svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#2A7454" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 6.2l2.3 2.3 4.7-5"/></svg></span>');
      rowsWrap.appendChild(r);
      var f = null;
      if (d.amount) {
        f = el('div', 'ha-found-row', '<span>' + d.title + '</span><span>+' + money(d.amount) + '</span>');
        foundWrap.appendChild(f);
      }
      return { d: d, row: r, title: $('.ha-title', r), s1: $('.s1', r), s2: $('.s2', r), tag: $('.ha-tag, .ha-ok', r), found: f };
    });
    var status = $('[data-ha="status"]', root), counter = $('[data-ha="counter"]', root),
        bar = $('[data-ha="bar"]', root), read = $('[data-ha="read"]', root);

    function render(t) {
      var scanT = Math.min(t / 0.78, 1);
      var total = 0;
      rows.forEach(function (o, i) {
        var p = ease(clamp((scanT - (i + 0.6) / n) / 0.07));
        var risky = o.d.amount > 0;
        total += o.d.amount * p;
        if (risky) {
          o.s1.style.width = (p * 104).toFixed(1) + '%';
          o.s2.style.width = (clamp(p * 1.3 - 0.3) * 80).toFixed(1) + '%';
          o.title.style.color = p > 0.2 ? '#B42318' : '';
          o.tag.style.transform = 'translateY(' + ((1 - p) * 6).toFixed(1) + 'px)';
          o.found.style.opacity = p.toFixed(3);
          o.found.style.transform = 'translateX(' + ((1 - p) * -10).toFixed(1) + 'px)';
        }
        o.tag.style.opacity = p.toFixed(3);
      });
      var done = scanT >= 1;
      counter.textContent = money(Math.round(total / 10) * 10);
      scan.style.top = (4 + scanT * (n * ROW - 30)).toFixed(1) + 'px';
      scan.style.opacity = done ? '0' : '1';
      bar.style.width = (scanT * 100).toFixed(1) + '%';
      read.textContent = done ? 'Review complete · 3 terms to renegotiate' : 'Reading your contract… ' + Math.round(scanT * 100) + '%';
      status.textContent = done ? 'Redlines ready' : 'Reviewing…';
      var fade = t > 0.94 ? 1 - (t - 0.94) / 0.06 : (t < 0.03 ? t / 0.03 : 1);
      root.style.opacity = clamp(fade).toFixed(3);
    }
    if (reduce) { render(0.9); return; }
    var start = performance.now(), visible = true;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(root);
    }
    (function tick(now) {
      if (visible) render(((now - start) % DUR) / DUR);
      requestAnimationFrame(tick);
    })(start);
  })();

  /* ---------------- Upload flows ---------------- */
  var bar = $('#uploadBar');
  var flows = [];
  function UploadFlow(root) {
    var self = this;
    this.root = root;
    this.isBar = root.hasAttribute('data-bar');
    this.input = $('.sr-file', root);
    this.idle = $('[data-step="idle"]', root);
    this.filePanel = $('.up-panel[data-step="file"]', root);
    this.donePanel = $('.up-panel[data-step="done"]', root);
    this.state = { step: 'idle', name: '', size: 0, email: '', sending: false };

    $$('[data-act="open"]', root).forEach(function (b) { b.addEventListener('click', function () { self.input.value = ''; self.input.click(); }); });
    $$('[data-act="sample"]', root).forEach(function (b) { b.addEventListener('click', function () { self.take({ name: 'Sample_Employment_Agreement.pdf', size: 188416 }); }); });
    this.input.addEventListener('change', function () { self.take(self.input.files && self.input.files[0]); });

    var zone = $('.up-zone', root);
    if (zone) {
      ['dragenter', 'dragover'].forEach(function (ev) { zone.addEventListener(ev, function (e) { e.preventDefault(); zone.classList.add('drag'); }); });
      zone.addEventListener('dragleave', function (e) { if (!zone.contains(e.relatedTarget)) zone.classList.remove('drag'); });
      zone.addEventListener('drop', function (e) { e.preventDefault(); zone.classList.remove('drag'); var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]; self.take(f); });
    }
  }
  UploadFlow.prototype.take = function (f) {
    if (!f) return;
    this.state.step = 'file'; this.state.name = f.name; this.state.size = f.size || 0; this.state.sending = false;
    this.render();
    var input = $('input[type="email"]', this.filePanel);
    if (input && !isMobile()) input.focus();
  };
  UploadFlow.prototype.reset = function () {
    this.state.step = 'idle'; this.state.sending = false;
    this.render();
  };
  UploadFlow.prototype.render = function () {
    var self = this, st = this.state;
    this.idle.hidden = st.step !== 'idle';
    this.filePanel.hidden = st.step !== 'file';
    this.donePanel.hidden = st.step !== 'done';
    if (this.isBar) { bar.classList.toggle('active', st.step !== 'idle'); }
    if (st.step === 'file') {
      var dot = st.name.lastIndexOf('.');
      var ext = dot > -1 ? st.name.slice(dot + 1).toUpperCase().slice(0, 4) : 'FILE';
      var size = !st.size ? '184 KB' : (st.size > 1048576 ? (st.size / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(st.size / 1024)) + ' KB');
      var id = 'email-' + (this.isBar ? 'bar' : 'zone');
      this.filePanel.innerHTML =
        '<div class="up-file"><span class="up-ext">' + esc(ext) + '</span>' +
        '<div class="up-meta"><span class="up-name">' + esc(st.name) + '</span>' +
        '<span class="up-size"><svg width="11" height="13" viewBox="0 0 12 14" aria-hidden="true"><rect x="1" y="6" width="10" height="7.5" rx="1.5" fill="#2A7454"/><path d="M3.5 6V4.2a2.5 2.5 0 0 1 5 0V6" fill="none" stroke="#2A7454" stroke-width="1.5"/></svg>' + size + ' · Encrypted</span></div>' +
        '<button type="button" class="link-btn" data-act="reset">Remove</button></div>' +
        '<label class="up-label" for="' + id + '">Where should we send your report?' +
        '<input id="' + id + '" type="email" placeholder="you@hospital.org" autocomplete="email" inputmode="email" value="' + esc(st.email) + '"></label>' +
        '<button type="button" class="btn btn-red up-submit" data-act="submit"></button>' +
        '<span class="up-fine">Flat fee · 3 reviews included · Full report within 24 hours</span>';
      var input = $('input', this.filePanel), btn = $('[data-act="submit"]', this.filePanel);
      var sync = function () {
        var ok = /.+@.+\..+/.test(st.email);
        btn.setAttribute('aria-disabled', ok ? 'false' : 'true');
        btn.textContent = st.sending ? 'Uploading securely…' : (ok ? 'Continue to secure checkout · $199' : 'Add your email to continue');
        return ok;
      };
      input.addEventListener('input', function () { st.email = input.value.trim(); sync(); });
      input.addEventListener('keydown', function (e) { if (e.key === 'Enter') btn.click(); });
      btn.addEventListener('click', function () {
        if (!sync() || st.sending) { if (!st.sending) input.focus(); return; }
        st.sending = true; sync();
        setTimeout(function () { st.step = 'done'; st.sending = false; self.render(); }, 1100);
      });
      $('[data-act="reset"]', this.filePanel).addEventListener('click', function () { self.reset(); });
      sync();
    }
    if (st.step === 'done') {
      this.donePanel.innerHTML =
        '<div class="up-done" role="status"><span class="check"><svg width="24" height="24" viewBox="0 0 12 12" fill="none" stroke="#1F6B4A" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 6.2l2.3 2.3 4.7-5"/></svg></span>' +
        '<h3>Contract received.</h3><p>We’re reading the fine print now. Your redlined report arrives at <strong>' + esc(st.email || 'your inbox') + '</strong> within 24 hours.</p>' +
        '<button type="button" class="link-btn" data-act="reset">Upload another contract</button></div>';
      $('[data-act="reset"]', this.donePanel).addEventListener('click', function () { self.reset(); });
    }
  };
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  $$('[data-upload]').forEach(function (r) { flows.push(new UploadFlow(r)); });

  // Show the mobile bar only once the hero upload zone has scrolled away
  var heroUpload = $('#upload');
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      var hide = es[0].isIntersecting || es[0].boundingClientRect.top > 0;
      bar.classList.toggle('show', !hide);
      document.body.classList.toggle('has-bar', !hide);
    }, { threshold: 0 }).observe(heroUpload);
  } else { bar.classList.add('show'); }

  /* ---------------- Analysis compare ---------------- */
  (function () {
    var wrap = $('#compare'), inner = $('.compare-inner', wrap), rowsWrap = $('[data-cmp="rows"]', wrap);
    var defs = [
      { label: 'TURNAROUND', old: 'Weeks of back-and-forth', nw: 'Full report in 24 hours' },
      { label: 'COST', old: '$500+ for a lawyer review', nw: '$199 flat' },
      { label: 'NEW DRAFTS', old: 'Pay again for every revision', nw: '3 reviews for the price of 1' },
      { label: 'SALARY', old: 'Sign what you’re offered', nw: 'Up to 30% higher salary' },
      { label: 'HIDDEN RISK', old: 'Landmines you won’t see', nw: 'Up to $50,000 saved' }
    ];
    var rows = defs.map(function (d) {
      var r = el('div', 'cmp-row', '<span class="cmp-label">' + d.label + '</span><span class="cmp-old">' + d.old + '</span><span class="cmp-new">' + d.nw + '</span>');
      rowsWrap.appendChild(r);
      return { old: $('.cmp-old', r), nw: $('.cmp-new', r) };
    });
    var prog = $('[data-cmp="prog"]', wrap), hon = $('[data-cmp="hon"]', wrap), hoff = $('[data-cmp="hoff"]', wrap);
    var onLabel = $('.cmp-on', wrap), offLabel = $('.cmp-progress > span:first-child', wrap);
    var bWith = $('[data-cmp="with"]', wrap), bWithout = $('[data-cmp="without"]', wrap);

    function paint(rowP) {
      rows.forEach(function (r, i) {
        var p = rowP(i);
        r.old.classList.toggle('struck', p > 0);
        r.nw.style.opacity = p.toFixed(3);
        r.nw.style.transform = 'translateX(' + ((1 - p) * -8).toFixed(1) + 'px)';
        r.nw.setAttribute('aria-hidden', p > 0 ? 'false' : 'true');
      });
    }

    // Mobile: toggle, auto-alternating until touched
    var auto = true, manualOn = true, changedAt = 0, t0 = performance.now(), D = 4200;
    function setOn(v) { auto = false; manualOn = v; changedAt = performance.now(); }
    bWith.addEventListener('click', function () { setOn(true); });
    bWithout.addEventListener('click', function () { setOn(false); });

    function sizeWrap() {
      if (isMobile() || reduce) { wrap.style.height = ''; return; }
      wrap.style.height = (inner.offsetHeight + 900) + 'px';
    }
    sizeWrap();
    window.addEventListener('resize', sizeWrap);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(sizeWrap);

    (function tick(now) {
      if (reduce) {
        paint(function () { return 1; });
        bWith.setAttribute('aria-pressed', 'true'); bWithout.setAttribute('aria-pressed', 'false');
        prog.style.width = '100%';
        return;
      }
      if (isMobile()) {
        var on, since;
        if (auto) { var e = now - t0; on = Math.floor(e / D) % 2 === 1; since = e % D; }
        else { on = manualOn; since = now - changedAt; }
        paint(function (i) { return on ? clamp((since - i * 140) / 260) : 0; });
        bWith.setAttribute('aria-pressed', on ? 'true' : 'false');
        bWithout.setAttribute('aria-pressed', on ? 'false' : 'true');
      } else {
        var r = wrap.getBoundingClientRect();
        var top = parseFloat(getComputedStyle(inner).top) || 96;
        var travel = Math.max(1, r.height - inner.offsetHeight);
        var sp = clamp((top - r.top) / travel);
        paint(function (i) { return clamp((sp - 0.08 - i * 0.17) / 0.12); });
        var withSide = sp > 0.1;
        prog.style.width = (sp * 100).toFixed(1) + '%';
        onLabel.style.color = withSide ? '#14161A' : '#8A8A8A';
        offLabel.style.color = withSide ? '#8A8A8A' : '#14161A';
        hon.style.color = withSide ? '#1F6B4A' : '#8A8A8A';
        hoff.style.color = withSide ? '#8A8A8A' : '#14161A';
      }
      requestAnimationFrame(tick);
    })(performance.now());
  })();

  /* ---------------- Video stories ---------------- */
  (function () {
    var wrap = $('#stories');
    var defs = [
      { len: 18, off: 3, img: 'assets/doctor-1.jpg', bg: 'linear-gradient(170deg, #CFE0DE 0%, #7FA3A0 100%)', skin: '#C99A7B', hair: '#2E2420', scrub: '#2B5F5E', quote: 'The tail coverage clause alone would have cost me thousands when I left.', name: 'Emergency medicine · Texas' },
      { len: 24, off: 11, img: 'assets/doctor-2.jpg', bg: 'linear-gradient(170deg, #E8DCCB 0%, #B49A7C 100%)', skin: '#8D5B3E', hair: '#1B1412', scrub: '#3B5C87', quote: 'I had no idea my signing bonus came with a repayment trap.', name: 'Pediatrics · Ohio' },
      { len: 15, off: 7, img: 'assets/doctor-1.jpg', bg: 'linear-gradient(170deg, #D9DCE6 0%, #8A93AA 100%)', skin: '#E3B796', hair: '#8A5A32', scrub: '#4A7A5E', quote: '24 hours later I had the redlines and the exact words to ask for.', name: 'Family medicine · California' },
      { len: 21, off: 0, img: 'assets/doctor-2.jpg', bg: 'linear-gradient(170deg, #E6D6D3 0%, #A9817A 100%)', skin: '#B07D5B', hair: '#3A2A22', scrub: '#6B4E7A', quote: 'They caught unpaid call hours buried on page 14.', name: 'Anesthesiology · Florida' }
    ];
    var bars = [], btns = [];
    defs.forEach(function (d, i) {
      var b = el('button', 'story');
      b.type = 'button';
      b.style.background = d.bg;
      b.setAttribute('aria-pressed', 'false');
      b.setAttribute('aria-label', 'Play testimonial ' + (i + 1) + ' with sound');
      b.innerHTML =
        '<img class="person-img" src="' + d.img + '" alt="" loading="lazy" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 20%">' +
        '<div class="story-prog"><div></div></div>' +
        '<span class="story-pill"><svg class="off-only" width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 6.5h3l4-3.5v12l-4-3.5h-3z"/><path d="M12.5 7l4 4M16.5 7l-4 4"/></svg>' +
        '<svg class="on-only" width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 6.5h3l4-3.5v12l-4-3.5h-3z"/><path d="M12.5 6.2a4 4 0 0 1 0 5.6M14.6 4.2a7 7 0 0 1 0 9.6"/></svg><span class="on-only">Sound on</span></span>' +
        '<div class="story-cap"><q>“' + d.quote + '”</q><span class="story-who">' + d.name + '</span></div>';
      b.addEventListener('click', function () {
        var on = b.getAttribute('aria-pressed') !== 'true';
        btns.forEach(function (o, j) {
          var me = o === b && on;
          o.setAttribute('aria-pressed', me ? 'true' : 'false');
          o.setAttribute('aria-label', (me ? 'Mute testimonial ' : 'Play testimonial ') + (j + 1) + (me ? '' : ' with sound'));
        });
      });
      wrap.appendChild(b);
      btns.push(b);
      bars.push($('.story-prog div', b));
    });
    if (reduce) return;
    var start = performance.now();
    (function tick(now) {
      var t = (now - start) / 1000;
      defs.forEach(function (d, i) { bars[i].style.width = (((t + d.off) % d.len) / d.len * 100).toFixed(2) + '%'; });
      requestAnimationFrame(tick);
    })(start);
  })();

  /* ---------------- Features carousel ---------------- */
  (function () {
    var root = $('#feat');
    var items = [
      { title: 'Custom contracts', text: 'Tailor your contract to your specific needs: your specialty, your state, your next step.', icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#14161A" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/></svg>' },
      { title: 'Value calculation', text: 'We reveal the full financial risk hidden in the terms, then rewrite the contract to help you save thousands.', icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#14161A" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="2"/><rect x="8" y="6" width="8" height="3.5" rx="0.5"/><path d="M8.5 13h.01M12 13h.01M15.5 13h.01M8.5 16.5h.01M12 16.5h.01M15.5 16.5h.01"/></svg>' },
      { title: 'Unlock more in 24 hours', text: 'Every contract is reviewed, fully analyzed and returned within 24 hours, with a full financial analysis included.', icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#14161A" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>' }
    ];
    var icon = $('[data-feat="icon"]', root), title = $('[data-feat="title"]', root), text = $('[data-feat="text"]', root),
        timer = $('[data-feat="timer"]', root), dotsWrap = $('[data-feat="dots"]', root);
    var idx = 0, auto = !reduce, changedAt = performance.now();
    var dots = items.map(function (it, i) {
      var d = el('button', null, '<span></span>');
      d.type = 'button'; d.setAttribute('aria-label', 'Show ' + it.title);
      d.addEventListener('click', function () { go(i, true); });
      dotsWrap.appendChild(d);
      return d;
    });
    function show() {
      var it = items[idx];
      icon.innerHTML = it.icon;
      // restart entry animation
      [title, text].forEach(function (n) { n.style.animation = 'none'; void n.offsetWidth; n.style.animation = ''; });
      title.textContent = it.title; text.textContent = it.text;
      dots.forEach(function (d, i) { d.setAttribute('aria-current', i === idx ? 'true' : 'false'); });
    }
    function go(i, manual) { idx = (i + items.length) % items.length; changedAt = performance.now(); if (manual) auto = false; show(); }
    $('[data-feat="prev"]', root).addEventListener('click', function () { go(idx - 1, true); });
    $('[data-feat="next"]', root).addEventListener('click', function () { go(idx + 1, true); });
    show();
    (function tick(now) {
      var since = now - changedAt;
      if (auto && since > 6000) { go(idx + 1, false); since = 0; }
      timer.style.width = auto ? (Math.min(1, since / 6000) * 100).toFixed(1) + '%' : '0%';
      requestAnimationFrame(tick);
    })(performance.now());
  })();

  /* ---------------- Trust journey ---------------- */
  (function () {
    var root = $('#trust');
    var tabsWrap = $('.trust-tabs', root);
    var stages = $$('.ts', root).filter(function (n) { return /^[0-2]$/.test(n.getAttribute('data-ts')); });
    var labels = ['Locked on upload', 'Never shared', 'Deleted on request'];
    var D = 5200, t0 = performance.now();
    var st = { auto: !reduce, manual: 0, manualStart: 0, shredStart: 0 };
    var tabs = labels.map(function (l, i) {
      var b = el('button', null, '<span class="tt-bar"><span></span></span><span class="tt-num">0' + (i + 1) + '</span><span class="tt-label">' + l + '</span>');
      b.type = 'button'; b.setAttribute('role', 'tab');
      b.addEventListener('click', function () { st.auto = false; st.manual = i; st.manualStart = performance.now(); st.shredStart = 0; });
      tabsWrap.appendChild(b);
      return { b: b, fill: $('.tt-bar span', b) };
    });
    var cipher = $('[data-ts="cipher"]', root), shackle = $('[data-ts="shackle"]', root), block = $('[data-ts="block"]', root);
    var shredBox = $('[data-ts="shred"]', root), ok = $('.shred-ok', root), del = $('[data-ts="del"]', root), restore = $('[data-ts="restore"]', root);
    var strips = [0, 1, 2, 3, 4, 5].map(function (i) {
      var s = el('span', 'strip');
      s.style.left = (i * 12.33).toFixed(2) + 'px';
      if (i === 0) s.style.borderLeft = '1.5px solid #14161A';
      if (i === 5) s.style.borderRight = '1.5px solid #14161A';
      shredBox.insertBefore(s, ok);
      return s;
    });
    del.addEventListener('click', function () { var n = performance.now(); st.auto = false; st.manual = 2; st.manualStart = n; st.shredStart = n; });
    restore.addEventListener('click', function () { st.auto = false; st.manual = 2; st.manualStart = performance.now(); st.shredStart = 0; });

    (function tick(now) {
      var step, p;
      if (st.auto) { var e = now - t0; step = Math.floor(e / D) % 3; p = (e % D) / D; }
      else { step = st.manual; p = clamp((now - st.manualStart) / D); }
      var shred = 0;
      if (step === 2) {
        if (st.auto) shred = clamp((p - 0.45) / 0.16);
        else if (st.shredStart) shred = clamp((now - st.shredStart) / 900);
      }
      tabs.forEach(function (t, i) {
        var fill = i === step ? (st.auto ? p * 100 : 100) : (st.auto && i < step ? 100 : 0);
        t.fill.style.width = fill.toFixed(1) + '%';
        t.b.setAttribute('aria-selected', i === step ? 'true' : 'false');
      });
      stages.forEach(function (s, i) { s.hidden = i !== step; });
      cipher.style.opacity = (st.auto ? clamp((p - 0.1) / 0.25) : 1).toFixed(3);
      shackle.style.transform = (p > 0.3 || !st.auto) ? 'none' : 'translateY(-4px)';
      block.style.transform = 'scale(' + (st.auto ? 0.6 + 0.4 * clamp((p - 0.15) / 0.15) : 1).toFixed(3) + ')';
      strips.forEach(function (s, i) {
        var dir = i % 2 === 0 ? 1 : -1;
        s.style.transform = 'translateY(' + (shred * (50 + i * 9)).toFixed(1) + 'px) rotate(' + (shred * dir * (6 + i)).toFixed(1) + 'deg)';
        s.style.opacity = (1 - shred).toFixed(3);
      });
      ok.hidden = shred < 1; restore.hidden = shred < 1; del.hidden = shred >= 1;
      requestAnimationFrame(tick);
    })(performance.now());
  })();

  /* ---------------- Certifications ---------------- */
  (function () {
    var wrap = $('#badges');
    var defs = [
      { label: 'ISO 27001', text: 'The international standard for information security. How we store and handle your data follows audited, documented processes.', icon: '<svg width="40" height="40" viewBox="0 0 42 42" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><circle cx="21" cy="21" r="16"/><path d="M5 21h32M21 5c-5 5-5 27 0 32M21 5c5 5 5 27 0 32"/><rect x="7" y="17" width="28" height="8" fill="#14161A" stroke="none"/><text x="21" y="24" text-anchor="middle" font-family="Instrument Sans, sans-serif" font-size="8" font-weight="700" fill="currentColor" stroke="none">ISO:27001</text></svg>' },
      { label: 'AES-256', text: 'The same encryption banks use. Your contract file is unreadable to anyone without authorized access.', icon: '<svg width="40" height="40" viewBox="0 0 42 42" aria-hidden="true"><rect x="12" y="19" width="18" height="14" rx="3" fill="currentColor"/><path d="M16 19v-4.5a5 5 0 0 1 10 0V19" fill="none" stroke="currentColor" stroke-width="2.4"/></svg>' },
      { label: 'SOC 2 Type 1', text: 'An independent audit confirming our security controls are properly designed and in place.', icon: '<svg width="40" height="40" viewBox="0 0 42 42" aria-hidden="true"><text x="21" y="12" text-anchor="middle" font-family="Instrument Sans, sans-serif" font-size="8.5" font-weight="600" fill="currentColor">AICPA</text><text x="21" y="23" text-anchor="middle" font-family="Instrument Sans, sans-serif" font-size="8.5" font-weight="600" fill="currentColor">SOC 2</text><text x="21" y="34" text-anchor="middle" font-family="Instrument Sans, sans-serif" font-size="8.5" font-weight="600" fill="currentColor">TYPE 1</text></svg>' },
      { label: 'Identity', text: 'Secure sign-in and identity verification, so only you can open your contract and report.', icon: '<svg width="40" height="40" viewBox="0 0 42 42" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="M12 14a11 11 0 0 1 18 0"/><path d="M10 21c0-6 5-10 11-10s11 4 11 10v3"/><path d="M14 30c-1-3-1-6-1-9a8 8 0 0 1 16 0c0 4-.5 8-2 11"/><path d="M17 33c-.8-3-1-6-1-11a5 5 0 0 1 10 0c0 4-.5 7-1.5 10"/><path d="M21 22c0 5-.5 9-2 13"/></svg>' },
      { label: 'GDPR', text: 'Strict privacy rules: you control your data and can ask us to delete it at any time.', icon: '<svg width="40" height="40" viewBox="0 0 42 42" aria-hidden="true"><g fill="currentColor"><circle cx="21" cy="5" r="1.6"/><circle cx="29" cy="7.1" r="1.6"/><circle cx="34.9" cy="13" r="1.6"/><circle cx="37" cy="21" r="1.6"/><circle cx="34.9" cy="29" r="1.6"/><circle cx="29" cy="34.9" r="1.6"/><circle cx="21" cy="37" r="1.6"/><circle cx="13" cy="34.9" r="1.6"/><circle cx="7.1" cy="29" r="1.6"/><circle cx="5" cy="21" r="1.6"/><circle cx="7.1" cy="13" r="1.6"/><circle cx="13" cy="7.1" r="1.6"/></g><text x="21" y="24" text-anchor="middle" font-family="Instrument Sans, sans-serif" font-size="8" font-weight="700" fill="currentColor">GDPR</text></svg>' }
    ];
    var hover = window.matchMedia('(hover: hover)').matches;
    var badges = defs.map(function (d) {
      var b = el('button', 'badge');
      b.type = 'button';
      b.setAttribute('aria-pressed', 'false');
      b.setAttribute('aria-label', d.label + ': ' + d.text);
      b.innerHTML = '<span class="badge-in"><span class="face face-front"><span class="verified">VERIFIED</span><span class="bicon">' + d.icon + '</span><span class="blabel">' + d.label + '</span></span>' +
        '<span class="face face-back"><span class="bk-label">' + d.label.toUpperCase() + '</span><span class="bk-text">' + d.text + '</span></span></span>';
      var set = function (on) { b.classList.toggle('flipped', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); };
      if (hover) {
        b.addEventListener('mouseenter', function () { set(true); });
        b.addEventListener('mouseleave', function () { set(false); });
      }
      b.addEventListener('focus', function () { if (hover) set(true); });
      b.addEventListener('blur', function () { set(false); });
      b.addEventListener('click', function () { set(!b.classList.contains('flipped')); });
      wrap.appendChild(b);
      return { b: b, set: set };
    });
    var idx = 0, dotsWrap = $('[data-bn="dots"]');
    var dots = defs.map(function (d, i) {
      var x = el('button', null, '<span></span>');
      x.type = 'button'; x.setAttribute('aria-label', 'Show ' + d.label);
      x.addEventListener('click', function () { go(i); });
      dotsWrap.appendChild(x);
      return x;
    });
    function go(i) {
      idx = (i + defs.length) % defs.length;
      badges.forEach(function (o, j) { o.b.classList.toggle('current', j === idx); o.set(false); });
      dots.forEach(function (x, j) { x.setAttribute('aria-current', j === idx ? 'true' : 'false'); });
    }
    $('[data-bn="prev"]').addEventListener('click', function () { go(idx - 1); });
    $('[data-bn="next"]').addEventListener('click', function () { go(idx + 1); });
    go(0);
  })();
})();
