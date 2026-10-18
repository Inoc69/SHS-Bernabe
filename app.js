// Global State Storage
let currentPhotoBase64 = '';
let currentFormData = {};

// Auto Calculate Current Academic School Year (e.g. 2026 -> 2026–2027)
function getAutoSchoolYear() {
  const currentYear = new Date().getFullYear();
  return `${currentYear}–${currentYear + 1}`;
}

// Initialize Page Elements
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('schoolYearDisplay').textContent = getAutoSchoolYear();
});

// Navigation: Go to Homepage
function goToHome() {
  document.getElementById('homePageView').classList.remove('hidden');
  document.getElementById('userPortalView').classList.add('hidden');
  document.getElementById('adminPortalView').classList.add('hidden');
  document.getElementById('adminBtnText').textContent = "Admin Portal";
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Navigation: Start Enrollment from Home
function startEnrollment() {
  document.getElementById('homePageView').classList.add('hidden');
  document.getElementById('userPortalView').classList.remove('hidden');
  goToStep(1);
}

// Photo FileReader Conversion & Preview
function previewPhoto(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (file.size > 2 * 1024 * 1024) {
    alert("File size exceeds 2MB limit. Please choose a smaller image.");
    event.target.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    currentPhotoBase64 = e.target.result;
    document.getElementById('photoPreview').src = currentPhotoBase64;
    document.getElementById('photoPreviewContainer').classList.remove('hidden');
  };
  reader.readAsDataURL(file);
}

// Stepper Step Navigation
function goToStep(stepNumber) {
  document.getElementById('stepForm').classList.toggle('hidden', stepNumber !== 1);
  document.getElementById('stepReview').classList.toggle('hidden', stepNumber !== 2);
  document.getElementById('stepConfirmation').classList.toggle('hidden', stepNumber !== 3);

  const steps = [1, 2, 3];
  steps.forEach(s => {
    const tab = document.getElementById(`step${s}-tab`);
    tab.className = "stepper-item";
    if (s === stepNumber) {
      tab.classList.add("active");
    } else if (s < stepNumber) {
      tab.classList.add("completed");
    }
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Step 1 Form Handler -> Step 2
function handleFormReview(event) {
  event.preventDefault();

  if (!currentPhotoBase64) {
    alert("Please attach a student photo before proceeding.");
    return;
  }

  currentFormData = {
    fullName: document.getElementById('fullName').value.trim(),
    dob: document.getElementById('dob').value,
    lrn: document.getElementById('lrn').value.trim(),
    address: document.getElementById('address').value.trim(),
    guardianName: document.getElementById('guardianName').value.trim(),
    guardianContact: document.getElementById('guardianContact').value.trim(),
    preferredTrack: document.getElementById('preferredTrack').value,
    schoolYear: getAutoSchoolYear(),
    photo: currentPhotoBase64
  };

  document.getElementById('revSchoolYear').textContent = currentFormData.schoolYear;
  document.getElementById('revFullName').textContent = currentFormData.fullName;
  document.getElementById('revLrn').textContent = currentFormData.lrn;
  document.getElementById('revDob').textContent = currentFormData.dob;
  document.getElementById('revAddress').textContent = currentFormData.address;
  document.getElementById('revGuardianName').textContent = currentFormData.guardianName;
  document.getElementById('revGuardianContact').textContent = currentFormData.guardianContact;
  document.getElementById('revTrack').textContent = currentFormData.preferredTrack;
  document.getElementById('revPhoto').src = currentFormData.photo;

  goToStep(2);
}

// Reference Generator: ENROLLMENT RECORD-YYYY-XXXX
function generateReferenceNumber() {
  const year = new Date().getFullYear();
  let records = JSON.parse(localStorage.getItem('ecbnhs_enrollments') || '[]');
  
  const yearRecords = records.filter(r => r.referenceNumber.startsWith(`ENROLLMENT RECORD-${year}`));
  const seq = (yearRecords.length + 1).toString().padStart(4, '0');
  
  return `ENROLLMENT RECORD-${year}-${seq}`;
}

// Step 2 Submission -> Step 3
function submitEnrollment() {
  const refNum = generateReferenceNumber();
  const newRecord = {
    ...currentFormData,
    referenceNumber: refNum,
    dateSubmitted: new Date().toLocaleString()
  };

  let records = JSON.parse(localStorage.getItem('ecbnhs_enrollments') || '[]');
  records.push(newRecord);
  localStorage.setItem('ecbnhs_enrollments', JSON.stringify(records));

  document.getElementById('confRefNum').textContent = newRecord.referenceNumber;
  document.getElementById('confName').textContent = newRecord.fullName;
  document.getElementById('confSY').textContent = newRecord.schoolYear;
  document.getElementById('confTrack').textContent = newRecord.preferredTrack;

  goToStep(3);
}

// Reset Form & Return Home
function resetPortal() {
  document.getElementById('enrollmentForm').reset();
  currentPhotoBase64 = '';
  document.getElementById('photoPreviewContainer').classList.add('hidden');
  goToHome();
}

// Admin View Toggle
function toggleAdminView() {
  const homeView = document.getElementById('homePageView');
  const userView = document.getElementById('userPortalView');
  const adminView = document.getElementById('adminPortalView');
  const btnText = document.getElementById('adminBtnText');

  if (adminView.classList.contains('hidden')) {
    homeView.classList.add('hidden');
    userView.classList.add('hidden');
    adminView.classList.remove('hidden');
    btnText.textContent = "Exit Admin View";
    renderAdminTable();
  } else {
    adminView.classList.add('hidden');
    goToHome();
  }
}

// Render Admin Dashboard Table & Analytics
function renderAdminTable() {
  const tbody = document.getElementById('adminTableBody');
  const search = document.getElementById('adminSearch').value.toLowerCase();
  let records = JSON.parse(localStorage.getItem('ecbnhs_enrollments') || '[]');

  document.getElementById('statTotal').textContent = records.length;
  document.getElementById('statAcademic').textContent = records.filter(r => r.preferredTrack === 'Academic Track').length;
  document.getElementById('statTechPro').textContent = records.filter(r => r.preferredTrack === 'TechPro Track').length;

  const filtered = records.filter(r => 
    r.fullName.toLowerCase().includes(search) || 
    r.lrn.includes(search) || 
    r.referenceNumber.toLowerCase().includes(search)
  );

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-slate-400">No enrollment applications found.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map((r, i) => `
    <tr class="hover:bg-slate-50/80 transition">
      <td class="p-3 font-semibold text-blue-900">${r.referenceNumber}</td>
      <td class="p-3 font-medium text-slate-800">${r.fullName}</td>
      <td class="p-3 text-slate-600">${r.lrn}</td>
      <td class="p-3">
        <span class="px-2 py-1 text-xs font-semibold rounded-full ${r.preferredTrack === 'Academic Track' ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'}">
          ${r.preferredTrack}
        </span>
      </td>
      <td class="p-3 text-slate-600">${r.schoolYear}</td>
      <td class="p-3 text-xs text-slate-400">${r.dateSubmitted}</td>
      <td class="p-3 text-center">
        <button onclick="viewRecordDetails(${i})" class="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-md border border-blue-200 transition text-xs">
          View
        </button>
      </td>
    </tr>
  `).join('');
}

// Modal View Details
function viewRecordDetails(index) {
  let records = JSON.parse(localStorage.getItem('ecbnhs_enrollments') || '[]');
  const r = records[index];
  if (!r) return;

  const modalContent = document.getElementById('modalContent');
  modalContent.innerHTML = `
    <div class="flex justify-center mb-2">
      <img src="${r.photo}" alt="Student Photo" class="w-28 h-28 object-cover rounded-xl border-2 border-slate-200 shadow-sm">
    </div>
    <div class="grid grid-cols-2 gap-3 text-slate-700 bg-slate-50 p-4 rounded-lg border border-slate-200/80">
      <div><span class="review-label">Reference ID:</span> <strong>${r.referenceNumber}</strong></div>
      <div><span class="review-label">School Year:</span> <strong>${r.schoolYear}</strong></div>
      <div><span class="review-label">Full Name:</span> <strong>${r.fullName}</strong></div>
      <div><span class="review-label">LRN:</span> <strong>${r.lrn}</strong></div>
      <div><span class="review-label">Date of Birth:</span> <strong>${r.dob}</strong></div>
      <div><span class="review-label">Track:</span> <strong>${r.preferredTrack}</strong></div>
      <div class="col-span-2"><span class="review-label">Address:</span> <strong>${r.address}</strong></div>
      <div><span class="review-label">Guardian Name:</span> <strong>${r.guardianName}</strong></div>
      <div><span class="review-label">Guardian Contact:</span> <strong>${r.guardianContact}</strong></div>
    </div>
  `;

  document.getElementById('recordModal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('recordModal').classList.add('hidden');
}

// Seed Demo Data for Usability Evaluators
function seedSampleData() {
  const year = new Date().getFullYear();
  const samples = [
    {
      referenceNumber: `ENROLLMENT RECORD-${year}-0001`,
      fullName: 'Maria Santos',
      dob: '2008-05-14',
      lrn: '123456789012',
      address: 'Poblacion, Cordova, Cebu',
      guardianName: 'Ana Santos',
      guardianContact: '09171234567',
      preferredTrack: 'Academic Track',
      schoolYear: `${year}–${year + 1}`,
      photo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100%" height="100%" fill="%232563eb"/><text x="50%" y="55%" fill="white" font-size="28" font-family="sans-serif" text-anchor="middle">MS</text></svg>',
      dateSubmitted: new Date().toLocaleString()
    },
    {
      referenceNumber: `ENROLLMENT RECORD-${year}-0002`,
      fullName: 'John Mark Reyes',
      dob: '2007-11-20',
      lrn: '987654321098',
      address: 'Alegria, Cordova, Cebu',
      guardianName: 'Roberto Reyes',
      guardianContact: '09189876543',
      preferredTrack: 'TechPro Track',
      schoolYear: `${year}–${year + 1}`,
      photo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100%" height="100%" fill="%23059669"/><text x="50%" y="55%" fill="white" font-size="28" font-family="sans-serif" text-anchor="middle">JR</text></svg>',
      dateSubmitted: new Date().toLocaleString()
    }
  ];

  localStorage.setItem('ecbnhs_enrollments', JSON.stringify(samples));
  renderAdminTable();
}

function clearAllData() {
  if (confirm('Clear all stored test evaluation records?')) {
    localStorage.removeItem('ecbnhs_enrollments');
    renderAdminTable();
  }
}