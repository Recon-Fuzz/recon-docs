// Add logo to sidebar
function addSidebarLogo() {
  const sidebar = document.querySelector('.sidebar');
  const sidebarScrollbox = document.querySelector('.sidebar-scrollbox');

  if (sidebar && sidebarScrollbox) {
    if (!document.querySelector('.sidebar-logo')) {
      const logoContainer = document.createElement('div');
      logoContainer.className = 'sidebar-logo';

      const logoImg = document.createElement('img');
      logoImg.src = (typeof path_to_root !== 'undefined' ? path_to_root : '') + 'favicon.png';
      logoImg.alt = 'Recon Logo';

      logoContainer.appendChild(logoImg);
      sidebar.insertBefore(logoContainer, sidebarScrollbox);
    }
  }
}

// Toggle button + overlay for TOC (works on all screen sizes)
function ensureTocToggle(toc) {
  // Don't duplicate
  if (document.getElementById('toc-toggle')) return;

  var btn = document.createElement('button');
  btn.id = 'toc-toggle';
  btn.setAttribute('aria-label', 'Toggle table of contents');
  btn.innerHTML = '☰';
  document.body.appendChild(btn);

  var overlay = document.createElement('div');
  overlay.id = 'toc-overlay';
  document.body.appendChild(overlay);

  function isMobile() {
    return window.innerWidth <= 1200;
  }

  function openToc() {
    if (isMobile()) {
      // Mobile/tablet: slide-in panel
      toc.classList.add('toc-visible');
      overlay.classList.add('toc-overlay-visible');
    } else {
      // Desktop: show in place
      document.body.classList.remove('toc-hidden');
    }
    btn.innerHTML = '✕';
  }

  function closeToc() {
    if (isMobile()) {
      // Mobile/tablet: slide out
      toc.classList.remove('toc-visible');
      overlay.classList.remove('toc-overlay-visible');
    } else {
      // Desktop: hide in place
      document.body.classList.add('toc-hidden');
    }
    btn.innerHTML = '☰';
  }

  function isTocOpen() {
    if (isMobile()) {
      return toc.classList.contains('toc-visible');
    } else {
      return !document.body.classList.contains('toc-hidden');
    }
  }

  btn.addEventListener('click', function() {
    if (isTocOpen()) {
      closeToc();
    } else {
      openToc();
    }
  });

  overlay.addEventListener('click', closeToc);

  // Close TOC when a link inside it is clicked (mobile UX)
  toc.addEventListener('click', function(e) {
    if (e.target.tagName === 'A' && isMobile()) {
      closeToc();
    }
  });

  // Close TOC on Escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && isTocOpen()) {
      closeToc();
    }
  });
}

// Build or rebuild the right-hand TOC for the current page
function buildTOC() {
  // Remove existing TOC if present (page changed)
  var existing = document.getElementById('right-toc');
  if (existing) {
    existing.classList.remove('toc-visible');
    existing.remove();
  }

  // Close overlay if open (page navigation)
  var existingOverlay = document.getElementById('toc-overlay');
  if (existingOverlay) existingOverlay.classList.remove('toc-overlay-visible');

  // Reset toggle button icon
  var existingToggle = document.getElementById('toc-toggle');
  if (existingToggle) existingToggle.innerHTML = '☰';

  // Remove old scroll listener
  if (window._tocScrollHandler) {
    window.removeEventListener('scroll', window._tocScrollHandler);
    window._tocScrollHandler = null;
  }

  var content = document.querySelector('.content');
  if (!content) return;

  var headings = content.querySelectorAll('h2, h3');
  if (headings.length < 2) {
    // No TOC needed — hide toggle button if it exists
    var existingBtn = document.getElementById('toc-toggle');
    if (existingBtn) existingBtn.style.display = 'none';
    return;
  }

  // Create TOC container
  var toc = document.createElement('nav');
  toc.id = 'right-toc';
  toc.innerHTML = '<h3>On this page</h3>';
  var ul = document.createElement('ul');

  headings.forEach(function(heading) {
    if (!heading.id) {
      var safeId = heading.textContent.trim()
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      var finalId = safeId;
      var counter = 1;
      while (document.getElementById(finalId)) {
        finalId = safeId + '-' + counter;
        counter++;
      }
      heading.id = finalId;
    }

    var li = document.createElement('li');
    var a = document.createElement('a');
    a.href = '#' + heading.id;
    a.textContent = heading.textContent;

    if (heading.tagName === 'H3') {
      li.style.marginLeft = '12px';
      li.style.fontSize = '0.9em';
    }

    li.appendChild(a);
    ul.appendChild(li);
  });

  toc.appendChild(ul);
  document.body.appendChild(toc);

  // Create toggle button and overlay for mobile/tablet
  ensureTocToggle(toc);
  // Ensure toggle is visible (may have been hidden on a page with no TOC)
  var toggleBtn = document.getElementById('toc-toggle');
  if (toggleBtn) toggleBtn.style.display = '';

  // Active state tracking
  var tocLinks = toc.querySelectorAll('a');

  function updateActiveLink() {
    var scrollPosition = window.scrollY + 120;
    var currentSection = null;

    for (var i = headings.length - 1; i >= 0; i--) {
      if (headings[i].offsetTop <= scrollPosition) {
        currentSection = headings[i];
        break;
      }
    }

    tocLinks.forEach(function(link) { link.classList.remove('active'); });
    if (currentSection) {
      var activeLink = toc.querySelector('a[href="#' + currentSection.id + '"]');
      if (activeLink) activeLink.classList.add('active');
    }
  }

  window._tocScrollHandler = updateActiveLink;
  window.addEventListener('scroll', updateActiveLink);
  updateActiveLink();

  // Smooth scrolling
  tocLinks.forEach(function(link) {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      var targetId = link.getAttribute('href').substring(1);
      var targetElement = document.getElementById(targetId);
      if (targetElement) {
        var offset = 80;
        var elementPosition = targetElement.getBoundingClientRect().top;
        var offsetPosition = elementPosition + window.pageYOffset - offset;
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
        setTimeout(updateActiveLink, 100);
      }
    });
  });
}

// Run on initial load
window.addEventListener('DOMContentLoaded', function() {
  addSidebarLogo();
  buildTOC();
});

// Re-run when mdBook swaps page content (handles SPA-like navigation)
(function() {
  var content = document.getElementById('content');
  if (!content) return;

  var observer = new MutationObserver(function(mutations) {
    // Only rebuild if child nodes actually changed (page navigation)
    for (var i = 0; i < mutations.length; i++) {
      if (mutations[i].type === 'childList' && mutations[i].addedNodes.length > 0) {
        buildTOC();
        return;
      }
    }
  });
  observer.observe(content, { childList: true });
})();
