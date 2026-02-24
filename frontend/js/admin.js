const API = "http://127.0.0.1:8000";
//const API = 'http://192.168.1.81:8000';

// ─── TOAST ───
function showToast(msg, type = "") {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = `toast ${type} show`;
  setTimeout(() => t.classList.remove("show"), 3000);
}

// ─── LOGIN ───
async function login() {
  const username = document.getElementById("loginUsername").value.trim();
  const password = document.getElementById("loginPassword").value;
  const errorEl = document.getElementById("loginError");

  if (!username || !password) {
    errorEl.textContent = "Please enter username and password.";
    errorEl.classList.add("show");
    return;
  }

  const formData = new FormData();
  formData.append("username", username);
  formData.append("password", password);

  try {
    const res = await fetch(`${API}/admin/login`, {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    if (res.ok) {
      document.getElementById("loginPage").style.display = "none";
      document.getElementById("adminLayout").classList.add("show");
      loadMaterials();
      loadRequests();
      loadAnnouncement();
    } else {
      errorEl.textContent = "Invalid username or password.";
      errorEl.classList.add("show");
    }
  } catch {
    errorEl.textContent = "Could not connect to server.";
    errorEl.classList.add("show");
  }
}

// Allow Enter key on login
document.getElementById("loginPassword").addEventListener("keydown", (e) => {
  if (e.key === "Enter") login();
});

// ─── LOGOUT ───
async function logout() {
  await fetch(`${API}/admin/logout`, {
    method: "POST",
    credentials: "include",
  });
  document.getElementById("adminLayout").classList.remove("show");
  document.getElementById("loginPage").style.display = "flex";
  document.getElementById("loginUsername").value = "";
  document.getElementById("loginPassword").value = "";
}

// ─── NAVIGATION ───
function showPanel(panelId) {
  document
    .querySelectorAll(".panel")
    .forEach((p) => p.classList.remove("active"));
  document
    .querySelectorAll(".nav-item")
    .forEach((n) => n.classList.remove("active"));
  document.getElementById(panelId).classList.add("active");
  document.querySelector(`[data-panel="${panelId}"]`).classList.add("active");
}

document.querySelectorAll(".nav-item").forEach((item) => {
  item.addEventListener("click", () => showPanel(item.dataset.panel));
});

// ─── FILE DROP ZONE ───
const fileInput = document.getElementById("fileInput");
const fileDrop = document.getElementById("fileDrop");
const fileNameEl = document.getElementById("fileName");

fileDrop.addEventListener("click", () => fileInput.click());

fileDrop.addEventListener("dragover", (e) => {
  e.preventDefault();
  fileDrop.classList.add("dragover");
});

fileDrop.addEventListener("dragleave", () =>
  fileDrop.classList.remove("dragover"),
);

fileDrop.addEventListener("drop", (e) => {
  e.preventDefault();
  fileDrop.classList.remove("dragover");
  const file = e.dataTransfer.files[0];
  if (file) {
    fileInput.files = e.dataTransfer.files;
    fileNameEl.textContent = file.name;
  }
});

fileInput.addEventListener("change", () => {
  if (fileInput.files[0]) {
    fileNameEl.textContent = fileInput.files[0].name;
  }
});

// ─── CHAR COUNTER ───
const descInput = document.getElementById("matDescription");
const charCount = document.getElementById("charCount");

descInput.addEventListener("input", () => {
  const len = descInput.value.length;
  charCount.textContent = `${len}/100`;
  charCount.classList.toggle("warn", len >= 90);
});

// ─── UPLOAD MATERIAL ───
async function uploadMaterial() {
  const title = document.getElementById("matTitle").value.trim();
  const dept = document.getElementById("matDept").value;
  const sem = document.getElementById("matSem").value;
  const subject = document.getElementById("matSubject").value.trim();
  const description = document.getElementById("matDescription").value.trim();
  const date = document.getElementById("matDate").value;
  const file = fileInput.files[0];

  // 1. Basic field validation
  if (!title || !dept || !sem || !subject || !date || !file) {
    showToast("Please fill in all required fields.", "error");
    return;
  }

  // 2. File Type Validation (Added PPT, DOC, etc.)
  const allowedExtensions = /(\.pdf|\.docx|\.doc|\.ppt|\.pptx|\.zip)$/i;
  if (!allowedExtensions.exec(file.name)) {
    showToast("Invalid file type. Only PDF, DOCX, PPT, and ZIP are allowed.", "error");
    return;
  }

  // 3. File Size Validation (Preventing huge uploads that hit Supabase limits)
  const maxSize = 50 * 1024 * 1024; // 50MB limit for safety
  if (file.size > maxSize) {
    showToast("File is too large. Max limit is 50MB.", "error");
    return;
  }

  const formData = new FormData();
  formData.append("title", title);
  formData.append("dept", dept);
  formData.append("sem", sem);
  formData.append("subject", subject);
  formData.append("description", description);
  formData.append("date", date);
  formData.append("file", file);

  const btn = document.getElementById("uploadBtn");
  btn.disabled = true;
  btn.textContent = "Uploading...";

  try {
    const res = await fetch(`${API}/admin/materials/upload`, {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    if (res.ok) {
      showToast("Material uploaded successfully!", "success");
      resetUploadForm();
      loadMaterials();
      showPanel("panelMaterials");
    } else {
      const err = await res.json();
      showToast(err.detail || "Upload failed.", "error");
    }
  } catch {
    showToast("Could not connect to server.", "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Upload Material";
  }
}

// ─── LOAD MATERIALS ───
async function loadMaterials() {
  try {
    const res = await fetch(`${API}/materials/`);
    const data = await res.json();
    renderMaterialsTable(data);
  } catch {
    document.getElementById("materialsTableBody").innerHTML =
      '<tr class="empty-row"><td colspan="6">Could not load materials.</td></tr>';
  }
}

function renderMaterialsTable(materials) {
  const tbody = document.getElementById("materialsTableBody");
  if (!materials.length) {
    tbody.innerHTML =
      '<tr class="empty-row"><td colspan="6">No materials uploaded yet.</td></tr>';
    return;
  }
  tbody.innerHTML = materials
    .map(
      (m) => `
    <tr>
      <td><strong>${m.title}</strong></td>
      <td>${m.dept}</td>
      <td>${m.sem}</td>
      <td>${m.subject}</td>
      <td>${m.date}</td>
      <td>
        <button class="btn-delete" onclick="deleteMaterial('${m.id}')">Delete</button>
      </td>
    </tr>
  `,
    )
    .join("");
}

async function deleteMaterial(id) {
  if (!confirm("Are you sure you want to delete this material?")) return;
  try {
    await fetch(`${API}/admin/materials/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    showToast("Material deleted.", "success");
    loadMaterials();
  } catch {
    showToast("Failed to delete.", "error");
  }
}

// ─── LOAD REQUESTS ───
async function loadRequests() {
  try {
    const res = await fetch(`${API}/requests/`);
    const data = await res.json();
    renderRequestsTable(data);
  } catch {
    document.getElementById("requestsTableBody").innerHTML =
      '<tr class="empty-row"><td colspan="3">Could not load requests.</td></tr>';
  }
}

function renderRequestsTable(requests) {
  const tbody = document.getElementById("requestsTableBody");
  if (!requests.length) {
    tbody.innerHTML =
      '<tr class="empty-row"><td colspan="3">No requests yet.</td></tr>';
    return;
  }
  tbody.innerHTML = requests
    .map(
      (r) => `
    <tr>
      <td>${r.content}</td>
      <td><span class="upvote-badge">▲ ${r.upvotes}</span></td>
      <td>
        <button class="btn-delete" onclick="deleteRequest('${r.id}')">Delete</button>
      </td>
    </tr>
  `,
    )
    .join("");
}

async function deleteRequest(id) {
  if (!confirm("Delete this request?")) return;
  try {
    await fetch(`${API}/admin/requests/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    showToast("Request deleted.", "success");
    loadRequests();
  } catch {
    showToast("Failed to delete.", "error");
  }
}

// ─── ANNOUNCEMENTS ───
async function loadAnnouncement() {
  try {
    const res = await fetch(`${API}/announcements/`);
    const data = await res.json();
    const el = document.getElementById("currentAnnouncement");
    if (data.length > 0) {
      el.textContent = data[0].message;
    } else {
      el.textContent = "No active announcement.";
    }
  } catch {}
}

async function updateAnnouncement() {
  const message = document.getElementById("announcementInput").value.trim();
  if (!message) {
    showToast("Please enter a message.", "error");
    return;
  }

  const formData = new FormData();
  formData.append("message", message);

  try {
    const res = await fetch(`${API}/admin/announcements`, {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    if (res.ok) {
      showToast("Announcement updated!", "success");
      document.getElementById("announcementInput").value = "";
      loadAnnouncement();
    } else {
      showToast("Failed to update announcement.", "error");
    }
  } catch {
    showToast("Could not connect to server.", "error");
  }
}
