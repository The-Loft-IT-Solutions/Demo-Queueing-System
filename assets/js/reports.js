// ===== REPORTS / ANALYTICS JS =====

function initReports() {
  renderReportStats();
  renderServiceBreakdown();
  renderCounterPerformance();
  updateNavBadges();

  subscribeToEvents(function(event) {
    renderReportStats();
    renderServiceBreakdown();
    renderCounterPerformance();
    updateNavBadges();
  });
}

function renderReportStats() {
  const total = TICKETS.length;
  const completed = TICKETS.filter(t => t.status === 'completed').length;

  let avgWait = 0;
  const completedWithWait = TICKETS.filter(t => t.status === 'completed' && t.processedAt && t.createdAt);
  if (completedWithWait.length > 0) {
    const totalMs = completedWithWait.reduce((sum, t) => {
      return sum + (new Date(t.processedAt) - new Date(t.createdAt));
    }, 0);
    avgWait = Math.round(totalMs / completedWithWait.length / 60000);
  }

  let avgService = 0;
  if (completedWithWait.length > 0) {
    const totalServiceMs = completedWithWait.reduce((sum, t) => {
      return sum + (new Date(t.completedAt || t.processedAt) - new Date(t.processedAt));
    }, 0);
    avgService = Math.round(totalServiceMs / completedWithWait.length / 60000);
  }

  const elTotal = document.getElementById('report-total');
  const elCompleted = document.getElementById('report-completed');
  const elAvgWait = document.getElementById('report-avg-wait');
  const elAvgService = document.getElementById('report-avg-service');

  if (elTotal) elTotal.textContent = total;
  if (elCompleted) elCompleted.textContent = completed;
  if (elAvgWait) elAvgWait.textContent = avgWait + 'm';
  if (elAvgService) elAvgService.textContent = avgService + 'm';
}

function renderServiceBreakdown() {
  const tbody = document.getElementById('service-breakdown-body');
  if (!tbody) return;

  const services = Object.values(SERVICES);

  tbody.innerHTML = services.map(s => {
    const serviceTickets = TICKETS.filter(t => t.serviceId === s.id);
    const total = serviceTickets.length;
    const completed = serviceTickets.filter(t => t.status === 'completed').length;
    const cancelled = serviceTickets.filter(t => t.status === 'cancelled').length;

    let avgWait = 0;
    const completedSvc = serviceTickets.filter(t => t.status === 'completed' && t.processedAt && t.createdAt);
    if (completedSvc.length > 0) {
      const totalMs = completedSvc.reduce((sum, t) => sum + (new Date(t.processedAt) - new Date(t.createdAt)), 0);
      avgWait = Math.round(totalMs / completedSvc.length / 60000);
    }

    let avgService = 0;
    if (completedSvc.length > 0) {
      const totalMs = completedSvc.reduce((sum, t) => sum + (new Date(t.completedAt || t.processedAt) - new Date(t.processedAt)), 0);
      avgService = Math.round(totalMs / completedSvc.length / 60000);
    }

    const successRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return `
      <tr>
        <td><strong>${s.name}</strong></td>
        <td>${total}</td>
        <td>${completed}</td>
        <td>${cancelled}</td>
        <td>${avgWait}m</td>
        <td>${avgService}m</td>
        <td><span style="color:${successRate >= 90 ? 'var(--secondary)' : successRate >= 70 ? 'var(--warning)' : 'var(--danger)'};font-weight:700;">${successRate}%</span></td>
      </tr>
    `;
  }).join('');
}

function renderCounterPerformance() {
  const tbody = document.getElementById('counter-performance-body');
  if (!tbody) return;

  const counters = Object.values(COUNTERS);

  tbody.innerHTML = counters.map(c => {
    const counterTickets = TICKETS.filter(t => t.counterId === c.id && t.status === 'completed');
    const served = counterTickets.length;

    let avgService = 0;
    if (served > 0) {
      const totalMs = counterTickets.reduce((sum, t) => {
        return sum + (new Date(t.completedAt || t.processedAt) - new Date(t.processedAt));
      }, 0);
      avgService = Math.round(totalMs / served / 60000);
    }

    const efficiency = served > 0 ? Math.min(100, Math.round((served / 20) * 100)) : 0;

    return `
      <tr>
        <td><strong>${c.name}</strong></td>
        <td>${c.staff}</td>
        <td>${served}</td>
        <td>${avgService}m</td>
        <td>
          <div style="background:var(--light);border-radius:4px;height:8px;overflow:hidden;width:120px;">
            <div style="background:${efficiency >= 80 ? 'var(--secondary)' : efficiency >= 50 ? 'var(--warning)' : 'var(--danger)'};height:100%;width:${efficiency}%;border-radius:4px;"></div>
          </div>
          <span style="font-size:11px;color:var(--gray);">${efficiency}%</span>
        </td>
        <td><span class="badge ${c.status === 'active' ? 'badge-completed' : 'badge-cancelled'}">${c.status === 'active' ? 'Active' : 'Closed'}</span></td>
      </tr>
    `;
  }).join('');
}

function updateNavBadges() {
  const total = TICKETS.length;
  const activeCounters = Object.values(COUNTERS).filter(c => c.status === 'active').length;
  const liveCount = ACTIVITY_LOG.length;

  document.querySelectorAll('#nav-total-tickets').forEach(el => { if(el) el.textContent = total; });
  document.querySelectorAll('#nav-active-counters').forEach(el => { if(el) el.textContent = activeCounters; });
  document.querySelectorAll('#nav-live-count').forEach(el => { if(el) el.textContent = liveCount; });
}

function refreshData() {
  renderReportStats();
  renderServiceBreakdown();
  renderCounterPerformance();
  updateNavBadges();
  showToast('Data refreshed', 'info');
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

document.addEventListener('DOMContentLoaded', initReports);
