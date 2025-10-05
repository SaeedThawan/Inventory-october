// script.js - الكود الكامل والنهائي

// ===================================================
// 1. الإعدادات والمتغيرات العالمية
// ===================================================

// 🛑 تأكد من تحديث هذا الرابط برابط Web App الجديد والنهائي بعد النشر
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw-lQEIp50L0lf67_tYOX42VBBJH39Yh07A7xxP4k08AfxKkb9L5xFFBinPvpvGA_fI/exec"; 

let PRODUCTS = [];
let CUSTOMERS = []; 

// ===================================================
// 2. دوال مساعدة
// ===================================================

function formatTime(date) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

async function loadJSON(file) {
    try {
        const res = await fetch(file, {cache: "no-store"}); 
        if (!res.ok) {
            throw new Error(`لم يتم العثور على الملف: ${file}`);
        }
        const data = await res.json();
        if (!Array.isArray(data)) {
            throw new Error(`خطأ: تنسيق البيانات في ${file} غير صحيح (ليس مصفوفة).`);
        }
        return data;
    } catch (error) {
        console.error(`FATAL ERROR loading ${file}:`, error);
        throw new Error(`فشل حاسم في تحميل البيانات من ${file}.`);
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

        // تعبئة المندوبين والمحافظات
        const salesRepSelect = document.getElementById('salesRep');
        salesReps.forEach(repName => {
            salesRepSelect.appendChild(new Option(repName, repName));
        });

        const governorateSelect = document.getElementById('governorate');
        governorates.forEach(govName => {
            governorateSelect.appendChild(new Option(govName, govName));
        });

        // تعبئة قائمة العملاء
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
            // يتم تحديث الحقل المخفي (customer_code)
            document.getElementById('customer_code').value = found ? found.Customer_Code : '';
        });
        
    } catch (err) {
        showMsg(err.message + " يرجى التأكد من ملفات JSON.", true);
        throw err; 
    }
}

async function prepareProducts() {
    try {
        PRODUCTS = await loadJSON('products.json');
    } catch (err) {
        showMsg(err.message + " يرجى التأكد من ملف products.json.", true);
        throw err;
    }
}

// ===================================================
// 4. دوال التعامل مع بطاقات المنتجات
// ===================================================

function addProductRow() {
    const productsBody = document.getElementById('productsBody');
    const productCard = document.createElement('div');
    productCard.classList.add('col-12'); 
    
    let options = '<option value="">اختر المنتج...</option>';
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
                        <input type="date" class="prod-expiry form-control form-control-sm" required>
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
    // يجب أن يبقى صف واحد على الأقل لمنع الإرسال الخاطئ
    const productsBody = document.getElementById('productsBody');
    if (productsBody.children.length > 1) {
         btn.closest('.col-12').remove();
    } else {
        showMsg("يجب أن يبقى منتج واحد على الأقل في القائمة.", true);
    }
}

// ===================================================
// 5. دوال التحقق والإرسال
// ===================================================

function validateForm() {
    const form = document.getElementById('inventoryForm');
    
    // 1. إذا كان وقت الخروج فارغاً، يتم تعبئته تلقائياً بالوقت الحالي
    let exitTime = document.getElementById('exit_time').value;
    if (!exitTime) {
        exitTime = formatTime(new Date());
        document.getElementById('exit_time').value = exitTime;
    }

    // 2. التحقق من صلاحية حقول النموذج الرئيسية
    if (!form.checkValidity()) {
        form.reportValidity();
        return false;
    }

    // 3. التحقق من وجود كود العميل
    if (!document.getElementById('customer_code').value) {
        showMsg("يرجى اختيار العميل لتعبئة كود العميل تلقائياً!", true);
        return false;
    }
    
    // 4. التحقق من تسلسل الأوقات
    const visitTime = document.getElementById('visit_time').value;

    if (exitTime <= visitTime) {
        showMsg("خطأ في الأوقات: يجب أن يكون وقت الخروج بعد وقت الدخول.", true);
        return false;
    }

    // 5. التحقق من تعبئة جميع بيانات المنتجات المطلوبة
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

// 💡 هذه الدالة تجمع البيانات في مصفوفة صفوف (كل صف هو كائن)
function collectRows() {
    const form = document.getElementById('inventoryForm');
    const fd = new FormData(form);
    const commonData = {};
    
    // جمع البيانات المشتركة من النموذج (governorate, visit_date, etc.)
    for (let [key, val] of fd.entries()) {
        commonData[key] = val;
    }

    const resultRows = [];
    const productsBody = document.getElementById('productsBody');
    
    // إنشاء صف منفصل لكل بطاقة منتج
    productsBody.querySelectorAll('.col-12').forEach(productCard => { 
        const row = { ...commonData };
        
        // 🛑 إضافة اسم العميل (مطلوب لورقة Sheet)
        row.customer = document.getElementById('customer').value; 
        
        // إضافة تفاصيل المنتج الفريدة
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

// 💡 هذه الدالة ترسل كل صف كطلب POST منفصل
async function sendRows(rows) {
    let success = 0, failed = 0;
    const total = rows.length;

    for (let row of rows) {
        try {
            // تحويل الكائن (الصف) إلى صيغة URLSearchParams (application/x-www-form-urlencoded)
            const formBody = Object.keys(row).map(key => 
                encodeURIComponent(key) + "=" + encodeURIComponent(row[key])
            ).join("&");

            const res = await fetch(GOOGLE_SCRIPT_URL, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: formBody,
            });
            
            const txt = await res.text();

            if (res.ok && txt.includes("Success")) {
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
        // 1. تسجيل التاريخ ووقت الدخول التلقائي (وقت فتح الرابط)
        const now = new Date();
        const initialTime = formatTime(now);
        const initialDate = formatDate(now);
        
        document.getElementById('visit_time').value = initialTime;
        document.getElementById('visit_date').value = initialDate;

        // 2. تحميل البيانات
        await prepareProducts(); 
        await fillSelects(); 
        
        // 3. إضافة أول بطاقة منتج
        if (PRODUCTS.length > 0) {
            addProductRow(); 
        }
    } catch (e) {
        console.error("فشل التحميل الأولي للبيانات:", e);
    }
});
