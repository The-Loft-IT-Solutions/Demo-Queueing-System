// ===== DEMO DATA STORE =====
// Simulates a backend database with in-memory storage
// ALL CHANGES REQUIRE USER INTERACTION - no auto-simulation

const SERVICES = {
  'account-services': {
    id: 'account-services',
    name: 'Account Services',
    prefix: 'AC',
    icon: '&#128179;',
    description: 'Balance inquiry, account updates, and statements',
    avgServiceTime: 8,
    counterIds: ['A1', 'A2']
  },
  'loan-processing': {
    id: 'loan-processing',
    name: 'Loan Processing',
    prefix: 'LN',
    icon: '&#128176;',
    description: 'Loan applications, payments, and inquiries',
    avgServiceTime: 15,
    counterIds: ['B1']
  },
  'bill-payments': {
    id: 'bill-payments',
    name: 'Bill Payments',
    prefix: 'BP',
    icon: '&#128185;',
    description: 'Utility bills, credit card, and other payments',
    avgServiceTime: 5,
    counterIds: ['A1', 'C1']
  },
  'new-accounts': {
    id: 'new-accounts',
    name: 'New Accounts',
    prefix: 'NA',
    icon: '&#128221;',
    description: 'Open new savings, checking, or time deposit',
    avgServiceTime: 20,
    counterIds: ['B2']
  },
  'support-desk': {
    id: 'support-desk',
    name: 'Support Desk',
    prefix: 'SP',
    icon: '&#128222;',
    description: 'General inquiries and customer support',
    avgServiceTime: 10,
    counterIds: ['C1', 'C2']
  }
};

const COUNTERS = {
  'A1': { id: 'A1', name: 'Counter A1', staff: 'Staff A', services: ['account-services', 'bill-payments'], status: 'active', currentTicket: null },
  'A2': { id: 'A2', name: 'Counter A2', staff: 'Staff B', services: ['account-services'], status: 'active', currentTicket: null },
  'B1': { id: 'B1', name: 'Counter B1', staff: 'Staff C', services: ['loan-processing'], status: 'active', currentTicket: null },
  'B2': { id: 'B2', name: 'Counter B2', staff: 'Staff D', services: ['new-accounts'], status: 'active', currentTicket: null },
  'C1': { id: 'C1', name: 'Counter C1', staff: 'Staff E', services: ['bill-payments', 'support-desk'], status: 'active', currentTicket: null },
  'C2': { id: 'C2', name: 'Counter C2', staff: 'Staff F', services: ['support-desk'], status: 'active', currentTicket: null }
};

// Ticket sequences per service
let TICKET_SEQUENCES = {
  'AC': 12,
  'LN': 5,
  'BP': 18,
  'NA': 3,
  'SP': 9
};

// Demo tickets - static initial data
let TICKETS = [];

// Activity log
let ACTIVITY_LOG = [];

function generateTicketId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function generateTicketNumber(prefix) {
  TICKET_SEQUENCES[prefix] = (TICKET_SEQUENCES[prefix] || 0) + 1;
  return prefix + String(TICKET_SEQUENCES[prefix]).padStart(3, '0');
}

function getServiceById(id) {
  return SERVICES[id] || null;
}

function getCounterById(id) {
  return COUNTERS[id] || null;
}

function getTicketsByStatus(status) {
  return TICKETS.filter(t => t.status === status);
}

function getTicketsByService(serviceId) {
  return TICKETS.filter(t => t.serviceId === serviceId);
}

function getTicketById(id) {
  return TICKETS.find(t => t.id === id) || null;
}

function getWaitingTickets() {
  return TICKETS.filter(t => t.status === 'pending').sort((a, b) => {
    const priorityOrder = { 'urgent': 0, 'priority': 1, 'normal': 2 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return new Date(a.createdAt) - new Date(b.createdAt);
  });
}

function getCounterTickets(counterId) {
  return TICKETS.filter(t => t.counterId === counterId && t.status === 'pending').sort((a, b) => {
    const priorityOrder = { 'urgent': 0, 'priority': 1, 'normal': 2 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return new Date(a.createdAt) - new Date(b.createdAt);
  });
}

function getCountersForService(serviceId) {
  return Object.values(COUNTERS).filter(c => c.services.includes(serviceId) && c.status === 'active');
}

function getAvailableCounterForService(serviceId) {
  const counters = getCountersForService(serviceId);
  let bestCounter = null;
  let minPending = Infinity;
  for (const counter of counters) {
    const pending = getCounterTickets(counter.id).length;
    if (pending < minPending) {
      minPending = pending;
      bestCounter = counter;
    }
  }
  return bestCounter;
}

function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function timeAgo(dateStr) {
  const now = new Date();
  const then = new Date(dateStr);
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return diffMins + ' min ago';
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return diffHours + ' hr ago';
  return Math.floor(diffHours / 24) + ' days ago';
}

function getPriorityLabel(priority) {
  const labels = { 'normal': 'Normal', 'priority': 'Priority', 'urgent': 'Urgent' };
  return labels[priority] || priority;
}

function getStatusBadge(status) {
  const badges = {
    'pending': '<span class="badge badge-pending"><span class="badge-dot"></span>Waiting</span>',
    'processing': '<span class="badge badge-processing"><span class="badge-dot"></span>In Progress</span>',
    'completed': '<span class="badge badge-completed"><span class="badge-dot"></span>Completed</span>',
    'cancelled': '<span class="badge badge-cancelled"><span class="badge-dot"></span>Cancelled</span>'
  };
  return badges[status] || status;
}

function getPriorityBadge(priority) {
  const colors = { 'normal': 'var(--gray)', 'priority': 'var(--warning)', 'urgent': 'var(--danger)' };
  const labels = { 'normal': 'Normal', 'priority': 'Priority', 'urgent': 'Urgent' };
  return `<span style="color:${colors[priority]};font-weight:600;font-size:12px;">${labels[priority]}</span>`;
}

// ===== INITIAL DEMO DATA =====
function initDemoData() {
  const now = new Date();

  const demoTickets = [
    { id: generateTicketId(), number: 'AC013', serviceId: 'account-services', customerName: 'Customer A', priority: 'normal', status: 'completed', counterId: 'A1', createdAt: new Date(now - 3600000 * 3).toISOString(), processedAt: new Date(now - 3600000 * 2.5).toISOString(), completedAt: new Date(now - 3600000 * 2.2).toISOString(), remarks: 'Account balance verified' },
    { id: generateTicketId(), number: 'AC014', serviceId: 'account-services', customerName: 'Customer B', priority: 'priority', status: 'completed', counterId: 'A2', createdAt: new Date(now - 3600000 * 2.8).toISOString(), processedAt: new Date(now - 3600000 * 2.3).toISOString(), completedAt: new Date(now - 3600000 * 2.0).toISOString(), remarks: 'Statement request processed' },
    { id: generateTicketId(), number: 'LN006', serviceId: 'loan-processing', customerName: 'Customer C', priority: 'normal', status: 'processing', counterId: 'B1', createdAt: new Date(now - 3600000 * 1.5).toISOString(), processedAt: new Date(now - 3600000 * 1.2).toISOString(), remarks: '' },
    { id: generateTicketId(), number: 'BP019', serviceId: 'bill-payments', customerName: 'Customer D', priority: 'normal', status: 'completed', counterId: 'C1', createdAt: new Date(now - 3600000 * 2.5).toISOString(), processedAt: new Date(now - 3600000 * 2.2).toISOString(), completedAt: new Date(now - 3600000 * 2.1).toISOString(), remarks: 'Meralco bill paid' },
    { id: generateTicketId(), number: 'NA004', serviceId: 'new-accounts', customerName: 'Customer E', priority: 'normal', status: 'pending', counterId: null, createdAt: new Date(now - 3600000 * 0.8).toISOString(), remarks: '' },
    { id: generateTicketId(), number: 'SP010', serviceId: 'support-desk', customerName: 'Customer F', priority: 'urgent', status: 'pending', counterId: null, createdAt: new Date(now - 3600000 * 0.5).toISOString(), remarks: 'Card not working' },
    { id: generateTicketId(), number: 'BP020', serviceId: 'bill-payments', customerName: 'Customer G', priority: 'normal', status: 'pending', counterId: null, createdAt: new Date(now - 3600000 * 0.4).toISOString(), remarks: '' },
    { id: generateTicketId(), number: 'AC015', serviceId: 'account-services', customerName: 'Customer H', priority: 'normal', status: 'pending', counterId: null, createdAt: new Date(now - 3600000 * 0.3).toISOString(), remarks: '' },
    { id: generateTicketId(), number: 'SP011', serviceId: 'support-desk', customerName: 'Customer I', priority: 'priority', status: 'pending', counterId: null, createdAt: new Date(now - 3600000 * 0.2).toISOString(), remarks: '' },
    { id: generateTicketId(), number: 'LN007', serviceId: 'loan-processing', customerName: 'Customer J', priority: 'normal', status: 'pending', counterId: null, createdAt: new Date(now - 3600000 * 0.1).toISOString(), remarks: '' },
    { id: generateTicketId(), number: 'NA005', serviceId: 'new-accounts', customerName: 'Customer K', priority: 'normal', status: 'cancelled', counterId: null, createdAt: new Date(now - 3600000 * 4).toISOString(), cancelledAt: new Date(now - 3600000 * 3.5).toISOString(), remarks: 'Customer left' }
  ];

  TICKETS = demoTickets;

  // Assign some pending tickets to counters
  const pending = getWaitingTickets();
  let idx = 0;
  for (const counterId of ['A1', 'A2', 'C1', 'C2']) {
    if (pending[idx]) {
      pending[idx].counterId = counterId;
      idx++;
    }
  }

  // Set current tickets for counters
  COUNTERS['B1'].currentTicket = getTicketById(demoTickets[2].id);

  // Activity log
  ACTIVITY_LOG = [
    { time: new Date(now - 60000 * 2).toISOString(), type: 'created', message: 'Ticket <span class="ticket-id">AC015</span> created for Customer H' },
    { time: new Date(now - 60000 * 5).toISOString(), type: 'processed', message: 'Ticket <span class="ticket-id">LN006</span> called to Counter B1' },
    { time: new Date(now - 60000 * 8).toISOString(), type: 'completed', message: 'Ticket <span class="ticket-id">BP019</span> completed at Counter C1' },
    { time: new Date(now - 60000 * 12).toISOString(), type: 'created', message: 'Ticket <span class="ticket-id">SP010</span> created for Customer F (Urgent)' },
    { time: new Date(now - 60000 * 15).toISOString(), type: 'created', message: 'Ticket <span class="ticket-id">BP020</span> created for Customer G' },
    { time: new Date(now - 60000 * 20).toISOString(), type: 'completed', message: 'Ticket <span class="ticket-id">AC014</span> completed at Counter A2' },
    { time: new Date(now - 60000 * 25).toISOString(), type: 'created', message: 'Ticket <span class="ticket-id">AC013</span> created for Customer A' },
    { time: new Date(now - 60000 * 30).toISOString(), type: 'cancelled', message: 'Ticket <span class="ticket-id">NA005</span> cancelled - Customer left' }
  ];

  updateCounterCurrentTickets();
}

function updateCounterCurrentTickets() {
  for (const counterId in COUNTERS) {
    const processing = TICKETS.find(t => t.counterId === counterId && t.status === 'processing');
    COUNTERS[counterId].currentTicket = processing || null;
  }
}

function addActivity(type, message) {
  ACTIVITY_LOG.unshift({
    time: new Date().toISOString(),
    type: type,
    message: message
  });
  if (ACTIVITY_LOG.length > 100) {
    ACTIVITY_LOG = ACTIVITY_LOG.slice(0, 100);
  }
}

function resetAllData() {
  TICKETS = [];
  ACTIVITY_LOG = [];
  TICKET_SEQUENCES = { 'AC': 0, 'LN': 0, 'BP': 0, 'NA': 0, 'SP': 0 };
  for (const cid in COUNTERS) {
    COUNTERS[cid].currentTicket = null;
  }
  initDemoData();
}

function clearTickets() {
  TICKETS = [];
  ACTIVITY_LOG = [];
  TICKET_SEQUENCES = { 'AC': 0, 'LN': 0, 'BP': 0, 'NA': 0, 'SP': 0 };
  for (const cid in COUNTERS) {
    COUNTERS[cid].currentTicket = null;
  }
}

// Initialize on load
if (typeof window !== 'undefined') {
  initDemoData();
}
