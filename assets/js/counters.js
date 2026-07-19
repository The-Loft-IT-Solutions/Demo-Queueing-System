// ===== COUNTERS PAGE JS =====

function initCountersPage() {
  renderCounters();
  updateNavBadges();

  subscribeToEvents(function(event) {
    renderCounters();
    updateNavBadges();
  });
}

function renderCounters() {
  const container = document.getElementById('counters-grid');
  if (!container) return;

  let html = '';
  for (const counterId in COUNTERS) {
    const counter = COUNTERS[counterId];
    const waiting = getCounterTickets(counterId);
    const current = counter.currentTicket;
    const serviceNames = counter.services.map(sid => SERVICES[sid]?.name || sid).join(', ');

    html += `
      <div class="queue-counter">
        <div class="queue-counter-header">
          <h3>${counter.name}</h3>
          <span class="counter-num" style="${counter.status === 'active' ? 'color:rgba(255,255,255,0.85);' : 'color:var(--danger);'}">${counter.status === 'active' ? 'Active' : 'Closed'}</span>
        </div>
        <div class="queue-counter-body">
          <div style="margin-bottom:14px;">
            <div style="font-size:12px;color:var(--gray);margin-bottom:4px;">Staff</div>
            <div style="font-size:15px;font-weight:600;">${counter.staff}</div>
          </div>
          <div style="margin-bottom:14px;">
            <div style="font-size:12px;color:var(--gray);margin-bottom:4px;">Services</div>
            <div style="font-size:13px;color:var(--dark);">${serviceNames}</div>
          </div>
          ${current ? `
            <div class="current-serving" style="padding:14px;background:#e8f0fe;border-radius:var(--radius-sm);margin-bottom:14px;">
              <div class="current-serving-label" style="font-size:11px;">Now Serving</div>
              <div class="current-serving-number" style="font-size:36px;">${current.number}</div>
              <div class="current-serving-name" style="font-size:14px;">${current.customerName}</div>
            </div>
          ` : `
            <div style="padding:20px;text-align:center;background:var(--light);border-radius:var(--radius-sm);margin-bottom:14px;">
              <div style="font-size:14px;color:var(--gray);font-weight:600;">Available</div>
              <div style="font-size:12px;color:var(--gray);margin-top:4px;">Ready for next customer</div>
            </div>
          `}
          ${waiting.length > 0 ? `
            <div class="waiting-list">
              <div class="waiting-list-title">Queue (${waiting.length})</div>
              ${waiting.slice(0, 5).map(t => `
                <div class="waiting-item">
                  <span class="ticket">${t.number}</span>
                  <span class="name">${t.customerName}</span>
                  <span class="wait-time">${timeAgo(t.createdAt)}</span>
                </div>
              `).join('')}
              ${waiting.length > 5 ? `<div style="text-align:center;font-size:12px;color:var(--gray);padding:8px;">+${waiting.length - 5} more waiting</div>` : ''}
            </div>
          ` : `
            <div style="text-align:center;padding:16px;color:var(--gray);font-size:13px;">No customers in queue</div>
          `}
          <div style="display:flex;gap:8px;margin-top:14px;">
            ${current ? `
              <button class="btn btn-sm btn-success" style="flex:1;" onclick="completeFromCounter('${counterId}')">Complete</button>
              <button class="btn btn-sm btn-primary" style="flex:1;" onclick="callNextFromCounter('${counterId}')" ${waiting.length === 0 ? 'disabled' : ''}>Next</button>
            ` : `
              <button class="btn btn-sm btn-primary" style="width:100%;" onclick="callNextFromCounter('${counterId}')" ${waiting.length === 0 ? 'disabled' : ''}>Call Next</button>
            `}
          </div>
        </div>
      </div>
    `;
  }
  container.innerHTML = html;
}

function callNextFromCounter(counterId) {
  const counter = COUNTERS[counterId];
  if (!counter) return;

  // First complete current if any
  if (counter.currentTicket) {
    completeFromCounter(counterId);
  }

  const waiting = getCounterTickets(counterId);
  if (waiting.length === 0) {
    showToast('No customers in queue', 'info');
    return;
  }

  const next = waiting[0];
  next.status = 'processing';
  next.processedAt = new Date().toISOString();
  counter.currentTicket = next;

  addActivity('processed', `Ticket <span class="ticket-id">${next.number}</span> called to ${counter.name}`);
  broadcastEvent('ticket-processed', { ticket: next, counter });

  showToast(`Called ${next.number} to ${counter.name}`, 'success');
  renderCounters();
  updateNavBadges();
}

function completeFromCounter(counterId) {
  const counter = COUNTERS[counterId];
  if (!counter || !counter.currentTicket) return;

  const ticket = counter.currentTicket;
  ticket.status = 'completed';
  ticket.completedAt = new Date().toISOString();
  counter.currentTicket = null;

  addActivity('completed', `Ticket <span class="ticket-id">${ticket.number}</span> completed at ${counter.name}`);
  broadcastEvent('ticket-completed', { ticket });

  showToast(`Ticket ${ticket.number} completed`, 'success');
  renderCounters();
  updateNavBadges();
}

function addCounter() {
  const name = document.getElementById('counter-name')?.value.trim();
  const staff = document.getElementById('counter-staff')?.value.trim();
  const select = document.getElementById('counter-service');
  const services = Array.from(select.selectedOptions).map(o => o.value);

  if (!name) { showToast('Enter counter name', 'error'); return; }
  if (!staff) { showToast('Enter staff name', 'error'); return; }
  if (services.length === 0) { showToast('Select at least one service', 'error'); return; }

  const id = String.fromCharCode(65 + Object.keys(COUNTERS).length) + '1';
  COUNTERS[id] = {
    id: id,
    name: name,
    staff: staff,
    services: services,
    status: 'active',
    currentTicket: null
  };

  closeModal('add-counter-modal');
  document.getElementById('counter-name').value = '';
  document.getElementById('counter-staff').value = '';
  document.getElementById('counter-service').selectedIndex = -1;

  showToast(`Counter ${name} added`, 'success');
  renderCounters();
  updateNavBadges();
}

function openModal(id) {
  document.getElementById(id)?.classList.add('active');
}

function closeModal(id) {
  document.getElementById(id)?.classList.remove('active');
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

function updateNavBadges() {
  const total = TICKETS.length;
  const activeCounters = Object.values(COUNTERS).filter(c => c.status === 'active').length;
  const liveCount = ACTIVITY_LOG.length;

  document.querySelectorAll('#nav-total-tickets').forEach(el => { if(el) el.textContent = total; });
  document.querySelectorAll('#nav-active-counters').forEach(el => { if(el) el.textContent = activeCounters; });
  document.querySelectorAll('#nav-live-count').forEach(el => { if(el) el.textContent = liveCount; });
}

function refreshData() {
  renderCounters();
  updateNavBadges();
  showToast('Data refreshed', 'info');
}

document.addEventListener('DOMContentLoaded', initCountersPage);
