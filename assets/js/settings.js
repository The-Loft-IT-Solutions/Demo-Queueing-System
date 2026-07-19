// ===== SETTINGS PAGE JS =====

function initSettings() {
  renderServicesConfig();
  updateNavBadges();

  subscribeToEvents(function(event) {
    updateNavBadges();
  });
}

function renderServicesConfig() {
  const container = document.getElementById('services-config-list');
  if (!container) return;

  const services = Object.values(SERVICES);

  container.innerHTML = services.map(s => {
    const counterNames = s.counterIds.map(cid => COUNTERS[cid]?.name || cid).join(', ');
    return `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 0;border-bottom:1px solid var(--gray-light);">
        <div style="display:flex;align-items:center;gap:14px;">
          <div style="font-size:28px;">${s.icon}</div>
          <div>
            <div style="font-weight:700;font-size:15px;">${s.name}</div>
            <div style="font-size:12px;color:var(--gray);margin-top:2px;">${s.description}</div>
            <div style="font-size:12px;color:var(--gray);margin-top:2px;">Prefix: <strong>${s.prefix}</strong> &bull; Avg: ${s.avgServiceTime}min &bull; Counters: ${counterNames}</div>
          </div>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-sm btn-secondary" onclick="editService('${s.id}')">Edit</button>
        </div>
      </div>
    `;
  }).join('');
}

function editService(id) {
  showToast('Service editing is demo-only. Changes are not persisted.', 'info');
}

function resetDemoData() {
  if (!confirm('Reset all demo data to initial state?')) return;
  resetAllData();
  showToast('Demo data reset successfully', 'success');
  renderServicesConfig();
  updateNavBadges();
}

function clearAllTickets() {
  if (!confirm('Clear all tickets? This cannot be undone.')) return;
  clearTickets();
  showToast('All tickets cleared', 'info');
  updateNavBadges();
}

function exportData() {
  const data = {
    tickets: TICKETS,
    counters: COUNTERS,
    services: SERVICES,
    activityLog: ACTIVITY_LOG,
    exportedAt: new Date().toISOString()
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `queueflow-export-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Data exported successfully', 'success');
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

document.addEventListener('DOMContentLoaded', initSettings);
