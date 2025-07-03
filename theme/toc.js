// Add logo to sidebar
function addSidebarLogo() {
  const sidebar = document.querySelector('.sidebar');
  const sidebarScrollbox = document.querySelector('.sidebar-scrollbox');
  
  if (sidebar && sidebarScrollbox) {
    // Check if logo already exists
    if (!document.querySelector('.sidebar-logo')) {
      const logoContainer = document.createElement('div');
      logoContainer.className = 'sidebar-logo';
      
      const logoImg = document.createElement('img');
      // Use the path_to_root variable that mdbook provides
      logoImg.src = (typeof path_to_root !== 'undefined' ? path_to_root : '') + 'favicon.png';
      logoImg.alt = 'Recon Logo';
      
      logoContainer.appendChild(logoImg);
      sidebar.insertBefore(logoContainer, sidebarScrollbox);
    }
  }
}

// Right-hand Table of Contents Generator
window.addEventListener('DOMContentLoaded', function() {
  // Add logo to sidebar on all pages
  addSidebarLogo();
  // Only create TOC for the introduction page
  const isIntroductionPage = window.location.pathname.includes('introduction/introduction.html') || 
                            window.location.pathname.endsWith('introduction.html') ||
                            window.location.pathname.endsWith('/');
  
  if (!isIntroductionPage) return;

  const content = document.querySelector('.content');
  if (!content) return;

  const headings = content.querySelectorAll('h1, h2, h3');
  if (!headings.length) return;

  // Create TOC container
  const toc = document.createElement('nav');
  toc.id = 'right-toc';
  toc.innerHTML = '<h3>On this page</h3>';
  const ul = document.createElement('ul');

  // Generate TOC items
  headings.forEach((heading, index) => {
    // Create a unique ID if it doesn't exist
    if (!heading.id) {
      // Use existing ID if mdBook generated one, otherwise create our own
      const existingId = heading.getAttribute('id');
      if (existingId) {
        heading.id = existingId;
      } else {
        // Create a safe ID from the heading text
        const safeId = heading.textContent.trim()
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
        
        // Ensure uniqueness by adding index if needed
        let finalId = safeId;
        let counter = 1;
        while (document.getElementById(finalId)) {
          finalId = `${safeId}-${counter}`;
          counter++;
        }
        
        heading.id = finalId;
      }
    }

    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = '#' + heading.id;
    a.textContent = heading.textContent;
    
    // Add indentation based on heading level
    if (heading.tagName === 'H2') {
      li.style.marginLeft = '8px';
    } else if (heading.tagName === 'H3') {
      li.style.marginLeft = '16px';
    }
    
    li.appendChild(a);
    ul.appendChild(li);
  });

  toc.appendChild(ul);
  document.body.appendChild(toc);

  // Handle smooth scrolling and active state
  const tocLinks = toc.querySelectorAll('a');
  
  // Function to update active link
  function updateActiveLink() {
    const scrollPosition = window.scrollY + 100; // Offset for header
    
    let currentSection = null;
    
    // Find the current section based on scroll position
    headings.forEach(heading => {
      const elementTop = heading.offsetTop;
      const elementBottom = elementTop + heading.offsetHeight;
      
      if (scrollPosition >= elementTop && scrollPosition < elementBottom) {
        currentSection = heading;
      }
    });
    
    // If no section found, find the one that's closest above current position
    if (!currentSection) {
      for (let i = headings.length - 1; i >= 0; i--) {
        if (headings[i].offsetTop <= scrollPosition) {
          currentSection = headings[i];
          break;
        }
      }
    }
    
    // Update active class
    tocLinks.forEach(link => link.classList.remove('active'));
    if (currentSection) {
      const activeLink = toc.querySelector(`a[href="#${currentSection.id}"]`);
      if (activeLink) {
        activeLink.classList.add('active');
      }
    }
  }

  // Update active link on scroll
  window.addEventListener('scroll', updateActiveLink);
  
  // Initial update
  updateActiveLink();

  // Smooth scrolling for TOC links
  tocLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href').substring(1);
      const targetElement = document.getElementById(targetId);
      
      if (targetElement) {
        // Add a small offset to account for fixed header
        const offset = 80;
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
        
        // Update active link immediately for better UX
        setTimeout(() => {
          updateActiveLink();
        }, 100);
      } else {
        console.warn('Target element not found:', targetId);
      }
    });
  });
}); 