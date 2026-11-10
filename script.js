const LEAD_ENDPOINT = 'https://lead-relay.leestygpt.workers.dev/lead/3C23RPBAQM';

const YM_ID = 114111726;

(() => {
  const root = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  // Метрика грузится только после согласия на cookie
  const loadMetrica = () => {
    if (!YM_ID || window.ym) return;
    (function (m, e, t, r, i, k, a) {
      m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
      m[i].l = 1 * new Date();
      k = e.createElement(t); a = e.getElementsByTagName(t)[0]; k.async = 1; k.src = r; a.parentNode.insertBefore(k, a);
    })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym');
    window.ym(YM_ID, 'init', { clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: false });
  };
  let cookieChoice = null;
  try { cookieChoice = localStorage.getItem('abr_cookie'); } catch (_) {}
  if (cookieChoice === 'all') loadMetrica();
  if (!cookieChoice) {
    const bar = document.createElement('div');
    bar.className = 'cookie';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', 'Cookie');
    bar.innerHTML = '<p>Мы используем cookie и Яндекс Метрику, чтобы понимать, какие разделы полезны. <a class="link" href="privacy.html">Подробнее</a></p><div class="cookie__btns"><button type="button" class="btn" data-c="all">Принять</button><button type="button" class="btn btn--inv" data-c="min">Только необходимые</button></div>';
    document.body.appendChild(bar);
    bar.addEventListener('click', e => {
      const b = e.target.closest('button[data-c]');
      if (!b) return;
      try { localStorage.setItem('abr_cookie', b.dataset.c); } catch (_) {}
      if (b.dataset.c === 'all') loadMetrica();
      bar.remove();
    });
  }

  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Загрузка: строки заголовка поднимаются из-под маски
  const start = () => setTimeout(() => root.classList.add('is-loaded'), 180);
  if (document.readyState === 'complete') start(); else window.addEventListener('load', start);

  // Меню
  const burger = $('#burger');
  const menu = $('#menu');
  burger?.addEventListener('click', () => {
    const open = menu.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', String(open));
    burger.textContent = open ? 'Закрыть' : 'Меню';
  });
  $$('a', menu).forEach(a => a.addEventListener('click', () => {
    menu.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    burger.textContent = 'Меню';
  }));

  // Плавный якорь
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const href = a.getAttribute('href');
      if (href.length <= 1) return;
      const target = $(href);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 72;
      window.scrollTo({ top: Math.max(0, top), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    });
  });

  // Маска телефона: Backspace удаляет цифры, а не знаки форматирования
  const fmtPhone = d => {
    let out = '+7';
    if (d.length > 1) out += ' (' + d.slice(1, 4);
    if (d.length >= 4) out += ') ' + d.slice(4, 7);
    if (d.length >= 7) out += '-' + d.slice(7, 9);
    if (d.length >= 9) out += '-' + d.slice(9, 11);
    return out;
  };
  $$('input[type="tel"]').forEach(input => {
    let prevDigits = '';
    input.addEventListener('input', e => {
      let v = e.target.value.replace(/\D/g, '');
      const deleting = (e.inputType || '').startsWith('delete');
      if (!v) { e.target.value = ''; prevDigits = ''; return; }
      if (v.startsWith('8')) v = '7' + v.slice(1);
      if (!v.startsWith('7')) v = '7' + v;
      v = v.slice(0, 11);
      // удалили только знак (скобку, пробел, дефис): убираем последнюю цифру
      if (deleting && v.length >= prevDigits.length) v = v.slice(0, -1);
      if (v.length <= 1) { e.target.value = ''; prevDigits = ''; return; }
      e.target.value = fmtPhone(v);
      prevDigits = v;
    });
  });

  // ===== КАЛЬКУЛЯТОР СМЕТЫ =====
  const areaEl = $('#area');
  const rangeEl = $('#range');
  const plans = $$('.plan');
  const commentEl = $('#f-comment');
  const fmt = n => n.toLocaleString('ru-RU').replace(/ | /g, ' ') + ' ₽';
  let area = 60;
  let selected = plans.find(p => p.classList.contains('is-on')) || plans[1];
  let autoComment = '';

  const render = () => {
    plans.forEach(p => {
      const total = area * Number(p.dataset.rate);
      const out = $('[data-total]', p);
      out.innerHTML = fmt(total) + '<small>при ' + area + ' м²</small>';
    });
  };
  const select = p => {
    selected = p;
    plans.forEach(x => x.classList.toggle('is-on', x === p));
  };
  const setArea = (v, from) => {
    let n = Math.round(Number(v));
    if (!Number.isFinite(n) || n <= 0) return;
    n = Math.min(500, Math.max(1, n));
    area = n;
    if (from !== 'input') areaEl.value = n;
    if (from !== 'range') rangeEl.value = Math.min(300, Math.max(20, n));
    render();
  };
  areaEl?.addEventListener('input', () => { if (areaEl.value !== '') setArea(areaEl.value, 'input'); });
  areaEl?.addEventListener('blur', () => { areaEl.value = area; });
  rangeEl?.addEventListener('input', () => setArea(rangeEl.value, 'range'));

  const prefill = () => {
    if (!commentEl) return;
    const total = area * Number(selected.dataset.rate);
    const text = 'Площадь ' + area + ' м², пакет ' + selected.dataset.name + ', ориентир ' + fmt(total).replace(/ /g, ' ');
    if (commentEl.value.trim() === '' || commentEl.value === autoComment) {
      commentEl.value = text;
      autoComment = text;
    }
  };
  plans.forEach(p => {
    p.addEventListener('click', e => { if (!e.target.closest('[data-pick]')) select(p); });
    p.addEventListener('keydown', e => {
      if ((e.key === 'Enter' || e.key === ' ') && e.target === p) { e.preventDefault(); select(p); }
    });
    $('[data-pick]', p)?.addEventListener('click', () => {
      select(p);
      prefill();
      const target = $('#contact');
      const top = target.getBoundingClientRect().top + window.scrollY - 72;
      window.scrollTo({ top, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    });
  });
  $$('a[href="#contact"]').forEach(a => a.addEventListener('click', prefill));
  render();

  // ===== ФОРМА → CLOUDFLARE WORKER → TELEGRAM =====
  const form = $('#leadForm');
  form?.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const orig = btn.textContent;
    const payload = {};
    new FormData(form).forEach((v, k) => { payload[k] = v; });
    if (payload._gotcha) return;
    if (!payload.name || !payload.phone || payload.phone.replace(/\D/g, '').length < 11) {
      btn.textContent = 'Заполните имя и телефон';
      setTimeout(() => { btn.textContent = orig; }, 2200);
      return;
    }
    payload.source = 'remont-abrashov';
    btn.disabled = true;
    btn.textContent = 'Отправляем…';
    try {
      const resp = await fetch(LEAD_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      btn.textContent = 'Заявка отправлена';
      form.reset();
      try { if (YM_ID && window.ym) window.ym(YM_ID, 'reachGoal', 'lead'); } catch (_) {}
      autoComment = '';
    } catch (err) {
      console.error(err);
      btn.textContent = 'Не отправилось, попробуйте ещё раз';
    } finally {
      setTimeout(() => { btn.textContent = orig; btn.disabled = false; }, 3200);
    }
  });

  // Появление частей секций: заголовок, текст, содержимое по очереди
  const items = $$('.rise');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    items.forEach(el => io.observe(el));
  } else {
    items.forEach(el => el.classList.add('is-in'));
  }
})();
