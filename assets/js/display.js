// ===== PUBLIC DISPLAY JS =====

function initDisplay() {
  renderDisplayCounters();
  updateDisplayClock();
  updateDisplayStats();
  setInterval(updateDisplayClock, 1000);

  subscribeToEvents(function(event) {
    renderDisplayCounters();
    updateDisplayStats();

    // Flash animation on the counter that was updated
    if (event.type === 'ticket-processed' && event.payload?.counter?.id) {
      const counterEl = document.querySelector(`[data-counter-id="${event.payload.counter.id}"]`);
      if (counterEl) {
        counterEl.classList.add('now-serving');
        setTimeout(() => counterEl.classList.remove('now-serving'), 3000);
      }
    }
  });
}

function renderDisplayCounters() {
  const container = document.getElementById('display-counters');
  if (!container) return;

  let html = '';
  for (const counterId in COUNTERS) {
    const counter = COUNTERS[counterId];
    const current = counter.currentTicket;
    const serviceNames = counter.services.map(sid => SERVICES[sid]?.name || sid).join(', ');

    html += `
      <div class="display-counter ${current ? '' : ''}" data-counter-id="${counterId}">
        <div class="display-counter-header">
          <h3>${counter.name}</h3>
          <span class="status ${current ? 'busy' : ''}">${current ? 'BUSY' : 'ACTIVE'}</span>
        </div>
        <div class="display-counter-body">
          ${current ? `
            <div class="display-current-label">Now Serving</div>
            <div class="display-current-number">${current.number}</div>
            <div class="display-current-name">${current.customerName}</div>
            <div class="display-current-service">${SERVICES[current.serviceId]?.name || ''}</div>
          ` : `
            <div class="display-counter-empty">Please Wait</div>
            <div style="font-size:14px;color:rgba(255,255,255,0.4);margin-top:8px;">${serviceNames}</div>
          `}
        </div>
      </div>
    `;
  }
  container.innerHTML = html;
}

function updateDisplayClock() {
  const el = document.getElementById('display-clock');
  if (el) {
    el.textContent = new Date().toLocaleTimeString('en-US', { hour12: false });
  }
}

function updateDisplayStats() {
  const completed = TICKETS.filter(t => t.status === 'completed').length;
  const waiting = TICKETS.filter(t => t.status === 'pending').length;

  let avgWait = 0;
  const completedTickets = TICKETS.filter(t => t.status === 'completed' && t.processedAt && t.createdAt);
  if (completedTickets.length > 0) {
    const totalMs = completedTickets.reduce((sum, t) => {
      return sum + (new Date(t.processedAt) - new Date(t.createdAt));
    }, 0);
    avgWait = Math.round(totalMs / completedTickets.length / 60000);
  }

  const serviceRate = completed > 0 ? Math.round(completed / 8) : 0;

  const elServed = document.getElementById('display-total-served');
  const elAvgWait = document.getElementById('display-avg-wait');
  const elWaiting = document.getElementById('display-waiting');
  const elRate = document.getElementById('display-service-rate');

  if (elServed) elServed.textContent = completed;
  if (elAvgWait) elAvgWait.textContent = avgWait + 'm';
  if (elWaiting) elWaiting.textContent = waiting;
  if (elRate) elRate.textContent = serviceRate + '/hr';
}

document.addEventListener('DOMContentLoaded', initDisplay);
