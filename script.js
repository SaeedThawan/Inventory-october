/* script.js */

// رابط Google Apps Script
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw-lQEIp50L0lf67_tYOX42VBBJH39Yh07A7xxP4k08AfxKkb9L5xFFBinPvpvGA_fI/exec";

// بيانات عامة
let productsData = [];
let customersData = [];
let productIndex = 0;

// عناصر واجهة
const form = document.getElementById("inventoryForm");
const formMsg = document.getElementById("formMsg");
const liveSummary = document.getElementById("liveSummary");
const addProductBtn = document.getElementById("addProductBtn");

// رسائل للمستخدم
function showMsg(type, text) {
  formMsg.className = `msg ${type}`;
  formMsg.textContent = text;
  formMsg.style.display = "block";
  setTimeout(() => {
    formMsg.style.display = "none";
  }, 4000);
}

// تعيين تاريخ ووقت افتراضي
function setDefaultDateTime() {
  const visitDate = document.getElementById("visit_date");
  const visitTime = document.getElementById("visit_time");
  const exitTime = document.getElementById("exit_time");

  const now = new Date();
  const pad = n => String(n).padStart(2, "0");

  visitDate.value = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  visitTime.value = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const exit = new Date(now.getTime() + 30 * 60000);
  exitTime.value = `${pad(exit.getHours())}:${pad(exit.getMinutes())}`;
}

// تحميل البيانات
async function loadData() {
  try {
    // المنتجات
    const prodRes = await fetch("products.json");
    productsData = await prodRes.json();

    // العملاء
    const custRes = await fetch("customers_main.json");
    customersData = await custRes.json();

    // المحافظات
    const govRes = await fetch("governorates.json");
    const governorates = await govRes.json();
    const govSelect = document.getElementById("governorate");
    governorates.forEach(name => {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      govSelect.appendChild(opt);
    });

    // مندوبي المبيعات
    const repRes = await fetch("sales_representatives.json");
    const reps = await repRes.json();
    const repSelect = document.getElementById("salesRep");
    reps.forEach(name => {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      repSelect.appendChild(opt);
    });

    // تعبئة العملاء في datalist
    const customersList = document.getElementById("customersList");
    customersData.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.Customer_Name_AR;
      opt.dataset.code = c.Customer_Code;
      customersList.appendChild(opt);
    });

    // ربط كود العميل تلقائيًا
    const customerInput = document.getElementById("customer");
    const customerCode = document.getElementById("customer_code");
    customerInput.addEventListener("input", () => {
      const selected = [...customersList.options].find(opt => opt.value === customerInput.value);
      customerCode.value = selected ? selected.dataset.code : "";
    });

    setDefaultDateTime();
    addProductRow(); // بطاقة أولى تلقائيًا
  } catch (err) {
    console.error("خطأ في تحميل البيانات:", err);
    showMsg("error", "تعذر تحميل البيانات. تأكد من وجود ملفات JSON بجانب الملفات.");
  }
}

// إضافة بطاقة منتج
function addProductRow() {
  productIndex++;
  const productsBody = document.getElementById("productsBody");

  const col = document.createElement("div");
  col.className = "col-md-6 product-card";

  col.innerHTML = `
    <div class="card mb-3 shadow-sm">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <h6 class="text-primary mb-0">منتج #${productIndex}</h6>
          <button type="button" class="btn btn-outline-danger btn-sm" data-action="remove">🗑️ حذف</button>
        </div>

        <div class="mb-2">
          <label class="form-label">اسم المنتج:</label>
          <input type="text" class="form-control product-input" list="productsList_${productIndex}" placeholder="ابحث عن المنتج..." required>
          <datalist id="productsList_${productIndex}"></datalist>
          <input type="hidden" name="product_code_${productIndex}" class="product-code">
        </div>

        <div class="mt-2">
          <label class="form-label">عدد العبوة:</label>
          <input type="text" class="form-control unit-input" name="unit_${productIndex}" placeholder="مثال: 12 باكت أو 24 باكت" required>
        </div>

        <div class="row g-2 mt-2">
          <div class="col-md-6">
            <label class="form-label">الكمية (كرتون):</label>
            <input type="number" class="form-control cartons-input" name="cartons_${productIndex}" min="0" value="0" required>
          </div>
          <div class="col-md-6">
            <label class="form-label">الكمية (باكت):</label>
            <input type="number" class="form-control packs-input" name="packs_${productIndex}" min="0" value="0" required>
          </div>
        </div>

        <div class="mt-2">
          <label class="form-label">تاريخ الانتهاء:</label>
          <input type="date" class="form-control expiry-input" name="expiry_${productIndex}" required>
        </div>

        <div class="mt-2 small text-muted duplicate-hint d-none"></div>
      </div>
    </div>
  `;

  productsBody.appendChild(col);

  // تعبئة قائمة المنتجات
  const datalist = col.querySelector(`#productsList_${productIndex}`);
  productsData.forEach(prod => {
    const opt = document.createElement("option");
    opt.value = prod.Product_Name_AR;
    opt.dataset.code = prod.Product_Code;
    datalist.appendChild(opt);
  });

  // ربط كود المنتج عند اختيار الاسم
  const nameInput = col.querySelector(".product-input");
  const codeInput = col.querySelector(".product-code");
  const expiryInput = col.querySelector(".expiry-input");
  const duplicateHint = col.querySelector(".duplicate-hint");

  nameInput.addEventListener("input", () => {
    const selected = [...datalist.options].find(opt => opt.value === nameInput.value);
    codeInput.value = selected ? selected.dataset.code : "";
    checkDuplicateEntry(col, duplicateHint);
  });

  expiryInput.addEventListener("input", () => {
    checkDuplicateEntry(col, duplicateHint);
    checkExpiryStatus(col, expiryInput.value);
  });

  // حذف البطاقة
  const removeBtn = col.querySelector("[data-action='remove']");
  removeBtn.addEventListener("click", () => {
    col.remove();
    updateSummary();
  });

  // تحديث الملخص عند تغيير الكميات
  const cartonsInput = col.querySelector(".cartons-input");
  const packsInput = col.querySelector(".packs-input");
  cartonsInput.addEventListener("input", updateSummary);
  packsInput.addEventListener("input", updateSummary);

  updateSummary();
}

// فحص تكرار فوري
function checkDuplicateEntry(currentCol, hintEl) {
  const salesRep = document.getElementById("salesRep").value.trim();
  const customerCode = document.getElementById("customer_code").value.trim();

  const currentCode = currentCol.querySelector(".product-code").value.trim();
  const currentExpiry = currentCol.querySelector(".expiry-input").value;
  const currentUnit = currentCol.querySelector(".unit-input").value.trim();

  if (!salesRep || !customerCode || !currentCode || !currentExpiry || !currentUnit) {
    hintEl.classList.add("d-none");
    hintEl.textContent = "";
    return;
  }

  const cards = document.querySelectorAll(".product-card");
  let foundMatch = false;

  cards.forEach(card => {
    if (card === currentCol) return;
    const code = card.querySelector(".product-code").value.trim();
    const expiry = card.querySelector(".expiry-input").