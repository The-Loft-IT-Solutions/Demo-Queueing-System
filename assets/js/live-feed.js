// ===== LIVE FEED PAGE JS =====

let autoScroll = true;

function initLiveFeed() {
  renderLiveFeed();
  updateNavBadges();

  subscribeToEvents(function(event) {
    renderLiveFeed();
    updateNavBadges();
    if (autoScroll) {
      const body = document.getElementById('live-feed-body');
      if (body) body.scrollTop = 0;
    }
  });
}

function renderLiveFeed() {
  const body = document.getElementById('live-feed-body');
  if (!body) return;

  if (ACTIVITY_LOG.length === 0) {
    body.innerHTML = '<div style="padding:40px;text-align:center;color:var(--gray);">No activity yet</div>';
    return;
  }

  body.innerHTML = ACTIVITY_LOG.map(item => {
    const typeLabels = {
      'created': 'Created',
      'processed': 'Called',
      'completed': 'Completed',
      'cancelled': 'Cancelled'
    };
    return `
      <div class="feed-item">
        <span class="feed-time">${formatTime(item.time)}</span>
        <span class="feed-badge ${item.type}">${typeLabels[item.type] || item.type}</span>
        <span class="feed-text">${item.message}</span>
      </div>
    `;
  }).join('');
}

function clearFeed() {
  ACTIVITY_LOG = [];
  renderLiveFeed();
  updateNavBadges();
  showToast('Activity feed cleared', 'info');
}

function toggleAutoScroll() {
  autoScroll = !autoScroll;
  const btn = document.getElementById('autoscroll-btn');
  if (btn) {
    btn.style.opacity = autoScroll ? '1' : '0.5';
  }
  showToast(autoScroll ? 'Auto-scroll enabled' : 'Auto-scroll disabled', 'info');
}

function updateNavBadges() {
  const total = TICKETS.length;
  const activeCounters = Object.values(COUNTERS).filter(c => c.status === 'active').length;
  const liveCount = ACTIVITY_LOG.length;

  document.querySelectorAll('#nav-total-tickets').forEach(el => { if(el) el.textContent = total; });
  document.querySelectorAll('#nav-active-counters').forEach(el => { if(el) el.textContent = activeCounters; });
  document.querySelectorAll('#nav-live-count').forEach(el => { if(el) el.textContent = liveCount; });
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

function refreshData() {
  renderLiveFeed();
  updateNavBadges();
  showToast('Data refreshed', 'info');
}

document.addEventListener('DOMContentLoaded', initLiveFeed);
