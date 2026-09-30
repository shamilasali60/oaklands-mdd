const API = '/api'; // change to full URL if backend is hosted elsewhere

const ticketForm   = document.getElementById('ticketForm');
const paymentBox   = document.getElementById('paymentBox');
const ticketBox    = document.getElementById('ticketBox');
const confirmForm  = document.getElementById('confirmForm');
const ticketEl     = document.getElementById('ticketContent');
const bookingRefEl = document.getElementById('bookingRef');

let orderData = {};
let currentRef = null;

/* ---------- Gate verification mode ---------- */
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.has('verify')) {
  verifyTicket(urlParams.get('verify'));
}

/* ---------- Step 1: create booking ---------- */
ticketForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = new FormData(ticketForm);
  orderData = {
    parentName: data.get('parentName'),
    phone: data.get('phone'),
    email: data.get('email') || null,
    childName: data.get('childName') || null,
    ticketType: data.get('ticketType'),
    paymentMethod: data.get('paymentMethod'),
    amount: data.get('ticketType') === 'child' ? 50000 : 30000,
  };

  // Highlight correct MoMo number
  document.querySelectorAll('.paybox div').forEach(d => d.style.fontWeight = 'normal');
  const highlightId = orderData.paymentMethod === 'MTN' ? 'mtnNumber' : 'airtelNumber';
  document.getElementById(highlightId).parentElement.style.fontWeight = '700';

  try {
    const res = await fetch(`${API}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    });
    const booking = await res.json();
    currentRef = booking.ref;
    bookingRefEl.textContent = currentRef;
  } catch (err) {
    // Fallback: generate a client-side ref if backend is down
    currentRef = 'OAK-LOCAL-' + Math.random().toString(36).slice(2, 8).toUpperCase();
    bookingRefEl.textContent = currentRef + ' (offline)';
  }

  ticketForm.closest('.card').classList.add('hidden');
  paymentBox.classList.remove('hidden');
  window.scrollTo({ top: paymentBox.offsetTop - 20, behavior: 'smooth' });
});

/* ---------- Step 2: confirm payment ---------- */
confirmForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const momoRef = confirmForm.querySelector('[name=reference]').value.trim();

  try {
    await fetch(`${API}/bookings/${currentRef}/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ momoRef }),
    });
  } catch (err) {
    console.warn('Backend unreachable — saving locally');
  }

  renderTicket(momoRef);
  paymentBox.classList.add('hidden');
  ticketBox.classList.remove('hidden');
  window.scrollTo({ top: ticketBox.offsetTop - 20, behavior: 'smooth' });
});

/* ---------- Render ticket + QR ---------- */
function renderTicket(momoRef) {
  const now = new Date().toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
  const typeLabel = orderData.ticketType === 'child'
    ? 'Child Participation' : 'Parent / Visitor';

  ticketEl.innerHTML = `
    <h3>Oaklands Nursery & Primary School</h3>
    <div class="subtitle">Music, Dance & Drama — Pre-Primary Graduation 2026</div>
    <div class="row"><span>Parent / Guardian</span><b>${esc(orderData.parentName)}</b></div>
    <div class="row"><span>Phone</span><b>${esc(orderData.phone)}</b></div>
    <div class="row"><span>Child's Name</span><b>${esc(orderData.childName || '—')}</b></div>
    <div class="row"><span>Ticket Type</span><b>${typeLabel}</b></div>
    <div class="row"><span>Amount Paid</span><b>UGX ${orderData.amount.toLocaleString()}</b></div>
    <div class="row"><span>Payment</span><b>${orderData.paymentMethod} MoMo</b></div>
    <div class="row"><span>MoMo Ref</span><b>${esc(momoRef)}</b></div>
    <div class="row"><span>Event Date</span><b>20 November 2026</b></div>
    <div class="row"><span>Issued</span><b>${now}</b></div>
    <div class="ref">REF: ${currentRef}</div>
  `;

  // Generate QR — encodes a verification URL
  const verifyUrl = `${location.origin}/?verify=${currentRef}`;
  QRCode.toCanvas(document.getElementById('qrCanvas'), verifyUrl, {
    width: 200, margin: 1,
    color: { dark: '#4a148c', light: '#ffffff' },
  });
}

/* ---------- PDF download ---------- */
document.getElementById('downloadPdf').addEventListener('click', async () => {
  const btn = document.getElementById('downloadPdf');
  btn.disabled = true;
  btn.textContent = 'Generating PDF…';

  try {
    const canvas = await html2canvas(document.getElementById('ticket'), {
      scale: 2, backgroundColor: '#ffffff',
    });
    const imgData = canvas.toDataURL('image/png');
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a6' });

    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgW = pageW - 10;
    const imgH = (canvas.height * imgW) / canvas.width;

    pdf.addImage(imgData, 'PNG', 5, 5, imgW, Math.min(imgH, pageH - 10));
    pdf.save(`Oaklands-Ticket-${currentRef}.pdf`);
  } catch (err) {
    alert('Could not generate PDF: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = '⬇ Download PDF Ticket';
  }
});

/* ---------- Gate verification ---------- */
async function verifyTicket(ref) {
  const box = document.getElementById('verifyBox');
  const out = document.getElementById('verifyResult');
  box.classList.remove('hidden');

  try {
    const res = await fetch(`${API}/bookings/${ref}`);
    const data = await res.json();
    if (data.found && data.paid) {
      out.innerHTML = `
        <div class="verify-ok">
          <h3>✓ Valid Ticket</h3>
          <p><b>${esc(data.parentName)}</b> — ${data.typeLabel}</p>
          <p>Child: ${esc(data.childName || '—')}</p>
          <p>Amount: UGX ${Number(data.amount).toLocaleString()}</p>
          <p>MoMo Ref: ${esc(data.momoRef)}</p>
        </div>`;
    } else if (data.found) {
      out.innerHTML = `<div class="verify-fail"><h3>⚠ Payment not confirmed</h3>
        <p>This booking exists but payment has not been verified yet.</p></div>`;
    } else {
      out.innerHTML = `<div class="verify-fail"><h3>✗ Ticket not found</h3>
        <p>No booking matches reference <b>${esc(ref)}</b>.</p></div>`;
    }
  } catch (err) {
    out.innerHTML = `<div class="verify-fail"><h3>Server unreachable</h3>
      <p>Cannot verify ticket — check your connection.</p></div>`;
  }
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}