const ticketForm = document.getElementById('ticketForm');
const formSection = document.getElementById('formSection');
const paymentBox = document.getElementById('paymentBox');
const ticketBox = document.getElementById('ticketBox');
const confirmForm = document.getElementById('confirmForm');
const ticketContent = document.getElementById('ticketContent');
const bookingRefEl = document.getElementById('bookingRef');
const displayAmount = document.getElementById('displayAmount');

let orderData = {};
let currentRef = '';

// --- Draw QR Code on Main Page ---
window.addEventListener('load', () => {
    const mainQr = document.getElementById('main-page-qr');
    if (mainQr) {
        new QRCode(mainQr, {
            text: window.location.href, width: 180, height: 180,
            colorDark : "#4a148c", colorLight : "#ffffff", correctLevel : QRCode.CorrectLevel.H
        });
    }
});

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
        alert('Number copied: ' + text);
    });
}

// --- STEP 1: Show Payment Instructions ---
ticketForm.addEventListener('submit', async (e) => {
    e.preventDefault(); 
    
    const formData = new FormData(ticketForm);
    orderData = Object.fromEntries(formData);
    
    // Calculate total amount dynamically
    let baseAmount = orderData.ticketType === 'child' ? 50000 : 30000;
    let tickets = parseInt(orderData.numTickets) || 1;
    orderData.amount = baseAmount * tickets;
    orderData.numTickets = tickets; // Save for ticket display
    
    currentRef = 'OAK-' + Math.floor(Math.random() * 1000000);

    displayAmount.textContent = 'UGX ' + orderData.amount.toLocaleString();

    // Highlight the correct payment row
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

    bookingRefEl.textContent = currentRef;
    formSection.classList.add('hidden');
    document.querySelector('.prices').classList.add('hidden');
    paymentBox.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// --- STEP 2: Confirm Payment & Show Ticket ---
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

    // Build extra rows based on ticket type
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
