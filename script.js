/* script.js */

// ✅ رابط Google Apps Script (المُرسَل والمُعتمد الآن)
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxkoTCwAy9qWp0yelFhBC1QpXT_cmiE-Kosu5NgdU1rfoSfxVmuEHIlSA2PU_dPshSU/exec";

// ثوابت تحميل البيانات (يفترض وجود هذه الملفات بجانب ملف HTML)
const PRODUCTS_JSON_URL = "products.json";
const CUSTOMERS_JSON_URL = "customers_main.json";
const GOVERNORATES_JSON_URL = "governorates.json";
const SALES_REPRESENTATIVES_JSON_URL = "sales_representatives.json";

// متغيرات عامة
let productsData = [];
let customersData = [];
let productIndex = 0; 

// عناصر النموذج
const form = document.getElementById("inventoryForm");
const addProductBtn = document.getElementById("addProductBtn");
const productsBody = document.getElementById("productsBody");


// ===========================================
// دوال المساعدة
// ===========================================

// دالة استخراج عدد البواكت من اسم المنتج
function extractPacksPerCarton(productName) {
  const match = productName.match(/(\d+)\s*×/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return null;
}

// تعيين التاريخ والوقت الحالي كقيم افتراضية
function setDefaultDateTime() {
  const now = new Date();
  const dateInput = document.getElementById("visit_date");
  const timeInput = document.getElementById("visit_time");
  const exitTimeInput = document.getElementById("exit_time");

  const pad = (num) => num.toString().padStart(2, '0');

  // تهيئة التاريخ (YYYY-MM-DD)
  const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  dateInput.value = dateStr;

  // تهيئة الوقت (HH:MM)
  const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  timeInput.value = timeStr;
  exitTimeInput.value = timeStr;
}

// ===========================================
// تحميل البيانات
// ===========================================

async function loadData() {
  try {
    // تحميل البيانات من ملفات JSON
    const [prodRes, custRes, govRes, repRes] = await Promise.all([
        fetch(PRODUCTS_JSON_URL),
        fetch(CUSTOMERS_JSON_URL),
        fetch(GOVERNORATES_JSON_URL),
        fetch(SALES_REPRESENTATIVES_JSON_URL)
    ]);

    productsData = await prodRes.json();
    customersData = await custRes.json();
    const governorates = await govRes.json();
    const reps = await repRes.json();

    // تعبئة المحافظات
    const govSelect = document.getElementById("governorate");
    governorates.forEach(name => {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      govSelect.appendChild(opt);
    });

    // تعبئة المندوبين
    const repSelect = document.getElementById("salesRep");
    reps.forEach(name => {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      repSelect.appendChild(opt);
    });

    // تعبئة قائمة العملاء (datalist)
    const customersList = document.getElementById("customersList");
    customersData.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.Customer_Name_AR;
      opt.dataset.code = c.Customer_Code;
      customersList.appendChild(opt);
    });

    // ربط اسم العميل بكوده
    const customerInput = document.getElementById("customer");
    const customerCode = document.getElementById("customer_code");
    customerInput.addEventListener("input", () => {
      const selected = [...customersList.options].find(opt => opt.value === customerInput.value);
      customerCode.value = selected ? selected.dataset.code : "";
      updateSummary();
    });

    setDefaultDateTime();
    addProductRow(); // إضافة أول صف منتج
    updateSummary();
  } catch (err) {
    showMsg(`خطأ في تحميل البيانات الأساسية (ملفات JSON): ${err.message}`, 'error');
    console.error("خطأ في تحميل البيانات:", err);
  }
}

// ===========================================
// إدارة المنتجات الديناميكية والملخص
// ===========================================

// إضافة بطاقة منتج
function addProductRow() {
  productIndex++;
  
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
      const packs = extractPacksPerCarton(selected.value);
      unitInput.value = packs ? packs + " باكت/كرتون" : "غير محدد";
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

  // تحديث الملخص عند تغيير الكميات والانتهاء
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
    
    // تحديث حالة انتهاء المنتج
    const expiryInput = card.querySelector(".expiry-input");
    checkExpiryStatus(expiryInput);
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

// دالة لتلوين حقول تاريخ الانتهاء بناءً على الحالة
function checkExpiryStatus(input) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (!input.value) {
    input.classList.remove("is-valid", "is-warning", "is-invalid");
    return;
  }

  const expiryDate = new Date(input.value);
  expiryDate.setHours(0, 0, 0, 0);

  const diffTime = expiryDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  input.classList.remove("is-valid", "is-warning", "is-invalid");

  if (diffDays < 0) {
    input.classList.add("is-invalid"); // منتهي
  } else if (diffDays <= 30) {
    input.classList.add("is-warning"); // قريب الانتهاء
  } else {
    input.classList.add("is-valid"); // صالح
  }
}

// ===========================================
// الإرسال والتحقق
// ===========================================

// دالة عرض رسالة للمستخدم
function showMsg(message, type) {
    const formMsg = document.getElementById('formMsg');
    formMsg.textContent = message;
    formMsg.className = `msg mb-3 ${type}`; 
    formMsg.style.display = 'block';
    setTimeout(() => {
        formMsg.style.display = 'none';
    }, 7000); 
}

// بناء معاينة قبل الإرسال في المودال
function buildPreview() {
  const previewContainer = document.getElementById("previewContainer");
  // ... (نفس منطق buildPreview) ...
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

  const products = serializeFormData().products;

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
              ${products.map((p, idx) => `
                <tr>
                  <td>${idx + 1}</td>
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
  if (!form.reportValidity()) {
    showMsg("يرجى ملء جميع الحقول المطلوبة في النموذج.", 'error');
    return false;
  }

  const customerCode = document.getElementById("customer_code").value.trim();
  if (!customerCode) {
    showMsg("رجاءً اختر العميل من القائمة حتى يظهر كوده.", 'error');
    return false;
  }

  const cards = document.querySelectorAll(".product-card");
  if (cards.length === 0) {
    showMsg("أضف منتجًا واحدًا على الأقل للجرد.", 'error');
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
  // تعطيل الأزرار أثناء الإرسال
  const submitBtn = form.querySelector('button[type="submit"]');
  const confirmBtn = document.getElementById("confirmSendBtn");
  submitBtn.disabled = true;
  confirmBtn.disabled = true;
  
  // إغلاق المودال مباشرة قبل الإرسال لمنع التكرار
  const modal = bootstrap.Modal.getInstance(document.getElementById('previewModal'));
  if (modal) modal.hide(); 

  try {
    // استخدام mode: 'no-cors' لتجاوز مشكلة CORS
    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: 'no-cors', // هذا هو المفتاح لإرسال البيانات دون قيود CORS
      headers: { 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify(data)
    });

    // رسالة النجاح المطلوبة منك (مع افتراض النجاح):
    showMsg("✅ تم الإرسال بنجاح. سنقوم بمراجعة البيانات الآن.", 'success');
    
    // إعادة تهيئة النموذج
    form.reset();
    productsBody.innerHTML = "";
    productIndex = 0;
    addProductRow();
    setDefaultDateTime();
    updateSummary();

  } catch (err) {
    console.error("خطأ الإرسال:", err);
    showMsg("⚠️ فشل في إرسال الطلب. تأكد من الاتصال بالإنترنت وصحة رابط Apps Script.", 'error');
  } finally {
    submitBtn.disabled = false;
    confirmBtn.disabled = false;
  }
}

// ===========================================
// ربط الأحداث
// ===========================================

document.addEventListener("DOMContentLoaded", () => {
  loadData();

  addProductBtn.addEventListener("click", addProductRow);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    document.getElementById('formMsg').style.display = 'none'; 

    if (!validateForm()) return;

    buildPreview();

    // إعداد وتشغيل المودال
    const previewModalEl = document.getElementById("previewModal");
    const modal = new bootstrap.Modal(previewModalEl);
    modal.show();

    const confirmBtn = document.getElementById("confirmSendBtn");
    
    // يجب إزالة المستمع القديم قبل إضافة الجديد لتجنب تكرار الإرسال
    const oldListener = confirmBtn.dataset.listener;
    if (oldListener) {
        // نستخدم نسخة مبسطة من إزالة المستمع، فقط لإزالة التكرار المحتمل
        confirmBtn.removeEventListener('click', window.onConfirmHandler); 
    }

    const onConfirm = async () => {
      // لا حاجة لإخفاء المودال هنا، لأن دالة postData ستفعل ذلك
      const data = serializeFormData();
      await postData(data);
      // إزالة المستمع بعد الإرسال
      confirmBtn.removeEventListener('click', onConfirm);
    };

    confirmBtn.addEventListener("click", onConfirm);
    window.onConfirmHandler = onConfirm; // تخزين مرجع الدالة لتجنب التكرار في المرة القادمة
    confirmBtn.dataset.listener = 'onConfirmHandler';
  });
  
  // تحديث الملخص لكامل حقول الزيارة
  document.querySelectorAll('#inventoryForm input, #inventoryForm select, #inventoryForm textarea').forEach(element => {
    if (!element.className.includes('product-')) {
      element.addEventListener('input', updateSummary);
    }
  });
});
