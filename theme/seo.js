(function () {
  var softwareApp = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Recon",
    "alternateName": ["Recon Pro", "Recon Fuzz", "GetRecon"],
    "applicationCategory": "DeveloperApplication",
    "applicationSubCategory": "Smart Contract Security Testing",
    "operatingSystem": "Web, VS Code",
    "url": "https://getrecon.xyz",
    "sameAs": [
      "https://book.getrecon.xyz",
      "https://x.com/getreconxyz",
      "https://github.com/Recon-Fuzz",
      "https://getrecon.substack.com/",
      "https://www.linkedin.com/company/recon-fuzz",
      "https://www.dailywarden.com",
      "https://www.onebugperday.com"
    ],
    "description": "Cloud-native invariant testing platform for EVM smart contracts. Run Echidna, Medusa, Foundry, Halmos, and Kontrol fuzzing jobs in the cloud with real-time Telegram alerts, CI/CD campaigns, AI-powered harness generation, and governance fuzzing.",
    "featureList": [
      "Cloud fuzzing with Echidna, Medusa, Foundry, Halmos, Kontrol",
      "AI-powered fuzzing suite generation (Recon Magic)",
      "CI/CD campaigns with GitHub PR integration",
      "Real-time Telegram and webhook alerts on broken properties",
      "Dynamic variable replacement for multi-config testing",
      "Governance fuzzing with on-chain event monitoring",
      "Chimera framework: write once, run on all fuzzers",
      "Automatic Foundry reproducer generation",
      "Corpus reuse and cloud-persisted corpus management",
      "VS Code extension for scaffolding and coverage"
    ],
    "softwareRequirements": "Foundry, Solidity >=0.8",
    "author": {
      "@type": "Organization",
      "name": "Recon",
      "url": "https://getrecon.xyz",
      "sameAs": [
        "https://x.com/getreconxyz",
        "https://github.com/Recon-Fuzz",
        "https://getrecon.substack.com/",
        "https://www.linkedin.com/company/recon-fuzz",
        "https://www.dailywarden.com",
        "https://www.onebugperday.com"
      ],
      "founder": {
        "@type": "Person",
        "name": "Alex the Entreprenerd",
        "alternateName": "GalloDaSballo",
        "url": "https://x.com/GalloDaSballo",
        "jobTitle": "Founder & Lead Security Researcher",
        "knowsAbout": ["Smart Contract Security", "Invariant Testing", "DeFi Security", "Fuzzing", "EVM"]
      },
      "foundingDate": "2023",
      "numberOfEmployees": {
        "@type": "QuantitativeValue",
        "minValue": 5,
        "maxValue": 10
      }
    },
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "description": "Free tools available; Pro subscription for cloud features"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "5",
      "reviewCount": "9",
      "bestRating": "5"
    }
  };

  var techArticle = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "headline": "Recon Book: Complete Guide to Invariant Testing for Smart Contracts",
    "description": "Technical documentation covering invariant testing methodology, the Chimera framework, cloud fuzzing with Recon Pro, AI-powered harness generation, and advanced techniques like governance fuzzing and optimization mode.",
    "url": "https://book.getrecon.xyz",
    "isPartOf": {
      "@type": "WebSite",
      "name": "Recon",
      "url": "https://getrecon.xyz"
    },
    "inLanguage": "en",
    "author": [
      {
        "@type": "Person",
        "name": "Alex the Entreprenerd",
        "alternateName": "GalloDaSballo",
        "url": "https://x.com/GalloDaSballo",
        "jobTitle": "Founder & Lead Security Researcher"
      },
      {
        "@type": "Person",
        "name": "nican0r",
        "jobTitle": "Lead Invariants Engineer"
      }
    ],
    "publisher": {
      "@type": "Organization",
      "name": "Recon",
      "url": "https://getrecon.xyz",
      "sameAs": [
        "https://x.com/getreconxyz",
        "https://github.com/Recon-Fuzz",
        "https://getrecon.substack.com/",
        "https://www.linkedin.com/company/recon-fuzz",
        "https://www.dailywarden.com",
        "https://www.onebugperday.com"
      ]
    },
    "about": [
      "Invariant Testing",
      "Smart Contract Fuzzing",
      "Property-Based Testing",
      "EVM Security",
      "Solidity Testing"
    ],
    "proficiencyLevel": "Expert",
    "dependencies": "Foundry, Solidity, Echidna, Medusa"
  };

  var script1 = document.createElement("script");
  script1.type = "application/ld+json";
  script1.textContent = JSON.stringify(softwareApp);
  document.head.appendChild(script1);

  var script2 = document.createElement("script");
  script2.type = "application/ld+json";
  script2.textContent = JSON.stringify(techArticle);
  document.head.appendChild(script2);

  // Canonical URL
  var canonical = document.createElement("link");
  canonical.rel = "canonical";
  canonical.href = window.location.origin + window.location.pathname;
  document.head.appendChild(canonical);

  // og:url (needs runtime URL)
  var ogUrl = document.createElement("meta");
  ogUrl.setAttribute("property", "og:url");
  ogUrl.content = window.location.origin + window.location.pathname;
  document.head.appendChild(ogUrl);

  // BreadcrumbList JSON-LD
  var pathParts = window.location.pathname.replace(/\/index\.html$/, '/').replace(/\/$/, '').split('/').filter(Boolean);
  var breadcrumbItems = [{
    "@type": "ListItem",
    "position": 1,
    "name": "Recon Book",
    "item": "https://book.getrecon.xyz/"
  }];
  var accumulated = "https://book.getrecon.xyz";
  for (var i = 0; i < pathParts.length; i++) {
    accumulated += "/" + pathParts[i];
    var name = pathParts[i]
      .replace(/\.html$/, '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, function(c) { return c.toUpperCase(); });
    breadcrumbItems.push({
      "@type": "ListItem",
      "position": i + 2,
      "name": name,
      "item": accumulated
    });
  }
  if (breadcrumbItems.length > 1) {
    var breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": breadcrumbItems
    };
    var script3 = document.createElement("script");
    script3.type = "application/ld+json";
    script3.textContent = JSON.stringify(breadcrumbSchema);
    document.head.appendChild(script3);
  }

  // FAQPage JSON-LD — targets AI Overviews and featured snippets
  var faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is invariant testing for smart contracts?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Invariant testing verifies that logical properties of a smart contract hold true across all possible state transitions. Unlike unit tests that check specific scenarios, invariant tests use fuzzers (Echidna, Medusa) or formal verifiers (Halmos, Kontrol) to explore thousands of random call sequences, catching edge cases humans miss. Recon's Chimera framework lets you write these tests once and run them on all five tools."
        }
      },
      {
        "@type": "Question",
        "name": "What is the Chimera framework?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Chimera is Recon's open-source write-once testing framework for EVM smart contracts. You write property-based tests in a single codebase and run them on Foundry, Echidna, Medusa, Halmos, and Kontrol without changing your test code. It provides abstractions for Setup, TargetFunctions, Properties, BeforeAfter hooks, and CryticTester. The Chimera template has been used over 300 times by professional auditors."
        }
      },
      {
        "@type": "Question",
        "name": "How does Recon Pro cloud fuzzing work?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Recon Pro offloads long-duration fuzzing jobs to cloud infrastructure. You push your code to GitHub, configure a job with your chosen tool (Echidna, Medusa, Foundry, Halmos, or Kontrol), and Recon runs it in the cloud. You get real-time Telegram and webhook alerts when properties break, CI/CD campaigns that auto-fuzz on git push with PR comments, and automatic Foundry reproducer generation for broken properties."
        }
      },
      {
        "@type": "Question",
        "name": "What is Recon Magic?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Recon Magic uses Claude-powered AI agents to auto-generate fuzzing suites, handlers, and properties for your smart contracts. Workflows include Scout (analyze contract), Setup (scaffold test suite), Coverage (maximize code coverage), and Properties (generate invariant properties). It supports both Sonnet and Opus models for different speed/quality tradeoffs."
        }
      },
      {
        "@type": "Question",
        "name": "What is the difference between Echidna and Medusa?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Both are stateful fuzzers for Solidity smart contracts, but they use different strategies. Echidna is Haskell-based with coverage-guided genetic algorithms and supports optimization mode for maximizing numeric values. Medusa is Go-based with parallel execution and faster initial exploration. Recon's Chimera framework lets you run both from the same test suite — use Echidna for deep optimization and Medusa for broad coverage."
        }
      },
      {
        "@type": "Question",
        "name": "How much DeFi TVL does Recon protect?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Recon protects over $3 billion in DeFi total value locked. The platform has executed over 12,500 cloud fuzzing runs and saved over $20 million in user funds through discovered vulnerabilities. Clients include Liquity, Centrifuge, Badger, Corn, Balancer, Quill Finance, and Credit Coop."
        }
      }
    ]
  };
  var scriptFaq = document.createElement("script");
  scriptFaq.type = "application/ld+json";
  scriptFaq.textContent = JSON.stringify(faqSchema);
  document.head.appendChild(scriptFaq);

  // Recency signals — load per-page last-modified dates
  var rootPath = typeof path_to_root !== 'undefined' ? path_to_root : '';
  fetch(rootPath + 'lastmodified.json')
    .then(function(r) { return r.json(); })
    .then(function(dates) {
      var page = window.location.pathname.replace(/^\//, '');
      if (page === '' || page.endsWith('/')) page += 'index.html';
      var date = dates[page];
      if (!date) return;
      // article:modified_time meta tag
      var meta = document.createElement('meta');
      meta.setAttribute('property', 'article:modified_time');
      meta.content = date + 'T00:00:00Z';
      document.head.appendChild(meta);
      // Update TechArticle dateModified if present
      var ldScripts = document.querySelectorAll('script[type="application/ld+json"]');
      for (var i = 0; i < ldScripts.length; i++) {
        try {
          var ld = JSON.parse(ldScripts[i].textContent);
          if (ld['@type'] === 'TechArticle') {
            ld.dateModified = date;
            ldScripts[i].textContent = JSON.stringify(ld);
          }
        } catch(e) {}
      }
      // Visible "Last updated" badge
      var contentEl = document.getElementById('content');
      if (contentEl) {
        var badge = document.createElement('div');
        badge.style.cssText = 'text-align:center;font-size:0.8rem;opacity:0.6;margin-top:2rem;';
        badge.textContent = 'Last updated: ' + date;
        contentEl.appendChild(badge);
      }
    })
    .catch(function() {});

  // Sitewide backlink footer to getrecon.xyz
  var content = document.getElementById("content");
  if (content) {
    var footer = document.createElement("footer");
    footer.style.cssText = "margin-top:1rem;padding:1.5rem 0;border-top:1px solid var(--sidebar-separator,#3b3b3b);text-align:center;font-size:0.85rem;opacity:0.8;";
    footer.innerHTML = '<a href="https://getrecon.xyz" target="_blank" rel="noopener">Recon</a> · '
      + '<a href="https://getrecon.xyz/dashboard/jobs" target="_blank" rel="noopener">Cloud Fuzzing</a> · '
      + '<a href="https://getrecon.xyz/dashboard/magic" target="_blank" rel="noopener">Recon Magic</a> · '
      + '<a href="https://discord.gg/aCZrCBZdFd" target="_blank" rel="noopener">Discord</a> · '
      + '<a href="https://x.com/getrecon" target="_blank" rel="noopener">Twitter</a>';
    content.appendChild(footer);
  }
})();
