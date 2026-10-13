const ticketForm = document.getElementById('ticketForm');
const formSection = document.getElementById('formSection');
const paymentBox = document.getElementById('paymentBox');
const ticketBox = document.getElementById('ticketBox');
const confirmForm = document.getElementById('confirmForm');
const ticketContent = document.getElementById('ticketContent');
const bookingRefEl = document.getElementById('bookingRef');
const displayAmount = document.getElementById('displayAmount');
const modalAmountDisplay = document.getElementById('modalAmountDisplay');
const paymentModal = document.getElementById('paymentModal');

let orderData = {};
let currentRef = '';

// --- Show Form Logic ---
function showForm(type) {
  formSection.classList.remove('hidden');
  document.getElementById('ticketType').value = type;
  
  const header = document.getElementById('formHeaderTitle');
  const numTicketsLabel = document.getElementById('numTicketsLabel');
  const childNameLabel = document.getElementById('childNameLabel');
  const childClassLabel = document.getElementById('childClassLabel');
  
  if (type === 'child') {
    header.innerText = "Child Participation Fee — UGX 50,000";
    numTicketsLabel.style.display = 'none';
    childNameLabel.style.display = 'block';
    childClassLabel.style.display = 'block';
  } else {
    header.innerText = "Parent / Visitor Ticket — UGX 30,000";
    numTicketsLabel.style.display = 'block';
    childNameLabel.style.display = 'none';
    childClassLabel.style.display = 'none';
  }

  formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function hideForm() {
  formSection.classList.add('hidden');
  ticketForm.reset();
}

// --- Helper to copy numbers ---
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    alert('Copied: ' + text);
  });
}

// --- NEW: Open Phone Dialer with USSD Code ---
function openDialer(ussdCode) {
  // This opens the phone's dialer with the code pre-filled
  window.location.href = 'tel:' + encodeURIComponent(ussdCode);
}

// --- NEW: Open MTN MoMo App ---
function openMoMoApp() {
  // Try to open MTN MoMo app via deep link
  // Fallback to dialer if app not installed
  const appLink = 'mtnmomo://';
  const fallback = 'tel:*165#';
  
  // Try app first, fallback to dialer after 1 second
  window.location.href = appLink;
  setTimeout(() => {
    if (document.hidden === false) {
      window.location.href = fallback;
    }
  }, 1000);
}

// --- NEW: Open Airtel Money App ---
function openAirtelApp() {
  const appLink = 'airtelmoney://';
  const fallback = 'tel:*185#';
  
  window.location.href = appLink;
  setTimeout(() => {
    if (document.hidden === false) {
      window.location.href = fallback;
    }
  }, 1000);
}

// --- NEW: Copy Number and Show Instructions ---
function copyAndShowInstructions(network) {
  const number = network === 'MTN' ? '0772489399' : '0700100800';
  const ussd = network === 'MTN' ? '*165#' : '*185#';
  
  copyToClipboard(number);
  
  const instructions = `
📱 PAYMENT INSTRUCTIONS:

1. Open your phone dialer
2. Dial: ${ussd}
3. Select "Send Money" or "Pay Bill"
4. Enter Number: ${number}
5. Enter Amount: UGX ${orderData.amount.toLocaleString()}
6. Enter your MoMo PIN
7. Copy the Transaction ID from the SMS
8. Paste it on the website to get your ticket!

The number has been copied to your clipboard.
  `;
  
  alert(instructions);
  closePaymentModal();
}

// --- NEW: Show Payment Modal ---
function showPaymentModal() {
  const method = orderData.paymentMethod;
  
  // Update amount display
  modalAmountDisplay.innerText = 'UGX ' + orderData.amount.toLocaleString();
  
  // Show correct network section
  document.getElementById('mtnModalSection').classList.toggle('hidden', method !== 'MTN');
  document.getElementById('airtelModalSection').classList.toggle('hidden', method !== 'AIRTEL');
  
  // Show modal
  paymentModal.classList.remove('hidden');
  document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

// --- NEW: Close Payment Modal ---
function closePaymentModal() {
  paymentModal.classList.add('hidden');
  document.body.style.overflow = ''; // Restore scrolling
}

// --- STEP 1: Show Payment Modal on Form Submit ---
ticketForm.addEventListener('submit', async (e) => {
  e.preventDefault(); 
  
  const formData = new FormData(ticketForm);
  orderData = Object.fromEntries(formData);
  
  // Calculate total amount
  let baseAmount = orderData.ticketType === 'child' ? 50000 : 30000;
  let tickets = parseInt(orderData.numTickets) || 1;
  orderData.amount = baseAmount * tickets;
  orderData.numTickets = tickets;
  
  currentRef = 'OAK-' + Math.floor(Math.random() * 1000000);
  bookingRefEl.textContent = currentRef;
  
  // Show the payment modal instead of going directly to payment box
  showPaymentModal();
});

// --- STEP 2: After user pays, they come back and enter Transaction ID ---
// We need a way for them to get to the transaction ID form
// Add a button in the modal to proceed to the form after payment

// Modify the modal footer to include a "I've Paid" button
// Let's update the modal footer HTML dynamically
const modalFooter = document.querySelector('.modal-footer');
modalFooter.innerHTML = `
  <p>After payment, click below to enter your Transaction ID.</p>
  <button type="button" class="btn-primary" onclick="proceedToTransactionForm()" style="margin-bottom: 10px;">✅ I've Completed Payment</button>
  <button type="button" class="btn-secondary" onclick="closePaymentModal()">Go Back</button>
`;

function proceedToTransactionForm() {
  closePaymentModal();
  
  // Show the payment box with transaction ID form
  displayAmount.textContent = 'UGX ' + orderData.amount.toLocaleString();
  
  const mtnRow = document.getElementById('mtnRow');
  const airtelRow = document.getElementById('airtelRow');
  
  if (orderData.paymentMethod === 'MTN') {
    mtnRow.style.display = 'flex';
    mtnRow.style.background = '#fff8e1';
    mtnRow.style.padding = '10px';
    mtnRow.style.borderRadius = '8px';
    airtelRow.style.display = 'none';
  } else {
    airtelRow.style.display = 'flex';
    airtelRow.style.background = '#fff8e1';
    airtelRow.style.padding = '10px';
    airtelRow.style.borderRadius = '8px';
    mtnRow.style.display = 'none';
  }
  
  formSection.classList.add('hidden');
  document.querySelector('.prices').classList.add('hidden');
  paymentBox.classList.remove('hidden');
  paymentBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// --- STEP 3: Confirm Payment & Show Ticket ---
confirmForm.addEventListener('submit', async (e) => {
  e.preventDefault(); 
  
  const momoRef = confirmForm.querySelector('[name=reference]').value;

  try {
    await fetch('/api/bookings', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ ...orderData, momoRef: momoRef, paid: true })
    });
  } catch (err) { console.log('Database save failed'); }

  const typeLabel = orderData.ticketType === 'child' ? 'Child Participation' : 'Parent / Visitor';
  const now = new Date().toLocaleString();

  let extraRows = '';
  if (orderData.ticketType === 'parent') {
    extraRows += `<div style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px dashed #eee;"><span>Number of Tickets:</span> <b>${orderData.numTickets}</b></div>`;
  } else {
    extraRows += `<div style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px dashed #eee;"><span>Child's Name:</span> <b>${orderData.childName || '—'}</b></div>`;
    extraRows += `<div style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px dashed #eee;"><span>Class:</span> <b>${orderData.childClass || '—'}</b></div>`;
  }

  ticketContent.innerHTML = `
    <h3 style="color:#6a1b9a; margin-bottom:10px; font-size:1.5rem;">Oaklands Nursery & Primary School</h3>
    <p style="color:#666; margin-bottom:20px; font-size:0.9rem;">Music, Dance & Drama — Pre-Primary Graduation 2026</p>
    
    <div style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px dashed #eee;"><span>Parent/Guardian:</span> <b>${orderData.parentName}</b></div>
    <div style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px dashed #eee;"><span>Phone:</span> <b>${orderData.phone}</b></div>
    ${extraRows}
    <div style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px dashed #eee;"><span>Ticket Type:</span> <b>${typeLabel}</b></div>
    <div style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px dashed #eee;"><span>Total Amount Paid:</span> <b>UGX ${Number(orderData.amount).toLocaleString()}</b></div>
    <div style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px dashed #eee;"><span>Payment Method:</span> <b>${orderData.paymentMethod} MoMo</b></div>
    <div style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px dashed #eee;"><span>Transaction ID:</span> <b>${momoRef}</b></div>
    <div style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px dashed #eee;"><span>Issued:</span> <b>${now}</b></div>
    
    <div style="margin-top:20px; padding:15px; background:#f3e5f5; border-radius:8px; text-align:center; font-family:monospace; font-size:1.2rem; color:#4a148c; font-weight:bold;">
      BOOKING REF: ${currentRef}
    </div>
    
    <div style="margin-top:20px; text-align:center; padding:20px; border:2px dashed #6a1b9a; border-radius:10px; color:#6a1b9a;">
      <div id="qrcode-container" style="display:flex; justify-content:center; margin-bottom:10px;"></div>
      <div style="font-weight:bold; letter-spacing:1px; font-size:0.8rem;">SCAN TO BUY TICKET</div>
    </div>
  `;

  const qrContainer = document.getElementById('qrcode-container');
  if (qrContainer) {
    new QRCode(qrContainer, {
      text: window.location.href, width: 140, height: 140,
      colorDark : "#4a148c", colorLight : "#ffffff", correctLevel : QRCode.CorrectLevel.H
    });
  }

  paymentBox.classList.add('hidden');
  ticketBox.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

document.getElementById('downloadPdf').addEventListener('click', () => window.print());
