(() => {
  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  const navbar = document.getElementById('navbar');
  if (navbar) {
    const updateNavbar = () => navbar.classList.toggle('scrolled', window.scrollY > 40);
    updateNavbar();
    window.addEventListener('scroll', updateNavbar, { passive: true });
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

    const activateTab = (tab, moveFocus = false) => {
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
    };

    tabs.forEach((tab, index) => {
      const panel = panels.find((item) => item.id === `tab-${tab.dataset.tab}`);
      const tabId = `tab-button-${tab.dataset.tab}`;
      tab.id = tabId;
      tab.setAttribute('aria-controls', panel?.id || '');
      panel?.setAttribute('role', 'tabpanel');
      panel?.setAttribute('aria-labelledby', tabId);
      panel?.setAttribute('tabindex', '0');

      tab.addEventListener('click', () => activateTab(tab));
      tab.addEventListener('keydown', (event) => {
        let nextIndex = null;
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (index + 1) % tabs.length;
        if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (index - 1 + tabs.length) % tabs.length;
        if (event.key === 'Home') nextIndex = 0;
        if (event.key === 'End') nextIndex = tabs.length - 1;
        if (nextIndex !== null) {
          event.preventDefault();
          activateTab(tabs[nextIndex], true);
        }
      });
    });

    tabContainer.classList.add('tabs-enhanced');
    activateTab(tabs.find((tab) => tab.classList.contains('active')) || tabs[0]);
  }
})();
