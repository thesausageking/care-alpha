const screen = document.getElementById('screen');
const patientModeBtn = document.getElementById('patientMode');
const doctorModeBtn = document.getElementById('doctorMode');
const backBtn = document.getElementById('backBtn');
const resetBtn = document.getElementById('resetBtn');

let mode = 'patient';
let historyStack = [];
let currentScreen = 'welcome';

const flows = {
  patient: {
    welcome: () => `
      <h2>See a doctor nearby, today.</h2>
      <p class="small">In-person private appointments in London. 18+ only.</p>
      <button class="btn" data-next="verifyAge">Continue</button>
    `,
    verifyAge: () => `
      <h2>Quick check</h2>
      <p class="small">You must be 18+ to book.</p>
      <input placeholder="Date of birth (DD/MM/YYYY)" />
      <button class="btn" data-next="mapList">I am 18+</button>
    `,
    mapList: () => `
      <h2>Doctors near you</h2>
      <div class="card">
        <div class="row"><strong>Dr Khan</strong><span>£65</span></div>
        <div class="row small"><span>0.2 miles</span><span>★ 4.8 (124)</span></div>
        <button class="btn secondary" data-next="profile1">View</button>
      </div>
      <div class="card">
        <div class="row"><strong>Dr Patel</strong><span>£55</span></div>
        <div class="row small"><span>0.4 miles</span><span>★ 4.7 (91)</span></div>
        <button class="btn secondary" data-next="profile2">View</button>
      </div>
      <p class="small">Sorted by earliest availability.</p>
    `,
    profile1: () => doctorProfile('Dr Khan', '£65', '12:15 PM'),
    profile2: () => doctorProfile('Dr Patel', '£55', '12:40 PM'),
    book: () => `
      <h2>Booking details</h2>
      <div class="card">
        <div class="row"><span>Consultation</span><strong id="price">£55</strong></div>
        <div class="row"><span>Deposit (15%)</span><strong>£8.25</strong></div>
        <div class="row"><span>Duration</span><strong>15 mins</strong></div>
      </div>
      <p class="small">Emergency symptoms? Call 999 or go to A&E.</p>
      <button class="btn" data-next="payment">Pay deposit with Apple Pay</button>
    `,
    payment: () => `
      <h2>Apple Pay</h2>
      <div class="card"><strong>Pay £8.25 now</strong><p class="small">Remaining paid at clinic.</p></div>
      <button class="btn" data-next="confirmed">Confirm payment</button>
    `,
    confirmed: () => `
      <h2>Booked ✅</h2>
      <div class="card">
        <p><strong>Dr Patel</strong></p>
        <p class="small">Today, 12:40 PM</p>
        <p class="small">City of London Clinic</p>
      </div>
      <button class="btn secondary" data-next="welcome">Done</button>
    `,
  },
  doctor: {
    welcome: () => `
      <h2>Doctor onboarding</h2>
      <p class="small">Join Care and get bookings from nearby patients.</p>
      <button class="btn" data-next="gmc">Start verification</button>
    `,
    gmc: () => `
      <h2>GMC verification</h2>
      <input placeholder="GMC number" />
      <input placeholder="Clinic address" />
      <button class="btn" data-next="pricing">Submit verification</button>
    `,
    pricing: () => `
      <h2>Set your price</h2>
      <input value="£65 per 15 mins" />
      <button class="btn" data-next="availability">Save price</button>
    `,
    availability: () => `
      <h2>Availability</h2>
      <p class="small">Choose when you appear in the app.</p>
      <select><option>Mon–Fri 12:00–14:00</option></select>
      <button class="btn" data-next="online">Save availability</button>
    `,
    online: () => `
      <h2>Status: Online</h2>
      <span class="badge ok">Visible to patients</span>
      <div class="card">
        <div class="row"><strong>New booking</strong><span>12:40 PM</span></div>
        <p class="small">Patient near Liverpool Street</p>
      </div>
      <button class="btn secondary" data-next="welcome">Back to start</button>
    `,
  }
};

function doctorProfile(name, price, slot) {
  return `
    <h2>${name}</h2>
    <span class="badge ok">GMC verified</span>
    <div class="card">
      <div class="row"><span>Price</span><strong>${price}</strong></div>
      <div class="row"><span>Nearest slot</span><strong>${slot}</strong></div>
      <div class="row"><span>Rating</span><strong>4.8 ★</strong></div>
    </div>
    <button class="btn" data-next="book">Book now</button>
  `;
}

function render() {
  const html = flows[mode][currentScreen]();
  screen.innerHTML = html;
  document.querySelectorAll('[data-next]').forEach(btn => {
    btn.addEventListener('click', () => {
      historyStack.push(currentScreen);
      currentScreen = btn.dataset.next;
      render();
    });
  });
}

function resetFlow() {
  historyStack = [];
  currentScreen = 'welcome';
  render();
}

patientModeBtn.addEventListener('click', () => {
  mode = 'patient';
  patientModeBtn.classList.add('active');
  doctorModeBtn.classList.remove('active');
  resetFlow();
});

doctorModeBtn.addEventListener('click', () => {
  mode = 'doctor';
  doctorModeBtn.classList.add('active');
  patientModeBtn.classList.remove('active');
  resetFlow();
});

backBtn.addEventListener('click', () => {
  if (!historyStack.length) return;
  currentScreen = historyStack.pop();
  render();
});

resetBtn.addEventListener('click', resetFlow);

render();
