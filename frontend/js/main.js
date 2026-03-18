const API = 'https://utharam.onrender.com';
let allMaterials = [];
let votedRequests = JSON.parse(localStorage.getItem("votedRequests") || "[]");
let unlockedMaterials = JSON.parse(localStorage.getItem("unlockedMaterials") || "[]");

// TOAST
function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2500);
}

// MARQUEE
async function loadMarquee() {
  try {
    const res = await fetch(`${API}/announcements/`);
    const data = await res.json();
    if (data.length > 0) {
      const message = data[0].message;
      const separator = "&nbsp;&nbsp;&nbsp;&nbsp; • &nbsp;&nbsp;&nbsp;&nbsp;";
      const repeatedContent = (message + separator).repeat(10);
      const marqueeEl = document.getElementById("marqueeText");
      marqueeEl.innerHTML = repeatedContent;
      if (window.lucide) lucide.createIcons();
    }
  } catch (err) {
    console.error("Marquee load failed", err);
  }
}

// MATERIALS
async function loadMaterials() {
  try {
    const res = await fetch(`${API}/materials/`);
    allMaterials = await res.json();
    renderMaterials(allMaterials);
  } catch {
    document.getElementById("materialsContainer").innerHTML = `
      <div class="empty-state"><p>Could not load materials. Make sure the server is running.</p></div>`;
  }
}

function escapeAttr(str) {
  return String(str).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function renderMaterials(materials) {
  const container = document.getElementById("materialsContainer");
  if (!materials.length) {
    container.innerHTML = `
      <div class="empty-state">
        <svg width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
          <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
        <p>No materials found.</p>
      </div>`;
    return;
  }

  container.innerHTML = materials.map((m) => {
    const isPremium = m.is_premium;
    const isUnlocked = unlockedMaterials.includes(m.id);
    const premiumBadge = isPremium ? `<span class="tag premium-tag">⭐ Premium</span>` : "";

    const actions = isPremium && !isUnlocked
      ? `<button class="btn-buy" onclick="openPaymentModal('${m.id}', '${escapeAttr(m.title)}', ${m.price}, '${escapeAttr(m.file_url)}')">
          🔒 Buy &amp; Download — ₹${m.price}
        </button>`
      : `<a class="btn-preview" href="${m.file_url}" target="_blank">
          <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          Preview
        </a>
        <a class="btn-download" href="${m.file_url}" download>
          <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
          </svg>
          Download
        </a>`;

    return `
    <div class="material-card ${isPremium ? 'premium-card' : ''}">
      <div class="card-tags">
        <span class="tag">${m.dept}</span>
        <span class="tag sem">${m.sem}</span>
        <span class="tag subject">${m.subject}</span>
        ${premiumBadge}
      </div>
      <div class="card-title">${m.title}</div>
      ${m.description ? `<div class="card-desc">${m.description}</div>` : ""}
      <div class="card-date">
        <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <path d="M16 2v4M8 2v4M3 10h18"/>
        </svg>
        ${m.date}
      </div>
      <div class="card-actions">${actions}</div>
    </div>`;
  }).join("");
}

// FILTERS
function applyFilters() {
  const dept = document.getElementById("deptFilter").value;
  const sem = document.getElementById("semFilter").value;
  const q = document.getElementById("searchInput").value.toLowerCase();
  const filtered = allMaterials.filter(
    (m) => (!dept || m.dept === dept) && (!sem || m.sem === sem) &&
      (!q || m.title.toLowerCase().includes(q) || m.subject.toLowerCase().includes(q))
  );
  renderMaterials(filtered);
}

function clearFilters() {
  document.getElementById("deptFilter").value = "";
  document.getElementById("semFilter").value = "";
  document.getElementById("searchInput").value = "";
  renderMaterials(allMaterials);
}

document.getElementById("deptFilter").addEventListener("change", applyFilters);
document.getElementById("semFilter").addEventListener("change", applyFilters);
document.getElementById("searchInput").addEventListener("input", applyFilters);

// ─── PAYMENT MODAL ───────────────────────────────────────────────────────────
let currentPayment = null;

function openPaymentModal(id, title, price, fileUrl) {
  currentPayment = { id, title, price, fileUrl };
  document.getElementById("payModalTitle").textContent = title;
  document.getElementById("payModalPrice").textContent = `₹${price}`;
  document.getElementById("payCardNumber").value = "";
  document.getElementById("payExpiry").value = "";
  document.getElementById("payCvv").value = "";
  document.getElementById("payName").value = "";
  document.getElementById("payError").textContent = "";
  const btn = document.getElementById("payBtn");
  btn.disabled = false;
  btn.textContent = "Pay & Download";
  btn.style.background = "";
  document.getElementById("paymentModal").classList.add("open");
}

function closePaymentModal() {
  document.getElementById("paymentModal").classList.remove("open");
  currentPayment = null;
}

document.getElementById("paymentModal").addEventListener("click", function (e) {
  if (e.target === this) closePaymentModal();
});

document.getElementById("payCardNumber").addEventListener("input", function () {
  let v = this.value.replace(/\D/g, "").slice(0, 16);
  this.value = v.replace(/(.{4})/g, "$1 ").trim();
});

document.getElementById("payExpiry").addEventListener("input", function () {
  let v = this.value.replace(/\D/g, "").slice(0, 4);
  if (v.length >= 2) v = v.slice(0, 2) + "/" + v.slice(2);
  this.value = v;
});

document.getElementById("payCvv").addEventListener("input", function () {
  this.value = this.value.replace(/\D/g, "").slice(0, 3);
});

async function processPayment() {
  const cardNumber = document.getElementById("payCardNumber").value.replace(/\s/g, "");
  const expiry = document.getElementById("payExpiry").value;
  const cvv = document.getElementById("payCvv").value;
  const name = document.getElementById("payName").value.trim();
  const errorEl = document.getElementById("payError");
  const btn = document.getElementById("payBtn");

  if (!name) { errorEl.textContent = "Please enter cardholder name."; return; }
  if (cardNumber.length !== 16) { errorEl.textContent = "Enter a valid 16-digit card number."; return; }
  if (!/^\d{2}\/\d{2}$/.test(expiry)) { errorEl.textContent = "Enter expiry as MM/YY."; return; }
  if (cvv.length !== 3) { errorEl.textContent = "Enter a valid 3-digit CVV."; return; }

  errorEl.textContent = "";
  btn.disabled = true;
  btn.textContent = "Processing...";

  await new Promise(resolve => setTimeout(resolve, 2000));

  unlockedMaterials.push(currentPayment.id);
  localStorage.setItem("unlockedMaterials", JSON.stringify(unlockedMaterials));

  btn.textContent = "✓ Payment Successful!";
  btn.style.background = "#16a34a";

  await new Promise(resolve => setTimeout(resolve, 800));

  const a = document.createElement("a");
  a.href = currentPayment.fileUrl;
  a.download = "";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  showToast("Payment successful! Downloading...");
  closePaymentModal();
  renderMaterials(allMaterials);
}

// REQUESTS
async function loadRequests() {
  try {
    const res = await fetch(`${API}/requests/`);
    const data = await res.json();
    renderRequests(data);
  } catch {
    document.getElementById("requestList").innerHTML =
      '<p style="color:var(--muted);font-size:0.85rem">Could not load requests.</p>';
  }
}

function renderRequests(requests) {
  const container = document.getElementById("requestList");
  if (!requests.length) {
    container.innerHTML = '<p style="color:var(--muted);font-size:0.85rem;text-align:center;padding:1rem">No requests yet. Be the first!</p>';
    return;
  }
  container.innerHTML = requests.map((r) => `
    <div class="request-item">
      <div class="request-content">${r.content}</div>
      <button class="upvote-btn ${votedRequests.includes(r.id) ? "voted" : ""}" onclick="upvote('${r.id}', this)">
        <span class="upvote-arrow">▲</span>
        <span>${r.upvotes}</span>
      </button>
    </div>`).join("");
}

async function submitRequest() {
  const input = document.getElementById("requestInput");
  const content = input.value.trim();
  if (!content) return;
  try {
    await fetch(`${API}/requests/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    input.value = "";
    showToast("Request submitted!");
    loadRequests();
  } catch {
    showToast("Failed to submit request.");
  }
}

async function upvote(id, btn) {
  if (votedRequests.includes(id)) { showToast("You already upvoted this!"); return; }
  try {
    await fetch(`${API}/requests/${id}/upvote`, { method: "PATCH" });
    votedRequests.push(id);
    localStorage.setItem("votedRequests", JSON.stringify(votedRequests));
    btn.classList.add("voted");
    const countEl = btn.querySelector("span:last-child");
    countEl.textContent = parseInt(countEl.textContent) + 1;
  } catch {
    showToast("Failed to upvote.");
  }
}

// INIT
loadMarquee();
loadMaterials();
loadRequests();
setInterval(loadMarquee, 60000);
