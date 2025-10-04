// script.js - الكود الموحد والنهائي

// ===================================================
// 1. الإعدادات والمتغيرات العالمية
// ===================================================

// يرجى تحديث هذا الرابط برابط Web App الخاص بك في Google Apps Script
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw-lQEIp50L0lf67_tYOX42VBBJH39Yh07A7xxP4k08AfxKkb9L5xFFBinPvpvGA_fI/exec";

let PRODUCTS = [];
let CUSTOMERS = []; 

// ===================================================
// 2. دوال مساعدة (تحميل وعرض رسائل)
// ===================================================

async function loadJSON(file) {
    try {
        const res = await fetch(file);
        if (!res.ok) {
            console.error(`خطأ في تحميل ${file}: ${res.statusText}`);
            throw new Error(`خطأ في تحميل ${file}`);
        }
        return await res.json();
    } catch (error) {
        // نستخدم 'throw' لإيقاف التنفيذ وإظهار رسالة خطأ للمستخدم
        console.error(`فشل في الاتصال أو تحليل ${file}:`, error);
        throw new Error(`فشل في تحميل بيانات ${file}.`);
    }
}

function showMsg(msg, error = false) {
    const el = document.getElementById('formMsg');
    el.textContent = msg;
    el.className = "msg" + (error ? " error" : " success");
    el.style.display = 'block';
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (!error) {
        setTimeout(() => { el.style.display = 'none'; }, 5000);
    }
}

// ===================================================
// 3. دوال تحميل البيانات وتعبئة القوائم الرئيسية
// ===================================================

async function fillSelects() {
    try {
        const [salesReps, governorates, customersData] = await Promise.all([
            loadJSON('sales_representatives.json'), 
            loadJSON('governorates.json'),         
            loadJSON('customers_main.json'),       
        ]);

        CUSTOMERS = customersData;

        // تعبئة قائمة المندوبين
        const salesRepSelect = document.getElementById('salesRep');
        salesReps.forEach(repName => {
            const opt = new Option(repName, repName); 
            salesRepSelect.appendChild(opt);
        });

        // تعبئة قائمة المحافظات
        const governorateSelect = document.getElementById('governorate');
        governorates.forEach(govName => {
            const opt = new Option(govName, govName); 
            governorateSelect.appendChild(opt);
        });

        // تعبئة قائمة بيانات العملاء (لـ datalist - البحث السريع)
        const customersList = document.getElementById('customersList');
        CUSTOMERS.forEach(cust => {
            const opt = document.createElement('option');
            opt.value = cust.Customer_Name_AR; 
            customersList.appendChild(opt);
        });

        // ربط حقل العميل بجلب الكود
        document.getElementById('customer').addEventListener('input', function() {
            const name = this.value;
            const found = CUSTOMERS.find(c => c.Customer_Name_AR === name);
            document.getElementById('customer_code').value = found ? found.Customer_Code : '';
        });
        
    } catch (err) {
        // عرض رسالة الخطأ العامة التي تم توليدها في loadJSON
        showMsg(err.message + " يرجى التأكد من ملفات JSON.", true);
        throw err; // إعادة رمي الخطأ لإيقاف التنفيذ إذا فشل التحميل
    }
}

async function prepareProducts() {
    try {
        PRODUCTS = await loadJSON('products.json');
    } catch (err) {
        showMsg(err.message + " يرجى التأكد من ملف products.json.", true);
        throw err; // إعادة رمي الخطأ
    }
}

// ===================================================
// 4. دوال التعامل مع بطاقات المنتجات (الجرد)
// ===================================================

/**
 * إضافة بطاقة منتج جديدة بتصميم أنيق ومرن.
 */
function addProductRow() {
    const productsBody = document.getElementById('productsBody');
    const productCard = document.createElement('div');
    productCard.classList.add('col-12'); 
    
    // إعداد قائمة الخيارات المنسدلة للمنتجات
    let options = '<option value="">اختر المنتج...</option>';
    // 💡 استخدام مصفوفة المنتجات المملوءة
    PRODUCTS.forEach(prod => {
        options += `<option value="${prod.Product_Name_AR}">${prod.Product_Name_AR}</option>`;
    });

    productCard.innerHTML = `
        <div class="card product-card shadow-sm border-info">
            <div class="card-body p-3">
                
                <div class="d-flex justify-content-between align-items-start mb-3">
                    <div class="flex-grow-1 me-3">
                        <label class="form-label fw-bold">اسم المنتج:</label>
                        <select class="prod-name form-select" required>${options}</select>
                    </div>
                    
                    <button type="button" class="btn btn-outline-danger btn-sm align-self-center" onclick="removeProductRow(this)">
                        حذف
                    </button>
                </div>

                <div class="row g-2 mb-3">
                    <div class="col-md-4 col-6">
                        <label class="form-label small text-muted">الكود:</label>
                        <input type="text" class="prod-code form-control form-control-sm bg-light" readonly placeholder="الكود">
                    </div>
                    <div class="col-md-4 col-6">
                        <label class="form-label small text-muted">الفئة:</label>
                        <input type="text" class="prod-cat form-control form-control-sm bg-light" readonly placeholder="الفئة">
                    </div>
                    <div class="col-md-4">
                        <label for="" class="form-label small text-muted">تاريخ الانتهاء:</label>
                        <input type="date" class="prod-expiry form-control form-control-sm">
                    </div>
                </div>

                <div class="row g-2">
                    <div class="col-6">
                        <label class="form-label fw-bold">عدد الكراتين:</label>
                        <input type="number" class="prod-carton form-control" min="0" value="0" required>
                    </div>
                    <div class="col-6">
                        <label class="form-label fw-bold">عدد الباكت:</label>
                        <input type="number" class="prod-packet form-control" min="0" value="0" required>
                    </div>
                </div>

            </div>
        </div>
    `;
    productsBody.appendChild(productCard);

    productCard.querySelector('.prod-name').addEventListener('change', function(){
        const name = this.value;
        const prod = PRODUCTS.find(p => p.Product_Name_AR === name);
        productCard.querySelector('.prod-code').value = prod ? prod.Product_Code : '';
        productCard.querySelector('.prod-cat').value = prod ? prod.Category : '';
    });
}

function removeProductRow(btn) {
    btn.closest('.col-12').remove();
}

// ===================================================
// 5. دوال الإرسال (بدون تغيير)
// ===================================================

function validateForm() {
    // ... (كود التحقق كما هو) ...
    const form = document.getElementById('inventoryForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return false;
    }

    if (!document.getElementById('customer_code').value) {
        showMsg("يرجى اختيار العميل من قائمة البحث لربط كود العميل!", true);
        return false;
    }
    
    const visitTime = document.getElementById('visit_time').value;
    const exitTime = document.getElementById('exit_time').value;
    if (exitTime <= visitTime) {
        showMsg("خطأ: يجب أن يكون وقت الخروج بعد وقت الدخول.", true);
        return false;
    }

    const productsBody = document.getElementById('productsBody');
    const productCards = productsBody.children;

    if (productCards.length === 0) {
        showMsg("يجب إضافة منتج واحد على الأقل!", true);
        return false;
    }

    let allProductsValid = true;
    Array.from(productCards).forEach((card, index) => {
        const prodName = card.querySelector('.prod-name').value;
        const carton = parseInt(card.querySelector('.prod-carton').value) || 0;
        const packet = parseInt(card.querySelector('.prod-packet').value) || 0;
        
        if (!prodName) {
            showMsg(`خطأ في بطاقة المنتج ${index + 1}: يرجى اختيار اسم المنتج.`, true);
            allProductsValid = false;
        } else if (carton === 0 && packet === 0) {
            showMsg(`خطأ في بطاقة المنتج ${index + 1}: يجب إدخال كمية (كرتون أو باكت) أكبر من الصفر.`, true);
            allProductsValid = false;
        }
    });
    return allProductsValid;
}

function collectRows() {
    const form = document.getElementById('inventoryForm');
    const fd = new FormData(form);
    const commonData = {};
    
    for (let [key, val] of fd.entries()) {
         commonData[key] = val;
    }

    const resultRows = [];
    const productsBody = document.getElementById('productsBody');
    
    productsBody.querySelectorAll('.col-12').forEach(productCard => { 
        const row = { ...commonData };
        
        row.product_name = productCard.querySelector('.prod-name').value;
        row.product_code = productCard.querySelector('.prod-code').value;
        row.product_category = productCard.querySelector('.prod-cat').value;
        row.carton_qty = productCard.querySelector('.prod-carton').value || "0";
        row.packet_qty = productCard.querySelector('.prod-packet').value || "0";
        row.expiry_date = productCard.querySelector('.prod-expiry').value;
        
        resultRows.push(row);
    });
    return resultRows;
}

async function sendRows(rows) {
    let success = 0, failed = 0;
    const total = rows.length;

    for (let row of rows) {
        try {
            const formBody = Object.keys(row).map(key => 
                encodeURIComponent(key) + "=" + encodeURIComponent(row[key])
            ).join("&");

            const res = await fetch(GOOGLE_SCRIPT_URL, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: formBody,
            });
            
            const txt = await res.text();

            if (res.ok && (txt.includes("تم إرسال البيانات") || txt.includes("Success"))) {
                success++;
            } else {
                console.error("خطأ في إرسال صف:", row.product_name, "الاستجابة:", txt);
                failed++;
            }
        } catch (err) {
            console.error("خطأ شبكة/إرسال:", err);
            failed++;
        }
    }

    if (success === total) {
        showMsg(`✅ تم إرسال جميع المنتجات (${success}) بنجاح!`);
        document.getElementById('inventoryForm').reset();
        document.getElementById('productsBody').innerHTML = "";
        addProductRow(); 
    } else if (success > 0 && failed > 0) {
        showMsg(`⚠️ تم إرسال ${success} منتج بنجاح، وحدثت مشكلة في ${failed} منتج. يرجى مراجعة سجل الأخطاء.`, true);
    } else {
        showMsg("❌ لم يتم إرسال أي بيانات بنجاح. حاول مجددًا.", true);
    }
}

// ===================================================
// 6. مستمعات الأحداث الرئيسية والتنفيذ
// ===================================================

document.getElementById('inventoryForm').addEventListener('submit', async function(e){
    e.preventDefault();
    if (!validateForm()) return;
    
    showMsg("⏳ يتم الآن إرسال البيانات، يرجى الانتظار...");
    
    const rows = collectRows();
    await sendRows(rows);
});

// بداية التحميل - يتم استدعاء الدوال عند تحميل الصفحة بالكامل
window.addEventListener('DOMContentLoaded', async function() {
    try {
        // تحميل بيانات المنتجات أولاً، ثم البيانات الأساسية
        await prepareProducts(); 
        await fillSelects(); 
        
        // إضافة أول بطاقة منتج بعد تحميل البيانات
        if (PRODUCTS.length > 0) {
            addProductRow(); 
        } else {
            // هذا يحدث فقط إذا فشل تحميل المنتجات (تم معالجته برسالة في prepareProducts)
            showMsg("❌ فشل في تحميل المنتجات. لن يعمل قسم الجرد.", true);
        }
    } catch (e) {
        // إذا حدث خطأ أثناء تحميل أي JSON، سيتم عرض رسالة الخطأ بالفعل
        console.error("فشل التحميل الأولي للبيانات:", e);
    }
});
