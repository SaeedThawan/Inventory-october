/* script.js */

// اختياري: ضع رابط Google Apps Script هنا إذا تريد الإرسال الفعلي
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

        <div class="row g-2">
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

// فحص تكرار فوري داخل النموذج (نفس المنتج + نفس التاريخ + نفس العميل + نفس المندوب)
function checkDuplicateEntry(currentCol, hintEl) {
  const salesRep = document.getElementById("salesRep").value.trim();
  const customerCode = document.getElementById("customer_code").value.trim();

  const currentCode = currentCol.querySelector(".product-code").value.trim();
  const currentExpiry = currentCol.querySelector(".expiry-input").value;

  if (!salesRep || !customerCode || !currentCode || !currentExpiry) {
    hintEl.classList.add("d-none");
    hintEl.textContent = "";
    return;
  }

  const cards = document.querySelectorAll(".product-card");
  let foundMatch = false;
  let totalCartons = 0;
  let totalPacks = 0;

  cards.forEach(card => {
    if (card === currentCol) return;
    const code = card.querySelector(".product-code").value.trim();
    const expiry = card.querySelector(".expiry-input").value;

    const cartons = parseInt(card.querySelector(".cartons-input").value || "0", 10);
    const packs = parseInt(card.querySelector(".packs-input").value || "0", 10);

    if (code && expiry && code === currentCode && expiry === currentExpiry) {
      foundMatch = true;
      totalCartons += cartons;
      totalPacks += packs;
    }
  });

  if (foundMatch) {
    hintEl.classList.remove("d-none");
    hintEl.textContent = `تنبيه: يوجد إدخال آخر لنفس المنتج والتاريخ. سيُدمج تلقائيًا عند الإرسال (كراتين مكررة: ${totalCartons}، باكت مكرر: ${totalPacks}).`;
  } else {
    hintEl.classList.add("d-none");
    hintEl.textContent = "";
  }
}

// ملخص مباشر
function updateSummary() {
  const cards = document.querySelectorAll(".product-card");
  let count = 0, totalCartons = 0, totalPacks = 0;

  cards.forEach(card => {
    count++;
    totalCartons += parseInt(card.querySelector(".cartons-input").value || "0", 10);
    totalPacks += parseInt(card.querySelector(".packs-input").value || "0", 10);
  });

  if (count > 0) {
    liveSummary.classList.remove("d-none");
    liveSummary.textContent = `عدد المنتجات: ${count} | إجمالي الكراتين: ${totalCartons} | إجمالي البواكت: ${totalPacks}`;
  } else {
    liveSummary.classList.add("d-none");
    liveSummary.textContent = "";
  }
}

// تحقق من صحة النموذج
function validateForm() {
  const entryName = document.getElementById("entryName").value.trim();
  const salesRep = document.getElementById("salesRep").value.trim();
  const governorate = document.getElementById("governorate").value.trim();
  const customer = document.getElementById("customer").value.trim();
  const customerCode = document.getElementById("customer_code").value.trim();
  const visitDate = document.getElementById("visit_date").value;
  const visitTime = document.getElementById("visit_time").value;
  const exitTime = document.getElementById("exit_time").value;

  if (!entryName || !salesRep || !governorate || !customer || !visitDate || !visitTime || !exitTime) {
    showMsg("error", "رجاءً أكمل جميع حقول بيانات الزيارة.");
    return false;
  }

  if (!customerCode) {
    showMsg("error", "اختر العميل من قائمة البحث لضمان ربط الكود.");
    return false;
  }

  const [inH, inM] = visitTime.split(":").map(Number);
  const [outH, outM] = exitTime.split(":").map(Number);
  if (outH * 60 + outM <= inH * 60 + inM) {
    showMsg("error", "وقت الخروج يجب أن يكون بعد وقت الدخول.");
    return false;
  }

  const cards = document.querySelectorAll(".product-card");
  if (cards.length === 0) {
    showMsg("error", "أضف على الأقل منتج واحد في الجرد.");
    return false;
  }

  for (const card of cards) {
    const name = card.querySelector(".product-input").value.trim();
    const code = card.querySelector(".product-code").value.trim();
    const cartons = parseInt(card.querySelector(".cartons-input").value || "0", 10);
    const packs = parseInt(card.querySelector(".packs-input").value || "0", 10);
    const expiry = card.querySelector(".expiry-input").value;

    if (!name || !code) {
      showMsg("error", "تأكد من اختيار المنتج من البحث ليتم ربط الكود.");
      return false;
    }
    if (!expiry) {
      showMsg("error", `أدخل تاريخ الانتهاء للمنتج: ${name}`);
      return false;
    }
    if (cartons < 0 || packs < 0) {
      showMsg("error", "الكميات لا يمكن أن تكون سالبة.");
      return false;
    }
    if (cartons === 0 && packs === 0) {
      showMsg("error", `أدخل كمية (كرتون أو باكت) للمنتج: ${name}`);
      return false;
    }
  }

  return true;
}

// تجميع الصفوف الخام من البطاقات
function collectRowsRaw() {
  const entryName = document.getElementById("entryName").value.trim();
  const salesRep = document.getElementById("salesRep").value.trim();
  const governorate = document.getElementById("governorate").value.trim();
  const customer = document.getElementById("customer").value.trim();
  const customerCode = document.getElementById("customer_code").value.trim();
  const visitDate = document.getElementById("visit_date").value;
  const visitTime = document.getElementById("visit_time").value;
  const exitTime = document.getElementById("exit_time").value;
  const notes = document.getElementById("notes").value.trim();

  const rows = [];
  const cards = document.querySelectorAll(".product-card");

  cards.forEach(card => {
    const productName = card.querySelector(".product-input").value.trim();
    const productCode = card.querySelector(".product-code").value.trim();
    const cartons = parseInt(card.querySelector(".cartons-input").value || "0", 10);
    const packs = parseInt(card.querySelector(".packs-input").value || "0", 10);
    const expiry = card.querySelector(".expiry-input").value;

    rows.push({
      Entry_Name: entryName,
      Sales_Rep: salesRep,
      Governorate: governorate,
      Customer_Name_AR: customer,
      Customer_Code: customerCode,
      Visit_Date: visitDate,
      Visit_Time_In: visitTime,
      Visit_Time_Out: exitTime,
      Product_Name_AR: productName,
      Product_Code: productCode,
      Cartons: cartons,
      Packs: packs,
      Expiry_Date: expiry,
      Notes: notes,
      Created_At: new Date().toISOString()
    });
  });

  return rows;
}

// دمج الصفوف حسب (Product_Code + Expiry_Date + Customer_Code + Sales_Rep)
function mergeRows(rows) {
  const map = new Map();
  rows.forEach(r => {
    const key = `${r.Product_Code}__${r.Expiry_Date}__${r.Customer_Code}__${r.Sales_Rep}`;
    if (map.has(key)) {
      const ex = map.get(key);
      ex.Cartons += r.Cartons;
      ex.Packs += r.Packs;
    } else {
      map.set(key, { ...r });
    }
  });
  return Array.from(map.values());
}

// بناء HTML للمراجعة
function buildPreviewHTML(mergedRows) {
  const totalItems = mergedRows.length;
  const totalCartons = mergedRows.reduce((s, r) => s + (r.Cartons || 0), 0);
  const totalPacks = mergedRows.reduce((s, r) => s + (r.Packs || 0), 0);

  const header =
    `<div class="alert alert-info">
      <strong>ملخص:</strong> الصفوف بعد الدمج: ${totalItems} | إجمالي الكراتين: ${totalCartons} | إجمالي البواكت: ${totalPacks}
    </div>`;

  const tableHead =
    `<table class="table table-sm table-bordered align-middle">
      <thead class="table-light">
        <tr>
          <th>الكود</th>
          <th>المنتج</th>
          <th>تاريخ الانتهاء</th>
          <th>العميل</th>
          <th>المندوب</th>
          <th>كراتين</th>
          <th>باكت</th>
        </tr>
      </thead>
      <tbody>`;

  const rowsHTML = mergedRows.map(r =>
    `<tr>
      <td>${r.Product_Code}</td>
      <td>${r.Product_Name_AR}</td>
      <td>${r.Expiry_Date}</td>
      <td>${r.Customer_Name_AR} (${r.Customer_Code})</td>
      <td>${r.Sales_Rep}</td>
      <td>${r.Cartons}</td>
      <td>${r.Packs}</td>
    </tr>`
  ).join("");

  const tableFoot = `</tbody></table>`;

  return header + tableHead + rowsHTML + tableFoot;
}

// عرض نافذة المراجعة ثم التأكيد
function showPreviewAndConfirm(mergedRows) {
  const container = document.getElementById("previewContainer");
  container.innerHTML = buildPreviewHTML(mergedRows);

  const modalEl = document.getElementById("previewModal");
  const bsModal = new bootstrap.Modal(modalEl);
  bsModal.show();

  const confirmBtn = document.getElementById("confirmSendBtn");
  const newConfirmBtn = confirmBtn.cloneNode(true);
  confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

  newConfirmBtn.addEventListener("click", async () => {
    bsModal.hide();
    const ok = await sendRows(mergedRows);
    if (ok) {
      form.reset();
      document.getElementById("productsBody").innerHTML = "";
      productIndex = 0;
      setDefaultDateTime();
      addProductRow();
      liveSummary.classList.add("d-none");
      liveSummary.textContent = "";
    }
  });
}

// إرسال البيانات
async function sendRows(rows) {
  if (!GOOGLE_SCRIPT_URL) {
    console.log("البيانات الجاهزة للإرسال:", rows);
    showMsg("success", "تم تجهيز البيانات وعرضها للمراجعة (وضع التطوير). اضبط GOOGLE_SCRIPT_URL للإرسال الفعلي.");
    return true;
  }

  try {
    const res = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rows)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    await res.json(); // حسب استجابتك من Apps Script
    showMsg("success", "تم إرسال بيانات الجرد بنجاح.");
    return true;
  } catch (err) {
    console.error("فشل الإرسال:", err);
    showMsg("error", "فشل الإرسال. تأكد من الرابط ثم حاول مرة أخرى.");
    return false;
  }
}

// إرسال النموذج مع المراجعة والدمج
form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!validateForm()) return;

  const rawRows = collectRowsRaw();
  const merged = mergeRows(rawRows);
  showPreviewAndConfirm(merged);
});

// زر إضافة منتج
addProductBtn.addEventListener("click", addProductRow);

// بدء التشغيل
document.addEventListener("DOMContentLoaded", () => {
  loadData();
});