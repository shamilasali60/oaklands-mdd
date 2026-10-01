const ticketForm = document.getElementById('ticketForm');
const paymentBox = document.getElementById('paymentBox');
const ticketBox = document.getElementById('ticketBox');
const confirmForm = document.getElementById('confirmForm');
const ticketContent = document.getElementById('ticketContent');
const bookingRefEl = document.getElementById('bookingRef');

let orderData = {};
let currentRef = '';

// STEP 1: Create Booking
ticketForm.addEventListener('submit', async (e) => {
    e.preventDefault(); 
    
    const formData = new FormData(ticketForm);
    orderData = Object.fromEntries(formData);
    orderData.amount = orderData.ticketType === 'child' ? 50000 : 30000;

    try {
        const res = await fetch('/api/bookings', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(orderData)
        });
        const data = await res.json();
        currentRef = data.ref;
    } catch (err) {
        currentRef = 'OAK-LOCAL-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    bookingRefEl.textContent = currentRef;
    ticketForm.closest('.card').classList.add('hidden');
    paymentBox.classList.remove('hidden');
});

// STEP 2: Confirm Payment & Show Ticket
confirmForm.addEventListener('submit', async (e) => {
    e.preventDefault(); 
    
    const momoRef = confirmForm.querySelector('[name=reference]').value;

    try {
        await fetch(`/api/bookings/${currentRef}/confirm`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ momoRef })
        });
    } catch (err) { console.log('Backend offline'); }

    const typeLabel = orderData.ticketType === 'child' ? 'Child Participation' : 'Parent / Visitor';
    const now = new Date().toLocaleString();

    // 1. Build the Ticket HTML
    ticketContent.innerHTML = `
        <h3 style="color:#6a1b9a; margin-bottom:10px; font-size:1.5rem;">Oaklands Nursery & Primary School</h3>
        <p style="color:#666; margin-bottom:20px; font-size:0.9rem;">Music, Dance & Drama — Pre-Primary Graduation 2026</p>
        
        <div style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px dashed #eee;"><span>Parent/Guardian:</span> <b>${orderData.parentName}</b></div>
        <div style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px dashed #eee;"><span>Phone:</span> <b>${orderData.phone}</b></div>
        <div style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px dashed #eee;"><span>Child's Name:</span> <b>${orderData.childName || '—'}</b></div>
        <div style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px dashed #eee;"><span>Ticket Type:</span> <b>${typeLabel}</b></div>
        <div style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px dashed #eee;"><span>Amount Paid:</span> <b>UGX ${Number(orderData.amount).toLocaleString()}</b></div>
        <div style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px dashed #eee;"><span>Payment Method:</span> <b>${orderData.paymentMethod} MoMo</b></div>
        <div style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px dashed #eee;"><span>MoMo Ref:</span> <b>${momoRef}</b></div>
        <div style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px dashed #eee;"><span>Issued:</span> <b>${now}</b></div>
        
        <div style="margin-top:20px; padding:15px; background:#f3e5f5; border-radius:8px; text-align:center; font-family:monospace; font-size:1.2rem; color:#4a148c; font-weight:bold;">
            BOOKING REF: ${currentRef}
        </div>
        
        <div style="margin-top:20px; text-align:center; padding:20px; border:2px dashed #6a1b9a; border-radius:10px; color:#6a1b9a;">
            <div id="qrcode-container" style="display:flex; justify-content:center; margin-bottom:10px;"></div>
            <div style="font-weight:bold; letter-spacing:1px; font-size:0.8rem;">SCAN TO BUY TICKET</div>
        </div>
    `;

    // 2. Generate the Real QR Code pointing to the main page
    const qrContainer = document.getElementById('qrcode-container');
    if (qrContainer) {
        new QRCode(qrContainer, {
            text: "https://oaklands-mdd.onrender.com",
            width: 120,
            height: 120,
            colorDark : "#4a148c", 
            colorLight : "#ffffff",
            correctLevel : QRCode.CorrectLevel.H
        });
    }

    paymentBox.classList.add('hidden');
    ticketBox.classList.remove('hidden');
});

// STEP 3: Download/Print
document.getElementById('downloadPdf').addEventListener('click', () => {
    window.print();
});
