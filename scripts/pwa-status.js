// scripts/pwa-status.js

document.addEventListener('DOMContentLoaded', () => {
  const statusBadge = document.getElementById('pwa-status-badge');
  const statusText = statusBadge?.querySelector('.status-text');

  if (!statusBadge) return;

  function updateOnlineStatus() {
    if (navigator.onLine) {
      statusBadge.classList.remove('is-offline');
      statusBadge.classList.add('online');
      if (statusText) statusText.textContent = '✓ Works Offline';
    } else {
      statusBadge.classList.remove('online');
      statusBadge.classList.add('is-offline');
      if (statusText) statusText.textContent = '⚡ Offline Mode Active';
    }
  }

  // Initial check & network change listeners
  updateOnlineStatus();
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
});