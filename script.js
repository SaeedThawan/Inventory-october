/* script.js */

// إعدادات عامة
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw-lQEIp50L0lf67_tYOX42VBBJH39Yh07A7xxP4k08AfxKkb9L5xFFBinPvpvGA_fI/exec";

let productsData = [];
let customersData = [];
let productIndex = 0;

// عناصر DOM عامة
const form = document.getElementById("inventoryForm");
const formMsg = document.getElementById("formMsg");
const liveSummary = document.getElementById("liveSummary");
const addProductBtn = document.getElementById("addProductBtn");

// رسائل للمستخدم
function showMsg(type, text) {
  // type: success | error | info
  formMsg.className = `msg alert alert-${type === "success" ? "success" : type === "error" ? "danger" : "info"}`;
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

// تحميل البيانات من JSON وتعبئة القوائم
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
    showMsg("info", "تم تحميل البيانات بنجاح.");
  } catch (err) {
    console.error("خطأ في تحميل البيانات:", err);
    showMsg("error", "تعذر تحميل البيانات. تأكد من وجود ملفات JSON بجانب الملفات.");
  }
}

// إضافة بطاقة منتج جديدة
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

  // عناصر البطاقة
  const nameInput = col.querySelector(".product-input");
  const codeInput = col.querySelector(".product-code");
  const expiryInput = col.querySelector(".expiry-input");
  const duplicateHint = col.querySelector(".duplicate-hint");
  const cartonsInput = col.querySelector(".cartons-input");
  const packsInput = col.querySelector(".packs-input");

  // ربط كود المنتج عند اختيار الاسم
  nameInput.addEventListener("input", () => {
    const selected = [...datalist.options].find(opt => opt.value === nameInput.value);
    codeInput.value = selected ? selected.dataset.code : "";
    checkDuplicateEntry(col, duplicateHint);
    updateSummary();
  });

  // فحص التكرار والانتهاء
  expiryInput.addEventListener("input", () => {
    checkDuplicateEntry(col, duplicateHint);
    checkExpiryStatus(expiryInput.value, expiryInput);
  });

  // حذف البطاقة
  const removeBtn = col.querySelector("[data-action='remove']");
  removeBtn.addEventListener("click", () => {
    col.remove();
    updateSummary();
  });

  // تحديث الملخص عند تغيير الكميات
  cartonsInput.addEventListener("input", updateSummary);
  packsInput.addEventListener("input", updateSummary);

  updateSummary();
}

// فحص تكرار نفس المنتج بنفس الوحدة وتاريخ الانتهاء
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
    const expiry = card.querySelector(".expiry-input").value;
    const unit = card.querySelector(".unit-input").value.trim();

    if (code === currentCode && expiry === currentExpiry && unit === currentUnit) {
      foundMatch = true;
    }
  });

  if (foundMatch) {
    hintEl.classList.remove("d-none");
    hintEl.textContent = "⚠️ هذا المنتج بنفس الوحدة وتاريخ الانتهاء مكرر بالفعل.";
  } else {
    hintEl.classList.add("d-none");
    hintEl.textContent = "";
  }
}

// فحص حالة تاريخ الانتهاء وإظهار تنبيه بسيط
function checkExpiryStatus(expiryValue, inputEl) {
  if (!expiryValue) {
    inputEl.classList.remove("is-invalid", "is-warning", "is-valid");
    return;
  }
  const today = new Date();
  const expiry = new Date(expiryValue);

  // إزالة أي حالة سابقة
  inputEl.classList.remove("is-invalid", "is-warning", "is-valid");

  if (expiry < today) {
    inputEl.classList.add("is-invalid"); // منتهي
    inputEl.title = "تاريخ منتهي";
  } else {
    const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    if (diffDays <= 30) {
      inputEl.classList.add("is-warning"); // قريب الانتهاء (تحتاج CSS يدعمه)
      inputEl.title = "قريب الانتهاء خلال 30 يوم";
    } else {
      inputEl.classList.add("is-valid"); // سليم
      inputEl.title = "تاريخ صالح";
    }
  }
}

// ملخص مباشر للكميات
function updateSummary() {
  const cards = document.querySelectorAll(".product-card");
  let totalCartons = 0;
  let totalPacks = 0;

  cards.forEach(card => {
    const cartons = Number(card.querySelector(".cartons-input").value || 0);
    const packs = Number(card.querySelector(".packs-input").value || 0);
    totalCartons += cartons;
    totalPacks += packs;
  });

  if (cards.length === 0) {
    liveSummary.classList.add("d-none");
    liveSummary.textContent = "";
    return;
  }

  liveSummary.classList.remove("d-none");
  liveSummary.innerHTML = `
    <strong>الملخص:</strong> عدد المنتجات: ${cards.length} — إجمالي الكراتين: ${totalCartons} — إجمالي الباكِت: ${totalPacks}
  `;
}
// بناء معاينة قبل الإرسال في المودال
function buildPreview() {
  const previewContainer = document.getElementById("previewContainer");

  const headerFields = [
    { label: "اسم مدخل البيانات", value: document.getElementById("entryName").value },
    { label: "مندوب المبيعات", value: document.getElementById("salesRep").value },
    { label: "المحافظة", value: document.getElementById("governorate").value },
    { label: "اسم العميل", value: document.getElementById("customer").value },
    { label: "كود العميل", value: document.getElementById("customer_code").value },
    { label: "تاريخ الزيارة", value: document.getElementById("visit_date").value },
    { label: "وقت الدخول", value: document.getElementById("visit_time").value },
    { label: "وقت الخروج", value: document.getElementById("exit_time").value },
    { label: "ملاحظات", value: document.getElementById("notes").value || "—" }
  ];

  const cards = document.querySelectorAll(".product-card");
  const products = [];
  cards.forEach((card, idx) => {
    products.push({
      index: idx + 1,
      name: card.querySelector(".product-input").value,
      code: card.querySelector(".product-code").value,
      unit: card.querySelector(".unit-input").value,
      cartons: card.querySelector(".cartons-input").value,
      packs: card.querySelector(".packs-input").value,
      expiry: card.querySelector(".expiry-input").value
    });
  });

  // HTML المعاينة
  const headerHtml = `
    <div class="mb-3">
      <h6 class="text-primary">بيانات الزيارة</h6>
      <ul class="list-group list-group-flush">
        ${headerFields.map(f => `<li class="list-group-item d-flex justify-content-between"><strong>${f.label}:</strong> <span>${f.value || "—"}</span></li>`).join("")}
      </ul>
    </div>
  `;

  const productsHtml = `
    <div>
      <h6 class="text-primary">جرد المنتجات</h6>
      ${products.length === 0 ? `<div class="alert alert-warning">لا توجد منتجات مضافة.</div>` : `
        <div class="table-responsive">
          <table class="table table-sm">
            <thead>
              <tr>
                <th>#</th><th>اسم المنتج</th><th>الكود</th><th>الوحدة</th><th>كرتون</th><th>باكت</th><th>الانتهاء</th>
              </tr>
            </thead>
            <tbody>
              ${products.map(p => `
                <tr>
                  <td>${p.index}</td>
                  <td>${p.name}</td>
                  <td>${p.code}</td>
                  <td>${p.unit}</td>
                  <td>${p.cartons}</td>
                  <td>${p.packs}</td>
                  <td>${p.expiry}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      `}
    </div>
  `;

  previewContainer.innerHTML = headerHtml + productsHtml;
}

// تحقق أساسي قبل الإرسال
function validateForm() {
  if (!form.reportValidity()) return false;

  const customerCode = document.getElementById("customer_code").value.trim();
  if (!customerCode) {
    showMsg("error", "رجاءً اختر العميل من القائمة حتى يظهر كوده.");
    return false;
  }

  const cards = document.querySelectorAll(".product-card");
  if (cards.length === 0) {
    showMsg("error", "أضف منتجًا واحدًا على الأقل للجرد.");
    return false;
  }

  // منع وجود تاريخ منتهي
  for (const card of cards) {
    const expiry = card.querySelector(".expiry-input").value;
    if (expiry && new Date(expiry) < new Date()) {
      showMsg("error", "يوجد منتج بتاريخ انتهاء منتهي. عدّل التاريخ.");
      return false;
    }
  }

  return true;
}

// تجميع البيانات للإرسال
function serializeFormData() {
  const payload = {
    entryName: document.getElementById("entryName").value,
    salesRep: document.getElementById("salesRep").value,
    governorate: document.getElementById("governorate").value,
    customer: document.getElementById("customer").value,
    customer_code: document.getElementById("customer_code").value,
    visit_date: document.getElementById("visit_date").value,
    visit_time: document.getElementById("visit_time").value,
    exit_time: document.getElementById("exit_time").value,
    notes: document.getElementById("notes").value || "",
    products: []
  };

  const cards = document.querySelectorAll(".product-card");
  cards.forEach(card => {
    payload.products.push({
      name: card.querySelector(".product-input").value,
      code: card.querySelector(".product-code").value,
      unit: card.querySelector(".unit-input").value,
      cartons: Number(card.querySelector(".cartons-input").value || 0),
      packs: Number(card.querySelector(".packs-input").value || 0),
      expiry: card.querySelector(".expiry-input").value
    });
  });

  return payload;
}

// إرسال البيانات إلى Google Apps Script
async function postData(data) {
  try {
    const res = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const result = await res.json();

    // توقع أن GAS يعيد { success: true, message: "..." }
    if (result.success) {
      showMsg("success", result.message || "تم إرسال البيانات بنجاح.");
      form.reset();
      document.getElementById("productsBody").innerHTML = "";
      productIndex = 0;
      addProductRow();
      setDefaultDateTime();
      updateSummary();
    } else {
      showMsg("error", result.message || "تعذر الإرسال. حاول مرة أخرى.");
    }
  } catch (err) {
    console.error("خطأ الإرسال:", err);
    showMsg("error", "تعذر الاتصال بالخادم. تحقق من رابط Google Apps Script والصلاحيات.");
  }
}

// ربط الأحداث
document.addEventListener("DOMContentLoaded", () => {
  setDefaultDateTime();
  loadData();

  addProductBtn.addEventListener("click", addProductRow);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    buildPreview();

    const previewModalEl = document.getElementById("previewModal");
    const modal = new bootstrap.Modal(previewModalEl);
    modal.show();

    const confirmBtn = document.getElementById("confirmSendBtn");
    const onConfirm = async () => {
      modal.hide();
      confirmBtn.removeEventListener("click", onConfirm);
      const data = serializeFormData();
      await postData(data);
    };
    // منع التكرار
    confirmBtn.removeEventListener("click", onConfirm);
    confirmBtn.addEventListener("click", onConfirm);
  });
});