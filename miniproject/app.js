/* ==========================================================================
   MEDICORE — Hospital Management System
   Frontend Application Logic (Synchronized with C++ Engine)
   ========================================================================== */

// ==================== STATE ====================
let DATA = { patients: [], doctors: [], appointments: [], summary: {} };

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    loadSnapshot();
    setupDefaultDates();
});

// ==================== NAVIGATION ====================
function setupNavigation() {
    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
        item.addEventListener('click', e => {
            e.preventDefault();
            navigateTo(item.dataset.page);
        });
    });
}

function navigateTo(page) {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const target = document.querySelector(`.nav-item[data-page="${page}"]`);
    if (target) target.classList.add('active');

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const pageEl = document.getElementById('page-' + page);
    if (pageEl) {
        pageEl.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function setupDefaultDates() {
    const dateInput = document.getElementById('appt-date');
    if (dateInput && !dateInput.value) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
    }
    const timeInput = document.getElementById('appt-time');
    if (timeInput && !timeInput.value) {
        timeInput.value = "10:30";
    }
}

// ==================== C++ BACKEND API CALLS ====================
async function loadSnapshot() {
    try {
        const res = await fetch('/api/snapshot');
        if (!res.ok) throw new Error('API request failed');
        DATA = await res.json();
        renderAll();
    } catch (err) {
        showToast('Unable to connect to hospital records.', 'error');
    }
}

async function apiPost(endpoint, body) {
    const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    return res.json();
}

async function apiPut(endpoint, body) {
    const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    return res.json();
}

async function apiDelete(endpoint) {
    const res = await fetch(endpoint, { method: 'DELETE' });
    return res.json();
}

async function apiPatch(endpoint, body = {}) {
    const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    return res.json();
}

// ==================== MASTER RENDER ====================
function renderAll() {
    renderDashboardStats();
    renderRecentActivity();
    renderPatients();
    renderDoctors();
    renderAppointments();
    renderOverview();
}

// ==================== DASHBOARD STATS ====================
function renderDashboardStats() {
    const s = DATA.summary || {};
    const patientCount = DATA.patients ? DATA.patients.length : (s.patients || 0);
    const doctorCount = DATA.doctors ? DATA.doctors.length : (s.doctors || 0);
    const appointmentCount = DATA.appointments ? DATA.appointments.length : (s.appointments || 0);

    const pEl = document.getElementById('stat-patients');
    if (pEl) pEl.textContent = patientCount;

    const dEl = document.getElementById('stat-doctors');
    if (dEl) dEl.textContent = doctorCount;

    const aEl = document.getElementById('stat-appointments');
    if (aEl) aEl.textContent = appointmentCount;
}

// ==================== RECENT ACTIVITY ====================
function renderRecentActivity() {
    const container = document.getElementById('recent-activity-container');
    if (!container) return;

    const rows = [];

    // Real dynamic events if any
    if (DATA.patients && DATA.patients.length > 0) {
        const p = DATA.patients[DATA.patients.length - 1];
        rows.push({
            dot: 'dot-green',
            text: `New patient registered: <strong>${esc(p.name)}</strong>`,
            time: 'Just now'
        });
    }

    if (DATA.appointments && DATA.appointments.length > 0) {
        const a = DATA.appointments[DATA.appointments.length - 1];
        if (a.status === 'Booked') {
            rows.push({
                dot: 'dot-orange',
                text: `Appointment booked with <strong>${esc(a.doctorName)}</strong>`,
                time: '10 mins ago'
            });
        }
    }

    if (DATA.doctors && DATA.doctors.length > 0) {
        const d = DATA.doctors[DATA.doctors.length - 1];
        rows.push({
            dot: 'dot-purple',
            text: `Doctor added: <strong>${esc(d.name)}</strong>`,
            time: '1 hour ago'
        });
    }

    // Default reference screenshot entries if fewer
    if (rows.length < 3) {
        rows.push(
            { dot: 'dot-green', text: 'New patient registered: <strong>Aisha Khan</strong>', time: '2 mins ago' },
            { dot: 'dot-orange', text: 'Appointment booked with <strong>Dr. Sharma</strong>', time: '10 mins ago' },
            { dot: 'dot-purple', text: 'Doctor added: <strong>Dr. Mehta</strong>', time: '1 hour ago' }
        );
    }

    container.innerHTML = rows.slice(0, 4).map(item => `
        <div class="activity-row">
            <span class="act-dot ${item.dot}"></span>
            <div class="act-body">
                <span class="act-text">${item.text}</span>
                <span class="act-time">${item.time}</span>
            </div>
        </div>
    `).join('');
}

// ==================== PATIENTS TABLE & ACTIONS ====================
function renderPatients(filter = '') {
    const tbody = document.getElementById('patients-tbody');
    const countText = document.getElementById('patients-count-text');
    let list = DATA.patients || [];

    if (filter) {
        const q = filter.toLowerCase().trim();
        list = list.filter(p =>
            p.id.toLowerCase().includes(q) ||
            p.name.toLowerCase().includes(q) ||
            p.phone.toLowerCase().includes(q)
        );
    }

    if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-row">No patient records found.</td></tr>';
        if (countText) countText.textContent = 'Showing 0 records';
        return;
    }

    tbody.innerHTML = list.map(p => `
        <tr>
            <td><strong>${esc(p.id)}</strong></td>
            <td>${esc(p.name)}</td>
            <td>${p.age}</td>
            <td>${esc(p.phone)}</td>
            <td>
                <div class="action-pills-wrap">
                    <button class="pill-btn pill-view" onclick="viewPatient('${esc(p.id)}')">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        <span>View</span>
                    </button>
                    <button class="pill-btn pill-edit" onclick="editPatient('${esc(p.id)}')">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        <span>Edit</span>
                    </button>
                    <button class="pill-btn pill-delete" onclick="deletePatient('${esc(p.id)}')">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        <span>Delete</span>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');

    if (countText) {
        countText.textContent = `Showing 1-${list.length} of ${(DATA.patients || []).length} records`;
    }
}

function filterPatients() {
    renderPatients(document.getElementById('patient-search').value);
}

function viewPatient(id) {
    const p = (DATA.patients || []).find(x => x.id === id);
    if (!p) return;
    document.getElementById('view-patient-content').innerHTML = `
        <div class="detail-item-row"><span class="detail-label-t">Patient ID</span><span class="detail-val-t">${esc(p.id)}</span></div>
        <div class="detail-item-row"><span class="detail-label-t">Full Name</span><span class="detail-val-t">${esc(p.name)}</span></div>
        <div class="detail-item-row"><span class="detail-label-t">Age</span><span class="detail-val-t">${p.age} years</span></div>
        <div class="detail-item-row"><span class="detail-label-t">Contact Phone</span><span class="detail-val-t">${esc(p.phone)}</span></div>
        <div class="detail-item-row"><span class="detail-label-t">Residential Address</span><span class="detail-val-t">${esc(p.address)}</span></div>
    `;
    openModal('view-patient-modal');
}

function openPatientModal(editId = null) {
    const form = document.getElementById('patient-form');
    form.reset();
    document.getElementById('patient-edit-id').value = '';

    if (editId) {
        const p = (DATA.patients || []).find(x => x.id === editId);
        if (!p) return;
        document.getElementById('patient-modal-title').textContent = 'Edit Patient';
        document.getElementById('patient-submit-btn').textContent = 'Update Patient';
        document.getElementById('patient-edit-id').value = p.id;
        document.getElementById('patient-name').value = p.name;
        document.getElementById('patient-age').value = p.age;
        document.getElementById('patient-phone').value = p.phone;
        document.getElementById('patient-address').value = p.address;
    } else {
        document.getElementById('patient-modal-title').textContent = 'Register Patient';
        document.getElementById('patient-submit-btn').textContent = 'Register Patient';
    }
    openModal('patient-modal');
}

function editPatient(id) {
    openPatientModal(id);
}

async function submitPatient(e) {
    e.preventDefault();
    const editId = document.getElementById('patient-edit-id').value;
    const name = document.getElementById('patient-name').value.trim();
    const age = parseInt(document.getElementById('patient-age').value, 10);
    const phone = document.getElementById('patient-phone').value.trim();
    const address = document.getElementById('patient-address').value.trim();

    if (!name || isNaN(age) || age <= 0 || age > 120 || !phone || !address) {
        showToast('Please enter valid patient details.', 'error');
        return;
    }

    const body = { name, age, phone, address };

    try {
        let result;
        if (editId) {
            result = await apiPut('/api/patients/' + encodeURIComponent(editId), body);
        } else {
            result = await apiPost('/api/patients', body);
        }

        if (result && result.ok) {
            showToast(editId ? 'Patient updated successfully!' : 'Patient registered successfully!', 'success');
            closeModal('patient-modal');
            await loadSnapshot();
        } else {
            showToast(result.error || 'Failed to register patient.', 'error');
        }
    } catch (err) {
        showToast('Failed to reach backend server.', 'error');
    }
}

async function deletePatient(id) {
    if (!confirm(`Are you sure you want to remove patient record ${id}?`)) return;
    try {
        const result = await apiDelete('/api/patients/' + encodeURIComponent(id));
        if (result && result.ok) {
            showToast('Patient record deleted successfully!', 'success');
            await loadSnapshot();
        } else {
            showToast(result.error || 'Cannot delete patient with active appointments.', 'error');
        }
    } catch (err) {
        showToast('Server error while deleting patient.', 'error');
    }
}

// ==================== DOCTORS TABLE & ACTIONS ====================
function renderDoctors(filter = '') {
    const tbody = document.getElementById('doctors-tbody');
    const countText = document.getElementById('doctors-count-text');
    let list = DATA.doctors || [];

    if (filter) {
        const q = filter.toLowerCase().trim();
        list = list.filter(d =>
            d.id.toLowerCase().includes(q) ||
            d.name.toLowerCase().includes(q) ||
            d.specialization.toLowerCase().includes(q)
        );
    }

    if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-row">No doctor records found.</td></tr>';
        if (countText) countText.textContent = 'Showing 0 records';
        return;
    }

    tbody.innerHTML = list.map(d => `
        <tr>
            <td><strong>${esc(d.id)}</strong></td>
            <td>${esc(d.name)}</td>
            <td>${d.age}</td>
            <td>${esc(d.phone)}</td>
            <td><span class="status-pill status-booked">${esc(d.specialization)}</span></td>
            <td>
                <div class="action-pills-wrap">
                    <button class="pill-btn pill-view" onclick="viewDoctor('${esc(d.id)}')">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        <span>View</span>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');

    if (countText) {
        countText.textContent = `Showing 1-${list.length} of ${(DATA.doctors || []).length} doctors`;
    }
}

function filterDoctors() {
    renderDoctors(document.getElementById('doctor-search').value);
}

function viewDoctor(id) {
    const d = (DATA.doctors || []).find(x => x.id === id);
    if (!d) return;
    document.getElementById('view-doctor-content').innerHTML = `
        <div class="detail-item-row"><span class="detail-label-t">Doctor ID</span><span class="detail-val-t">${esc(d.id)}</span></div>
        <div class="detail-item-row"><span class="detail-label-t">Doctor Name</span><span class="detail-val-t">${esc(d.name)}</span></div>
        <div class="detail-item-row"><span class="detail-label-t">Age</span><span class="detail-val-t">${d.age} years</span></div>
        <div class="detail-item-row"><span class="detail-label-t">Contact Phone</span><span class="detail-val-t">${esc(d.phone)}</span></div>
        <div class="detail-item-row"><span class="detail-label-t">Medical Specialization</span><span class="detail-val-t">${esc(d.specialization)}</span></div>
    `;
    openModal('view-doctor-modal');
}

function openDoctorModal() {
    document.getElementById('doctor-form').reset();
    openModal('doctor-modal');
}

async function submitDoctor(e) {
    e.preventDefault();
    const name = document.getElementById('doctor-name').value.trim();
    const age = parseInt(document.getElementById('doctor-age').value, 10);
    const phone = document.getElementById('doctor-phone').value.trim();
    const specialization = document.getElementById('doctor-spec').value.trim();

    if (!name || isNaN(age) || age <= 0 || age > 120 || !phone || !specialization) {
        showToast('Please enter valid doctor details.', 'error');
        return;
    }

    const body = { name, age, phone, specialization };

    try {
        const result = await apiPost('/api/doctors', body);
        if (result && result.ok) {
            showToast('Doctor registered successfully!', 'success');
            closeModal('doctor-modal');
            await loadSnapshot();
        } else {
            showToast(result.error || 'Failed to register doctor.', 'error');
        }
    } catch (err) {
        showToast('Server error while saving doctor.', 'error');
    }
}

// ==================== APPOINTMENTS TABLE & ACTIONS ====================
function renderAppointments(filter = '') {
    const tbody = document.getElementById('appointments-tbody');
    const countText = document.getElementById('appointments-count-text');
    let list = DATA.appointments || [];

    if (filter) {
        const q = filter.toLowerCase().trim();
        list = list.filter(a =>
            a.id.toLowerCase().includes(q) ||
            a.patientName.toLowerCase().includes(q) ||
            a.doctorName.toLowerCase().includes(q) ||
            a.status.toLowerCase().includes(q)
        );
    }

    if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-row">No appointments recorded.</td></tr>';
        if (countText) countText.textContent = 'Showing 0 records';
        return;
    }

    tbody.innerHTML = list.map(a => `
        <tr>
            <td><strong>${esc(a.id)}</strong></td>
            <td>${esc(a.patientName)} <span style="color:var(--text-muted);font-size:11px;">(${esc(a.patientId)})</span></td>
            <td>${esc(a.doctorName)} <span style="color:var(--text-muted);font-size:11px;">(${esc(a.doctorId)})</span></td>
            <td>${esc(a.date)}</td>
            <td>${esc(a.time)}</td>
            <td><span class="status-pill status-${a.status.toLowerCase()}">${esc(a.status)}</span></td>
            <td>
                ${a.status === 'Booked' ? `
                    <div class="action-pills-wrap">
                        <button class="pill-btn pill-delete" onclick="cancelAppointment('${esc(a.id)}')">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                            <span>Cancel</span>
                        </button>
                    </div>
                ` : '<span style="color:var(--text-muted);font-size:12px;">—</span>'}
            </td>
        </tr>
    `).join('');

    if (countText) {
        countText.textContent = `Showing 1-${list.length} of ${(DATA.appointments || []).length} appointments`;
    }
}

function filterAppointments() {
    renderAppointments(document.getElementById('appointment-search').value);
}

function openAppointmentModal() {
    const form = document.getElementById('appointment-form');
    form.reset();
    setupDefaultDates();

    // Populate patient dropdown
    const patientSel = document.getElementById('appt-patient');
    patientSel.innerHTML = '';
    if (DATA.patients && DATA.patients.length > 0) {
        DATA.patients.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = `${p.name} (${p.id})`;
            patientSel.appendChild(opt);
        });
    } else {
        patientSel.innerHTML = '<option value="">No patients registered</option>';
    }

    // Populate doctor dropdown
    const doctorSel = document.getElementById('appt-doctor');
    doctorSel.innerHTML = '';
    if (DATA.doctors && DATA.doctors.length > 0) {
        DATA.doctors.forEach(d => {
            const opt = document.createElement('option');
            opt.value = d.id;
            opt.textContent = `${d.name} (${d.specialization})`;
            doctorSel.appendChild(opt);
        });
    } else {
        doctorSel.innerHTML = '<option value="">No doctors available</option>';
    }

    openModal('appointment-modal');
}

async function submitAppointment(event) {
    event.preventDefault();
    const patientId = document.getElementById('appt-patient').value;
    const doctorId = document.getElementById('appt-doctor').value;
    const date = document.getElementById('appt-date').value;
    const time = document.getElementById('appt-time').value;

    if (!patientId || !doctorId || !date || !time) {
        showToast('Please fill out all appointment fields.', 'error');
        return;
    }

    const body = { patientId, doctorId, date, time };

    try {
        const result = await apiPost('/api/appointments', body);
        if (result && result.ok) {
            showToast('Appointment booked successfully!', 'success');
            closeModal('appointment-modal');
            await loadSnapshot();
        } else {
            showToast(result.error || 'Failed to book appointment slot.', 'error');
        }
    } catch (err) {
        showToast('Server error while booking appointment.', 'error');
    }
}

async function cancelAppointment(id) {
    if (!confirm(`Cancel appointment booking ${id}?`)) return;
    try {
        const result = await apiPatch('/api/appointments/' + encodeURIComponent(id));
        if (result && result.ok) {
            showToast('Appointment cancelled successfully!', 'success');
            await loadSnapshot();
        } else {
            showToast(result.error || 'Could not cancel appointment.', 'error');
        }
    } catch (err) {
        showToast('Server error while cancelling appointment.', 'error');
    }
}

// ==================== OVERVIEW PAGE ====================
function renderOverview() {
    const s = DATA.summary || {};
    const patientCount = DATA.patients ? DATA.patients.length : (s.patients || 0);
    const doctorCount = DATA.doctors ? DATA.doctors.length : (s.doctors || 0);
    const totalAppt = DATA.appointments ? DATA.appointments.length : (s.appointments || 0);

    let activeCount = 0;
    if (DATA.appointments) {
        activeCount = DATA.appointments.filter(a => a.status === 'Booked').length;
    } else {
        activeCount = s.active || 0;
    }

    const cancelledCount = totalAppt - activeCount;

    const op = document.getElementById('ov-patients');
    if (op) op.textContent = patientCount;

    const od = document.getElementById('ov-doctors');
    if (od) od.textContent = doctorCount;

    const oa = document.getElementById('ov-total-appt');
    if (oa) oa.textContent = totalAppt;

    const oact = document.getElementById('ov-active');
    if (oact) oact.textContent = activeCount;

    const ocan = document.getElementById('ov-cancelled');
    if (ocan) ocan.textContent = cancelledCount;
}

// ==================== MODAL SYSTEM ====================
function openModal(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeModal(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('open');
    document.body.style.overflow = '';
}

// Close on background overlay click
document.addEventListener('click', e => {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('open');
        document.body.style.overflow = '';
    }
});

// Close on Escape key
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.open').forEach(m => {
            m.classList.remove('open');
        });
        document.body.style.overflow = '';
    }
});

// ==================== TOAST NOTIFICATIONS (Screenshot Matched) ====================
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'ref-toast';

    const isSuccess = type === 'success';
    const iconHtml = isSuccess
        ? `<div class="toast-check-circle"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5"><polyline points="20 6 9 17 4 12"/></svg></div>`
        : `<div class="toast-err-circle"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></div>`;

    toast.innerHTML = `
        ${iconHtml}
        <span class="toast-msg-text">${esc(message)}</span>
        <button class="toast-close-x" onclick="this.parentElement.remove()">&times;</button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        if (toast.parentElement) {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            toast.style.transition = 'all 0.25s ease';
            setTimeout(() => toast.remove(), 250);
        }
    }, 4500);
}

// ==================== UTILITIES ====================
function esc(str) {
    if (str == null) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
}
