// ===== TICKETS PAGE JS =====

let currentTab = 'all';
let currentRemarksTicketId = null;

function initTicketsPage() {
  renderTicketsTable();
  updateNavBadges();

  subscribeToEvents(function(event) {
    renderTicketsTable();
    updateNavBadges();
  });
}

function renderTicketsTable() {
  const tbody = document.getElementById('tickets-body');
  const title = document.getElementById('tickets-table-title');
  if (!tbody) return;

  let filtered = TICKETS;
  if (currentTab !== 'all') {
    filtered = TICKETS.filter(t => t.status === currentTab);
  }

  const search = document.getElementById('ticket-search')?.value?.toLowerCase() || '';
  if (search) {
    filtered = filtered.filter(t =>
      t.number.toLowerCase().includes(search) ||
      t.customerName.toLowerCase().includes(search) ||
      (SERVICES[t.serviceId]?.name || '').toLowerCase().includes(search)
    );
  }

  const sorted = [...filtered].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (title) {
    const labels = { 'all': 'All Tickets', 'pending': 'Waiting Tickets', 'processing': 'In Progress', 'completed': 'Completed Tickets', 'cancelled': 'Cancelled Tickets' };
    title.textContent = labels[currentTab] || 'Tickets';
  }

  tbody.innerHTML = sorted.map(t => `
    <tr>
      <td><span class="ticket-num"><span class="prefix">${t.number.slice(0, 2)}</span>${t.number.slice(2)}</span></td>
      <td>${SERVICES[t.serviceId]?.name || t.serviceId}</td>
      <td>${t.customerName}</td>
      <td>${t.counterId ? COUNTERS[t.counterId]?.name || t.counterId : '-'}</td>
      <td>${getPriorityBadge(t.priority)}</td>
      <td>${getStatusBadge(t.status)}</td>
      <td>${formatTime(t.createdAt)}</td>
      <td>
        <div style="display:flex;gap:4px;flex-wrap:wrap;">
          ${t.status === 'pending' ? `<button class="btn btn-sm btn-primary" onclick="processTicket('${t.id}')">Call</button>` : ''}
          ${t.status === 'processing' ? `<button class="btn btn-sm btn-success" onclick="completeTicket('${t.id}')">Complete</button>` : ''}
          ${t.status === 'pending' ? `<button class="btn btn-sm btn-danger" onclick="cancelTicket('${t.id}')">Cancel</button>` : ''}
          <button class="btn btn-sm btn-secondary" onclick="openRemarks('${t.id}')">Remarks</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function switchTab(tabBtn) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  tabBtn.classList.add('active');
  currentTab = tabBtn.dataset.tab;
  renderTicketsTable();
}

function searchTickets() {
  renderTicketsTable();
}

function processTicket(id) {
  const ticket = getTicketById(id);
  if (!ticket || ticket.status !== 'pending') return;

  const counter = getAvailableCounterForService(ticket.serviceId);
  if (!counter) {
    showToast('No available counter for this service', 'error');
    return;
  }

  ticket.status = 'processing';
  ticket.counterId = counter.id;
  ticket.processedAt = new Date().toISOString();
  COUNTERS[counter.id].currentTicket = ticket;

  addActivity('processed', `Ticket <span class="ticket-id">${ticket.number}</span> called to ${counter.name}`);
  broadcastEvent('ticket-processed', { ticket, counter });

  showToast(`Ticket ${ticket.number} called to ${counter.name}`, 'success');
  renderTicketsTable();
  updateNavBadges();
}

function completeTicket(id) {
  const ticket = getTicketById(id);
  if (!ticket || ticket.status !== 'processing') return;

  const counterId = ticket.counterId;
  ticket.status = 'completed';
  ticket.completedAt = new Date().toISOString();

  if (counterId && COUNTERS[counterId]) {
    COUNTERS[counterId].currentTicket = null;
  }

  addActivity('completed', `Ticket <span class="ticket-id">${ticket.number}</span> completed at ${COUNTERS[counterId]?.name || 'Counter'}`);
  broadcastEvent('ticket-completed', { ticket });

  showToast(`Ticket ${ticket.number} completed`, 'success');
  renderTicketsTable();
  updateNavBadges();
}

function cancelTicket(id) {
  const ticket = getTicketById(id);
  if (!ticket || ticket.status !== 'pending') return;

  if (!confirm(`Cancel ticket ${ticket.number} for ${ticket.customerName}?`)) return;

  ticket.status = 'cancelled';
  ticket.cancelledAt = new Date().toISOString();

  addActivity('cancelled', `Ticket <span class="ticket-id">${ticket.number}</span> cancelled`);
  broadcastEvent('ticket-cancelled', { ticket });

  showToast(`Ticket ${ticket.number} cancelled`, 'info');
  renderTicketsTable();
  updateNavBadges();
}

function openRemarks(id) {
  currentRemarksTicketId = id;
  const ticket = getTicketById(id);
  if (!ticket) return;
  document.getElementById('remarks-text').value = ticket.remarks || '';
  openModal('remarks-modal');
}

function saveRemarks() {
  const ticket = getTicketById(currentRemarksTicketId);
  if (!ticket) return;
  ticket.remarks = document.getElementById('remarks-text').value.trim();
  closeModal('remarks-modal');
  showToast('Remarks saved', 'success');
  renderTicketsTable();
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

  document.getElementById('new-ticket-name').value = '';
  document.getElementById('new-ticket-service').value = '';
  document.getElementById('new-ticket-priority').value = 'normal';
  document.getElementById('new-ticket-notes').value = '';

  closeModal('create-ticket-modal');
  showToast(`Ticket ${ticket.number} created successfully!`, 'success');
  renderTicketsTable();
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
  renderTicketsTable();
  updateNavBadges();
  showToast('Data refreshed', 'info');
}

document.addEventListener('DOMContentLoaded', initTicketsPage);
