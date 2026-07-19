// ===== KIOSK TERMINAL JS =====
// User must enter their name via modal - no auto-generated data

let selectedServiceId = null;

function initKiosk() {
  renderKioskServices();
  updateKioskClock();
  setInterval(updateKioskClock, 1000);

  subscribeToEvents(function(event) {
    renderKioskServices();
  });

  // Enter key on name input submits
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && document.getElementById('name-modal')?.classList.contains('active')) {
      submitKioskName();
    }
  });
}

function renderKioskServices() {
  const container = document.getElementById('kiosk-services');
  if (!container) return;

  const services = Object.values(SERVICES);

  container.innerHTML = services.map(s => {
    const waiting = TICKETS.filter(t => t.serviceId === s.id && t.status === 'pending').length;
    const estWait = waiting * s.avgServiceTime;
    const estText = waiting === 0 ? 'No wait' : estWait < 60 ? `~${estWait} min wait` : `~${Math.round(estWait / 60)} hr wait`;

    return `
      <div class="service-btn" onclick="openKioskNameModal('${s.id}')">
        <div class="icon">${s.icon}</div>
        <div class="name">${s.name}</div>
        <div class="desc">${s.description}</div>
        <div class="wait-est">${waiting} waiting &bull; ${estText}</div>
      </div>
    `;
  }).join('');
}

function openKioskNameModal(serviceId) {
  selectedServiceId = serviceId;
  document.getElementById('kiosk-name-input').value = '';
  document.getElementById('kiosk-priority-input').value = 'normal';
  openModal('name-modal');
  // Focus input after modal opens
  setTimeout(() => {
    document.getElementById('kiosk-name-input')?.focus();
  }, 100);
}

function submitKioskName() {
  const name = document.getElementById('kiosk-name-input')?.value.trim();
  const priority = document.getElementById('kiosk-priority-input')?.value || 'normal';

  if (!name) {
    showToast('Please enter your name', 'error');
    return;
  }

  closeModal('name-modal');
  generateKioskTicket(selectedServiceId, name, priority);
}

function generateKioskTicket(serviceId, customerName, priority) {
  const service = SERVICES[serviceId];
  if (!service) return;

  const ticket = {
    id: generateTicketId(),
    number: generateTicketNumber(service.prefix),
    serviceId: serviceId,
    customerName: customerName,
    priority: priority,
    status: 'pending',
    counterId: null,
    createdAt: new Date().toISOString(),
    remarks: ''
  };

  TICKETS.push(ticket);
  addActivity('created', `Ticket <span class="ticket-id">${ticket.number}</span> created via Kiosk for ${customerName}`);
  broadcastEvent('ticket-created', { ticket });

  // Show ticket print
  showTicketPrint(ticket);
  renderKioskServices();
}

function showTicketPrint(ticket) {
  const service = SERVICES[ticket.serviceId];
  const waiting = TICKETS.filter(t => t.serviceId === ticket.serviceId && t.status === 'pending' && t.id !== ticket.id).length;
  const estWait = waiting * (service?.avgServiceTime || 10);
  const estText = waiting === 0 ? 'Next in line' : estWait < 60 ? `~${estWait} min` : `~${Math.round(estWait / 60)} hr`;

  const now = new Date();
  document.getElementById('ticket-datetime').textContent = now.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  document.getElementById('ticket-number').textContent = ticket.number;
  document.getElementById('ticket-service-name').textContent = service?.name || '';
  document.getElementById('ticket-counter-info').textContent = 'Please proceed to the waiting area';
  document.getElementById('ticket-wait-time').textContent = estText;
  document.getElementById('ticket-ahead').textContent = waiting.toString();
  document.getElementById('ticket-date').textContent = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  document.getElementById('ticket-overlay').classList.add('active');
}

function closeTicketOverlay() {
  document.getElementById('ticket-overlay').classList.remove('active');
}

function updateKioskClock() {
  const el = document.getElementById('kiosk-clock');
  if (el) {
    el.textContent = new Date().toLocaleTimeString('en-US', { hour12: false });
  }
}

function openModal(id) {
  document.getElementById(id)?.classList.add('active');
}

function closeModal(id) {
  document.getElementById(id)?.classList.remove('active');
}

function showToast(message, type) {
  // Simple alert fallback for kiosk since toast container doesn't exist here
  if (type === 'error') {
    alert(message);
  }
}

document.addEventListener('DOMContentLoaded', initKiosk);
