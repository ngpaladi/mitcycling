// MIT Cycling Club — Main JS

document.addEventListener('DOMContentLoaded', () => {
  initScrollHeader();
  initMobileMenu();
  initRevealOnScroll();
  initFAQ();
  initResultsFilter();
  initRosterFilter();
});

// Sticky header transparency
function initScrollHeader() {
  const header = document.querySelector('.site-header');
  if (!header) return;
  const heroEl = document.querySelector('.hero');
  if (!heroEl) {
    header.classList.add('solid');
    return;
  }
  const onScroll = () => {
    const scrolled = window.scrollY > 40;
    header.classList.toggle('scrolled', scrolled);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// Mobile hamburger menu
function initMobileMenu() {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.mobile-nav');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
    // Swap icon
    toggle.querySelector('.icon-menu').style.display = open ? 'none' : 'block';
    toggle.querySelector('.icon-close').style.display = open ? 'block' : 'none';
  });

  // Close on nav link click
  nav.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      nav.classList.remove('open');
      document.body.style.overflow = '';
      toggle.querySelector('.icon-menu').style.display = 'block';
      toggle.querySelector('.icon-close').style.display = 'none';
    });
  });
}

// Scroll-reveal animation
function initRevealOnScroll() {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  els.forEach(el => obs.observe(el));
}

// FAQ accordion
function initFAQ() {
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const isOpen = item.classList.contains('open');
      // Close all
      document.querySelectorAll('.faq-item.open').forEach(el => el.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });
}

// Race results discipline filter
function initResultsFilter() {
  const filterBtns = document.querySelectorAll('[data-filter-discipline]');
  if (!filterBtns.length) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const discipline = btn.dataset.filterDiscipline;
      filterBtns.forEach(b => b.classList.toggle('active', b === btn));

      document.querySelectorAll('[data-discipline]').forEach(row => {
        const match = discipline === 'all' || row.dataset.discipline === discipline;
        row.style.display = match ? '' : 'none';
      });

      // Hide seasons that have no visible rows
      document.querySelectorAll('.results-season').forEach(season => {
        const visibleRows = season.querySelectorAll('tr[data-discipline]:not([style*="none"])');
        season.style.display = visibleRows.length ? '' : 'none';
      });
    });
  });
}

// Roster season/discipline filter
function initRosterFilter() {
  const tabs = document.querySelectorAll('[data-roster-tab]');
  if (!tabs.length) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const season = tab.dataset.rosterTab;
      tabs.forEach(t => t.classList.toggle('active', t === tab));

      document.querySelectorAll('[data-roster-season]').forEach(card => {
        card.style.display = card.dataset.rosterSeason === season ? '' : 'none';
      });
    });
  });
}
