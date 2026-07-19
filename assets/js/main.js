// ===== MAIN DASHBOARD JS =====

function initDashboard() {
  renderStats();
  renderQueueDisplay();
  renderRecentTickets();
  updateNavBadges();

  // Subscribe to live events
  subscribeToEvents(function(event) {
    renderStats();
    renderQueueDisplay();
    renderRecentTickets();
    updateNavBadges();
  });
}

function renderStats() {
  const total = TICKETS.length;
  const pending = TICKETS.filter(t => t.status === 'pending').length;
  const processing = TICKETS.filter(t => t.status === 'processing').length;
  const completed = TICKETS.filter(t => t.status === 'completed').length;
  const cancelled = TICKETS.filter(t => t.status === 'cancelled').length;

  let avgTime = 0;
  const completedTickets = TICKETS.filter(t => t.status === 'completed' && t.processedAt && t.completedAt);
  if (completedTickets.length > 0) {
    const totalMs = completedTickets.reduce((sum, t) => {
      return sum + (new Date(t.completedAt) - new Date(t.processedAt));
    }, 0);
    avgTime = Math.round(totalMs / completedTickets.length / 60000);
  }

  const elTotal = document.getElementById('stat-total');
  const elPending = document.getElementById('stat-pending');
  const elProcessing = document.getElementById('stat-processing');
  const elCompleted = document.getElementById('stat-completed');
  const elCancelled = document.getElementById('stat-cancelled');
  const elAvg = document.getElementById('stat-avg-time');

  if (elTotal) elTotal.textContent = total;
  if (elPending) elPending.textContent = pending;
  if (elProcessing) elProcessing.textContent = processing;
  if (elCompleted) elCompleted.textContent = completed;
  if (elCancelled) elCancelled.textContent = cancelled;
  if (elAvg) elAvg.textContent = avgTime + 'm';
}

function renderQueueDisplay() {
  const container = document.getElementById('queue-display');
  if (!container) return;

  let html = '';
  for (const counterId in COUNTERS) {
    const counter = COUNTERS[counterId];
    const waiting = getCounterTickets(counterId);
    const current = counter.currentTicket;

    html += `
      <div class="queue-counter">
        <div class="queue-counter-header">
          <h3>${counter.name}</h3>
          <span class="counter-num">${counter.staff}</span>
        </div>
        <div class="queue-counter-body">
          ${current ? `
            <div class="current-serving">
              <div class="current-serving-label">Now Serving</div>
              <div class="current-serving-number">${current.number}</div>
              <div class="current-serving-name">${current.customerName}</div>
              <div class="current-serving-service">${SERVICES[current.serviceId]?.name || ''}</div>
            </div>
          ` : `
            <div class="current-serving">
              <div class="current-serving-label">Status</div>
              <div class="current-serving-name" style="font-size:18px;color:var(--gray);">Available</div>
              <div class="current-serving-service">Ready for next customer</div>
            </div>
          `}
          ${waiting.length > 0 ? `
            <div class="waiting-list">
              <div class="waiting-list-title">Waiting (${waiting.length})</div>
              ${waiting.slice(0, 3).map(t => `
                <div class="waiting-item">
                  <span class="ticket">${t.number}</span>
                  <span class="name">${t.customerName}</span>
                  <span class="wait-time">${timeAgo(t.createdAt)}</span>
                </div>
              `).join('')}
              ${waiting.length > 3 ? `<div style="text-align:center;font-size:12px;color:var(--gray);padding:8px;">+${waiting.length - 3} more</div>` : ''}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }
  container.innerHTML = html;
}

function renderRecentTickets() {
  const tbody = document.getElementById('recent-tickets-body');
  if (!tbody) return;

  const recent = [...TICKETS].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 8);

  tbody.innerHTML = recent.map(t => `
    <tr>
      <td><span class="ticket-num"><span class="prefix">${t.number.slice(0, 2)}</span>${t.number.slice(2)}</span></td>
      <td>${SERVICES[t.serviceId]?.name || t.serviceId}</td>
      <td>${t.customerName}</td>
      <td>${t.counterId ? COUNTERS[t.counterId]?.name || t.counterId : '-'}</td>
      <td>${getStatusBadge(t.status)}</td>
      <td>${formatTime(t.createdAt)}</td>
      <td>
        <button class="btn btn-sm btn-secondary" onclick="viewTicket('${t.id}')">View</button>
      </td>
    </tr>
  `).join('');
}

function updateNavBadges() {
  const total = TICKETS.length;
  const activeCounters = Object.values(COUNTERS).filter(c => c.status === 'active').length;
  const liveCount = ACTIVITY_LOG.length;

  document.querySelectorAll('#nav-total-tickets').forEach(el => { if(el) el.textContent = total; });
  document.querySelectorAll('#nav-active-counters').forEach(el => { if(el) el.textContent = activeCounters; });
  document.querySelectorAll('#nav-live-count').forEach(el => { if(el) el.textContent = liveCount; });
}

function viewTicket(id) {
  const ticket = getTicketById(id);
  if (!ticket) return;
  showToast(`Ticket ${ticket.number} - ${ticket.customerName} (${ticket.status})`, 'info');
}

function openModal(id) {
  document.getElementById(id)?.classList.add('active');
}

function closeModal(id) {
  document.getElementById(id)?.classList.remove('active');
}

function createTicketFromModal() {
  const name = document.getElementById('new-ticket-name')?.value.trim();
  const serviceId = document.getElementById('new-ticket-service')?.value;
  const priority = document.getElementById('new-ticket-priority')?.value || 'normal';
  const notes = document.getElementById('new-ticket-notes')?.value.trim();

  if (!name) { showToast('Please enter customer name', 'error'); return; }
  if (!serviceId) { showToast('Please select a service', 'error'); return; }

  const service = SERVICES[serviceId];
  const ticket = {
    id: generateTicketId(),
    number: generateTicketNumber(service.prefix),
    serviceId: serviceId,
    customerName: name,
    priority: priority,
    status: 'pending',
    counterId: null,
    createdAt: new Date().toISOString(),
    remarks: notes
  };

  TICKETS.push(ticket);
  addActivity('created', `Ticket <span class="ticket-id">${ticket.number}</span> created for ${name}`);
  broadcastEvent('ticket-created', { ticket });

  // Clear form
  document.getElementById('new-ticket-name').value = '';
  document.getElementById('new-ticket-service').value = '';
  document.getElementById('new-ticket-priority').value = 'normal';
  document.getElementById('new-ticket-notes').value = '';

  closeModal('create-ticket-modal');
  showToast(`Ticket ${ticket.number} created successfully!`, 'success');

  renderStats();
  renderQueueDisplay();
  renderRecentTickets();
  updateNavBadges();
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
  renderStats();
  renderQueueDisplay();
  renderRecentTickets();
  updateNavBadges();
  showToast('Data refreshed', 'info');
}

// Init
document.addEventListener('DOMContentLoaded', initDashboard);
