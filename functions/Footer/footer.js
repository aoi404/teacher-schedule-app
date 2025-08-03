// Footer functionality placeholder
// Add any footer-specific JS here

// Footer functionality for cycling messages
function startFooterCycle() {
  const footerMessages = [
    'Contact Us: 09122222222',
    'ken.morimoto7@gmail.com',
    'Address: G4WG+R34, Sitio Lambak Barangay San Juan, Taytay, Lalawigan ng Rizal'
  ];
  let footerIndex = 0;
  const intervalId = setInterval(() => {
    const footerCycle = document.getElementById('footerCycle');
    if (footerCycle) {
      footerIndex = (footerIndex + 1) % footerMessages.length;
      footerCycle.textContent = footerMessages[footerIndex];
    } else {
      clearInterval(intervalId);
    }
  }, 3000);
}

// Ensure cycling starts after footer is loaded dynamically
if (window.location.pathname.includes('/index/')) {
  // For index.html, DOM is ready immediately
  startFooterCycle();
} else {
  // For dynamic loads, use a MutationObserver to detect when footer is inserted
  const observer = new MutationObserver(() => {
    if (document.getElementById('footerCycle')) {
      startFooterCycle();
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}
