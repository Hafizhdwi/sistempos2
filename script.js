let products = JSON.parse(localStorage.getItem("myProducts")) || [];
let cart = [];
let currentFilter = "Semua";
let currentEditId = null;
let currentEditCat = "Makanan";
let selectedMethod = "CASH";

const save = () => localStorage.setItem("myProducts", JSON.stringify(products));

// Fungsi Render Produk
function renderProducts() {
  const searchTerm = document.getElementById("search").value.toLowerCase();
  const grid = document.getElementById("product-grid");
  let filtered = products.filter(
    (p) =>
      (currentFilter === "Semua" || p.category === currentFilter) &&
      p.name.toLowerCase().includes(searchTerm),
  );

  grid.innerHTML = filtered
    .map(
      (p) => `
        <div class="product-card" onclick="addToCart(${p.id})">
            <div class="product-actions">
                <button class="action-btn edit-btn" onclick="editProduct(${p.id}, event)">✏️</button>
                <button class="action-btn delete-btn" onclick="deleteProduct(${p.id}, event)">🗑️</button>
            </div>
            <span class="category-pill badge-${p.category.toLowerCase()}">${p.category}</span>
            <h3 style="margin:5px 0; font-weight:700; font-size:1rem;">${p.name}</h3>
            <p style="font-weight:800; color:var(--primary); font-size:1.1rem; margin-top:5px;">Rp ${p.price.toLocaleString()}</p>
        </div>
    `,
    )
    .join("");
}

// Fungsi Sort A-Z
function sortAZ() {
  products.sort((a, b) => a.name.localeCompare(b.name));
  renderProducts();
  showToast("🔤 Urutan A sampai Z");
}

// Fungsi Cetak PDF
function generateReceipt() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "mm", format: [80, 150] }); // Format Thermal

  doc.setFontSize(14);
  doc.text("SMART POS PRO", 40, 15, { align: "center" });
  doc.setFontSize(8);
  doc.text("Bukti Pembayaran Digital", 40, 20, { align: "center" });
  doc.text("------------------------------------------", 40, 25, {
    align: "center",
  });

  let y = 35;
  doc.text("Menu", 5, 30);
  doc.text("Qty", 45, 30);
  doc.text("Subtotal", 60, 30);

  cart.forEach((item) => {
    doc.text(item.name.substring(0, 18), 5, y);
    doc.text(item.qty.toString(), 47, y);
    doc.text((item.price * item.qty).toLocaleString(), 60, y);
    y += 7;
  });

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  doc.text("------------------------------------------", 40, y + 2, {
    align: "center",
  });
  doc.setFontSize(10);
  doc.text(`TOTAL: Rp ${total.toLocaleString()}`, 5, y + 8);
  doc.setFontSize(8);
  doc.text(`Metode: ${selectedMethod}`, 5, y + 13);
  doc.text("Terima Kasih!", 40, y + 22, { align: "center" });

  doc.save(`Struk_${Date.now()}.pdf`);
}

// Manajemen Keranjang
function addToCart(id) {
  const p = products.find((i) => i.id === id);
  const inCart = cart.find((i) => i.id === id);
  if (inCart) inCart.qty++;
  else cart.push({ ...p, qty: 1 });
  updateCartUI();
  showToast(`✅ ${p.name} masuk keranjang`);
}

function updateCartUI() {
  document.getElementById("cart-badge").innerText = cart.reduce(
    (s, i) => s + i.qty,
    0,
  );
  const list = document.getElementById("cart-list");
  list.innerHTML = cart
    .map(
      (item) => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 0; border-bottom:1px solid #f8fafc;">
            <div style="flex:1; text-align:left;">
                <div style="font-weight:700; font-size:0.9rem;">${item.name}</div>
                <div style="color:var(--primary); font-weight:700; font-size:0.8rem;">Rp ${(item.price * item.qty).toLocaleString()}</div>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
                <div style="display:flex; align-items:center; background:#f1f2f6; border-radius:8px; padding:2px;">
                    <button style="border:none; background:none; width:25px; cursor:pointer;" onclick="changeQty(${item.id}, -1)">−</button>
                    <span style="font-weight:800; font-size:0.8rem; min-width:20px; text-align:center;">${item.qty}</span>
                    <button style="border:none; background:none; width:25px; cursor:pointer;" onclick="changeQty(${item.id}, 1)">+</button>
                </div>
                <button style="border:none; background:#fff0f0; color:var(--danger); padding:8px; border-radius:8px; cursor:pointer; font-size:0.7rem;" onclick="removeFromCart(${item.id})">🗑️</button>
            </div>
        </div>
    `,
    )
    .join("");
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  document.getElementById("total-price").innerText =
    `Rp ${total.toLocaleString()}`;
}

function removeFromCart(id) {
  cart = cart.filter((i) => i.id !== id);
  updateCartUI();
}
function changeQty(id, delta) {
  const item = cart.find((i) => i.id === id);
  if (item) {
    item.qty += delta;
    if (item.qty <= 0) removeFromCart(id);
    else updateCartUI();
  }
}

// Checkout & Pembayaran
function setPayment(m) {
  selectedMethod = m;
  document
    .querySelectorAll(".payment-btn")
    .forEach((b) => b.classList.toggle("active", b.id === `pay-${m}`));
}
function handleCheckout() {
  if (cart.length === 0) return;
  if (selectedMethod === "QRIS") {
    document.getElementById("qris-total").innerText =
      `Total: Rp ${cart.reduce((s, i) => s + i.price * i.qty, 0).toLocaleString()}`;
    openModal("qris-modal");
  } else {
    finishOrder();
  }
}
function confirmQRIS() {
  closeModal("qris-modal");
  setTimeout(finishOrder, 400);
}
function finishOrder() {
  generateReceipt();
  closeModal("cart-modal");
  showToast(`💰 Lunas! Struk Terunduh`);
  cart = [];
  updateCartUI();
}

// Fungsi Modal Dasar
function openModal(id) {
  document.getElementById(id).style.display = "flex";
  setTimeout(() => document.getElementById(id).classList.add("active"), 10);
}
function closeModal(id) {
  document.getElementById(id).classList.remove("active");
  setTimeout(() => (document.getElementById(id).style.display = "none"), 400);
}
function toggleCart() {
  if (cart.length > 0) openModal("cart-modal");
  else showToast("🛒 Keranjang kosong");
}
function showToast(msg) {
  const t = document.getElementById("toast");
  t.innerText = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2500);
}
function stepPrice(n) {
  const inp = document.getElementById("new-price");
  inp.value = Math.max(0, (parseInt(inp.value) || 0) + n);
}
function setFilter(cat, btn) {
  currentFilter = cat;
  document
    .querySelectorAll(".btn-filter")
    .forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  renderProducts();
}

// CRUD Produk
function addNewProduct() {
  const name = document.getElementById("new-name").value;
  const price = parseInt(document.getElementById("new-price").value);
  const cat = document.getElementById("new-category").value;
  if (name && price > 0) {
    products.push({ id: Date.now(), name, price, category: cat });
    save();
    renderProducts();
    document.getElementById("new-name").value = "";
    document.getElementById("new-price").value = 0;
    showToast("📦 Menu baru disimpan");
  }
}
function editProduct(id, e) {
  e.stopPropagation();
  const p = products.find((x) => x.id === id);
  currentEditId = id;
  document.getElementById("edit-name").value = p.name;
  document.getElementById("edit-price").value = p.price;
  setEditCategory(p.category);
  openModal("edit-modal");
}
function setEditCategory(c) {
  currentEditCat = c;
  document
    .querySelectorAll(".pill-choice")
    .forEach((p) => p.classList.toggle("active", p.innerText === c));
}
function saveEdit() {
  const idx = products.findIndex((p) => p.id === currentEditId);
  products[idx].name = document.getElementById("edit-name").value;
  products[idx].price = parseInt(document.getElementById("edit-price").value);
  products[idx].category = currentEditCat;
  save();
  renderProducts();
  closeModal("edit-modal");
  showToast("✏️ Perubahan disimpan");
}
function deleteProduct(id, e) {
  e.stopPropagation();
  if (confirm("Hapus menu ini?")) {
    products = products.filter((p) => p.id !== id);
    save();
    renderProducts();
    showToast("🗑️ Menu dihapus");
  }
}

renderProducts();
// Fungsi untuk Sembunyi/Tampilkan Sidebar
function toggleSidebar() {
  const container = document.getElementById("app-container");
  container.classList.toggle("sidebar-hidden");

  // Tunggu animasi selesai, lalu render ulang grid agar layout pas
  setTimeout(() => {
    renderProducts();
  }, 450);
}
function toggleSidebar() {
  const container = document.getElementById("app-container");
  container.classList.toggle("sidebar-hidden");

  // Re-render produk agar grid menyesuaikan lebar layar yang baru
  setTimeout(() => {
    if (typeof renderProducts === "function") {
      renderProducts();
    }
  }, 450); // Menunggu animasi CSS sidebar selesai (0.4s)
}
/* --- OPTIMASI JAVASCRIPT (OVERRIDE) --- */

function toggleSidebar() {
  const container = document.getElementById("app-container");

  // Gunakan class khusus untuk memberi tahu browser animasi akan dimulai
  container.style.pointerEvents = "none";

  requestAnimationFrame(() => {
    container.classList.toggle("sidebar-hidden");
  });

  // Mengurangi beban kerja: Hanya render ulang SEKALI setelah animasi selesai
  setTimeout(() => {
    container.style.pointerEvents = "auto";
    if (typeof renderProducts === "function") {
      renderProducts();
    }
  }, 300); // Durasi disesuaikan dengan transisi CSS (0.25s)
}
/* --- OPTIMASI LOGIKA RENDER --- */

// Kita ganti cara kerja toggle agar tidak memaksa HP berpikir berat
function toggleSidebar() {
  const container = document.getElementById("app-container");

  // 1. Tambahkan class 'is-animating' untuk mematikan fitur berat sementara
  container.classList.add("is-animating");

  // 2. Jalankan animasi
  container.classList.toggle("sidebar-hidden");

  // 3. Tunggu sampai animasi benar-benar selesai baru nyalakan fitur berat lagi
  setTimeout(() => {
    container.classList.remove("is-animating");
    // Gunakan fungsi render yang hanya memperbarui yang perlu saja
    if (typeof renderProducts === "function") {
      // Kita beri sedikit delay tambahan agar HP tidak kaget
      window.requestAnimationFrame(renderProducts);
    }
  }, 400);
}
/* --- MOBILE LOGIC ENHANCEMENT --- */

// 1. Tutup sidebar otomatis setelah menambah produk (Khusus Mobile)
const originalAddNewProduct = addNewProduct;
addNewProduct = function () {
  originalAddNewProduct(); // Jalankan fungsi asli
  if (window.innerWidth <= 768) {
    toggleSidebar(); // Tutup sidebar
  }
};

// 2. Klik area kosong untuk menutup sidebar di HP
document.addEventListener("click", function (event) {
  const container = document.getElementById("app-container");
  const sidebar = document.querySelector(".sidebar");
  const hamburger = document.querySelector(".hamburger-btn");

  // Jika sidebar sedang terbuka dan yang diklik bukan sidebar/tombol hamburger
  if (
    window.innerWidth <= 768 &&
    !container.classList.contains("sidebar-hidden") &&
    !sidebar.contains(event.target) &&
    !hamburger.contains(event.target)
  ) {
    toggleSidebar();
  }
});

// 3. Pastikan fungsi toggleSidebar menggunakan performa terbaik
function toggleSidebar() {
  const container = document.getElementById("app-container");
  requestAnimationFrame(() => {
    container.classList.toggle("sidebar-hidden");
  });
}
