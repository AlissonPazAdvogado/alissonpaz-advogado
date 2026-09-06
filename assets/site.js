(() => {
  const track = (name, params) => {
    if (typeof window.gtag === 'function') window.gtag('event', name, params);
  };

  // Lazy-load das imagens de artigo (background-image via data-bg) só
  // quando a seção entra perto do viewport — evita disputar banda com o
  // hero/LCP logo no carregamento, já que ficam abaixo da dobra.
  const lazyBgEls = document.querySelectorAll('.article-img[data-bg]');
  if (lazyBgEls.length) {
    if ('IntersectionObserver' in window) {
      const bgObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          el.style.backgroundImage = `url('${el.dataset.bg}')`;
          observer.unobserve(el);
        });
      }, { rootMargin: '200px 0px' });
      lazyBgEls.forEach((el) => bgObserver.observe(el));
    } else {
      lazyBgEls.forEach((el) => { el.style.backgroundImage = `url('${el.dataset.bg}')`; });
    }
  }

  // Tracking GA4: whatsapp_click via event delegation no document com
  // capture=true — dispara antes do handoff de navegação para o WhatsApp e
  // é resiliente a stopPropagation nos CTAs. O botão de submit do formulário
  // não tem data-conversion="whatsapp-cta", então este evento não se
  // sobrepõe ao lead_form_submit (emitido pelo handler inline do formulário
  // em index.html, que precisa controlar o próprio redirect via
  // event_callback).
  document.addEventListener('click', (event) => {
    const target = event.target.closest('[data-conversion="whatsapp-cta"]');
    if (!target) return;
    track('whatsapp_click', { send_to: 'G-5J4N177RQL', link_location: target.getAttribute('href') || '' });
  }, true);

  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  const navbar = document.getElementById('navbar');
  if (navbar) {
    let navbarTicking = false;
    const updateNavbar = () => {
      const y = window.scrollY;
      if (y > 48) navbar.classList.add('scrolled');
      else if (y < 24) navbar.classList.remove('scrolled');
      navbarTicking = false;
    };
    const onScroll = () => {
      if (navbarTicking) return;
      navbarTicking = true;
      requestAnimationFrame(updateNavbar);
    };
    updateNavbar();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  const navLinks = document.getElementById('navLinks');
  const navToggle = document.getElementById('navToggle');
  const navClose = document.getElementById('navClose');
  let menuWasOpenedBy = null;

  const setMenu = (open, restoreFocus = false) => {
    if (!navLinks || !navToggle) return;
    navLinks.classList.toggle('open', open);
    navToggle.classList.toggle('active', open);
    navToggle.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('menu-open', open);

    if (open) {
      menuWasOpenedBy = document.activeElement;
      window.requestAnimationFrame(() => {
        (navClose || navLinks.querySelector('a'))?.focus();
      });
    } else if (restoreFocus && menuWasOpenedBy instanceof HTMLElement) {
      menuWasOpenedBy.focus();
    }
  };

  navToggle?.addEventListener('click', () => setMenu(!navLinks?.classList.contains('open')));
  navClose?.addEventListener('click', () => setMenu(false, true));
  navLinks?.addEventListener('click', (event) => {
    if (event.target === navLinks || event.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && navLinks?.classList.contains('open')) {
      setMenu(false, true);
    }
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768 && navLinks?.classList.contains('open')) setMenu(false);
  });

  const tabContainer = document.querySelector('.areas-tabs');
  const tabs = Array.from(document.querySelectorAll('.tab-btn'));
  if (tabContainer && tabs.length) {
    const panels = tabs
      .map((tab) => document.getElementById(`tab-${tab.dataset.tab}`))
      .filter(Boolean);

    const activateTab = (tab, moveFocus = false, userInitiated = false) => {
      tabs.forEach((item) => {
        const selected = item === tab;
        item.classList.toggle('active', selected);
        item.setAttribute('aria-selected', String(selected));
        item.tabIndex = selected ? 0 : -1;
      });
      panels.forEach((panel) => {
        const active = panel.id === `tab-${tab.dataset.tab}`;
        panel.classList.toggle('active', active);
        panel.hidden = !active;
      });
      if (moveFocus) tab.focus();
      // Só reporta area_select numa seleção real do usuário (clique ou
      // teclado) - a ativação automática da aba padrão no carregamento da
      // página não deve gerar um evento de interação falso.
      if (userInitiated) track('area_select', { area: tab.dataset.tab });
    };

    tabs.forEach((tab, index) => {
      const panel = panels.find((item) => item.id === `tab-${tab.dataset.tab}`);
      const tabId = `tab-button-${tab.dataset.tab}`;
      tab.id = tabId;
      tab.setAttribute('aria-controls', panel?.id || '');
      panel?.setAttribute('role', 'tabpanel');
      panel?.setAttribute('aria-labelledby', tabId);
      panel?.setAttribute('tabindex', '0');

      tab.addEventListener('click', () => activateTab(tab, false, true));
      tab.addEventListener('keydown', (event) => {
        let nextIndex = null;
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (index + 1) % tabs.length;
        if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (index - 1 + tabs.length) % tabs.length;
        if (event.key === 'Home') nextIndex = 0;
        if (event.key === 'End') nextIndex = tabs.length - 1;
        if (nextIndex !== null) {
          event.preventDefault();
          activateTab(tabs[nextIndex], true, true);
        }
      });
    });

    tabContainer.classList.add('tabs-enhanced');
    activateTab(tabs.find((tab) => tab.classList.contains('active')) || tabs[0]);
  }
})();
