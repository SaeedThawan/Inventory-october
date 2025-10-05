/* script.js */

// ✅ تم تعديل الرابط بنجاح
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw-lQEIp50L0lf67_tYOX42VBBJH39Yh07A7xxP4k08AfxKkb9L5xFFBinPvpvGA_fI/exec";

let productsData = [];
let customersData = [];
let productIndex = 0;
const form = document.getElementById("inventoryForm");
const addProductBtn = document.getElementById("addProductBtn");


// دالة استخراج عدد البواكت من اسم المنتج
function extractPacksPerCarton(productName) {
  const match = productName.match(/(\d+)\s*×/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return null;
}

// دالة وهمية لتعيين الوقت والتاريخ الافتراضي
function setDefaultDateTime() {
  const today = new Date();
  const dateString = today.toISOString().split('T')[0];
  const timeString = today.toTimeString().split(' ')[0].substring(0, 5); // HH:MM
  
  document.getElementById("visit_date").value = dateString;
  document.getElementById("visit_time").value = timeString;
  document.getElementById("exit_time").value = timeString;
}

// تحميل البيانات (يجب توفير ملفات JSON في نفس المجلد)
async function loadData() {
  try {
    // يجب استبدال استدعاءات الـ fetch هذه باستدعاء API حقيقي
    // أو توفير ملفات JSON في نفس مكان ملف الـ HTML
    const prodRes = await fetch("products.json");
    productsData = await prodRes.json();

    const custRes = await fetch("customers_main.json");
    customersData = await custRes.json();

    const govRes = await fetch("governorates.json");
    const governorates = await govRes.json();
    const govSelect = document.getElementById("governorate");
    governorates.forEach(name => {
      const opt = document.createElement("option");
      opt.value = name;
      govSelect.appendChild(opt);
    });

    const repRes = await fetch("sales_representatives.json");
    const reps = await repRes.json();
    const repSelect = document.getElementById("salesRep");
    reps.forEach(name => {
      const opt = document.createElement("option");
      opt.value = name;
      repSelect.appendChild(opt);
    });

    const customersList = document.getElementById("customersList");
    customersData.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.Customer_Name_AR;
      opt.dataset.code = c.Customer_Code;
      customersList.appendChild(opt);
    });

    const customerInput = document.getElementById("customer");
    const customerCode = document.getElementById("customer_code");
    customerInput.addEventListener("input", () => {
      const selected = [...customersList.options].find(opt => opt.value === customerInput.value);
      customerCode.value = selected ? selected.dataset.code : "";
    });

    setDefaultDateTime();
    addProductRow();
  } catch (err) {
    console.error("خطأ في تحميل البيانات:", err);
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
          <label class="form-label">عدد العبوة (باكت/كرتون):</label>
          <input type="text" class="form-control unit-input" name="unit_${productIndex}" readonly>
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
  const unitInput = col.querySelector(".unit-input");
  const cartonsInput = col.querySelector(".cartons-input");
  const packsInput = col.querySelector(".packs-input");
  const expiryInput = col.querySelector(".expiry-input");

  // عند اختيار المنتج
  nameInput.addEventListener("input", () => {
    const selected = [...datalist.options].find(opt => opt.value === nameInput.value);
    if (selected) {
      codeInput.value = selected.dataset.code;

      // استخرج عدد البواكت من اسم المنتج
      const packs = extractPacksPerCarton(selected.value);
      if (packs) {
        unitInput.value = packs + " باكت/كرتون";
      } else {
        unitInput.value = "غير محدد";
      }
    } else {
      codeInput.value = "";
      unitInput.value = "";
    }
    updateSummary();
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
  expiryInput.addEventListener("input", updateSummary);

  updateSummary();
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

  const liveSummary = document.getElementById("liveSummary");
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
    alert("رجاءً اختر العميل من القائمة حتى يظهر كوده.");
    return false;
  }

  const cards = document.querySelectorAll(".product-card");
  if (cards.length === 0) {
    alert("أضف منتجًا واحدًا على الأقل للجرد.");
    return false;
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

    // يجب أن يعيد Google Apps Script استجابة JSON للنجاح/الفشل
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const result = await res.json();

    if (result.success) {
      alert("✅ تم إرسال البيانات بنجاح");
      form.reset();
      document.getElementById("productsBody").innerHTML = "";
      productIndex = 0;
      addProductRow();
      setDefaultDateTime();
      updateSummary();
    } else {
      alert("❌ تعذر الإرسال: " + (result.message || ""));
    }
  } catch (err) {
    console.error("خطأ الإرسال:", err);
    alert("⚠️ تعذر الاتصال بالخادم. تحقق من رابط Google Apps Script و من إعدادات CORS.");
  }
}

// ربط الأحداث
document.addEventListener("DOMContentLoaded", () => {
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
    // يجب استخدام دالة واحدة فقط لمعالجة النقر، لتجنب الإرسال المتعدد
    const onConfirm = async () => {
      // إزالة المعالج قبل الإرسال لمنع النقر المزدوج
      confirmBtn.removeEventListener("click", onConfirm); 
      
      modal.hide();
      const data = serializeFormData();
      await postData(data);

      // إعادة إضافة المعالج استعداداً للنموذج التالي (أو إعادة تحميل الصفحة)
      // في هذه الحالة نعتمد على إعادة التحميل بعد الـ form.reset()
    };
    confirmBtn.addEventListener("click", onConfirm);
  });
});
