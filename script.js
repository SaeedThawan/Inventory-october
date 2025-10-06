// script.js - الكود الموحد والنهائي مع كل التحديثات

// ===================================================
// 1. الإعدادات والمتغيرات العالمية
// ===================================================

// 🛑 يرجى التأكد من أن هذا الرابط هو الرابط الصحيح والنهائي بعد النشر
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxkoTCwAy9qWp0yelFhBC1QpXT_cmiE-Kosu5NgdU1rfoSfxVmuEHIlSA2PU_dPshSU/exec"; 

let PRODUCTS = [];
let CUSTOMERS = []; 

// ===================================================
// 2. دوال مساعدة (التاريخ، الرسائل، تحميل JSON)
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
// 3. دوال التعامل مع التلوين الشرطي للتواريخ 🎨
// ===================================================

function updateExpiryColor(inputElement) {
    const expiryDate = new Date(inputElement.value);
    const today = new Date();
    // 3 أشهر
    const threeMonths = new Date();
    threeMonths.setMonth(today.getMonth() + 3);

    // إزالة جميع الفئات السابقة
    inputElement.classList.remove('expiry-red', 'expiry-yellow', 'expiry-green');

    if (isNaN(expiryDate.getTime())) {
        return; 
    }
    
    // لضمان مقارنة اليوم بالتاريخ وليس بالوقت
    today.setHours(0, 0, 0, 0);
    expiryDate.setHours(0, 0, 0, 0);

    // 🔴 أحمر: انتهى أو يتبقى أقل من شهر واحد (30 يوم)
    if (expiryDate.getTime() < today.getTime() || (expiryDate.getTime() - today.getTime()) / (1000 * 3600 * 24) <= 30) {
        inputElement.classList.add('expiry-red');
    } 
    // 🟡 أصفر: يتبقى من شهر إلى ثلاثة أشهر
    else if (expiryDate.getTime() <= threeMonths.getTime()) {
        inputElement.classList.add('expiry-yellow');
    }
    // 🟢 أخضر: يتبقى أكثر من ثلاثة أشهر
    else {
        inputElement.classList.add('expiry-green');
    }
}

// ===================================================
// 4. دوال تحميل البيانات وتعبئة القوائم الرئيسية
// ===================================================

async function fillSelects() {
    try {
        const [salesReps, governorates, customersData] = await Promise.all([
            loadJSON('sales_representatives.json'), 
            loadJSON('governorates.json'), 
            loadJSON('customers_main.json'), 
        ]);

        CUSTOMERS = customersData;
        PRODUCTS = await loadJSON('products.json'); // تحميل المنتجات هنا أيضًا

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
            document.getElementById('customer_code').value = found ? found.Customer_Code : '';
        });
        
    } catch (err) {
        showMsg(err.message + " يرجى التأكد من ملفات JSON.", true);
        throw err; 
    }
}


// ===================================================
// 5. دوال التعامل مع بطاقات المنتجات
// ===================================================

function addProductRow() {
    const productsBody = document.getElementById('productsBody');
    const productCard = document.createElement('div');
    productCard.classList.add('col-12', 'mb-3'); 
    
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

    // ربط الدالة بمدخل اسم المنتج لجلب الكود والفئة
    productCard.querySelector('.prod-name').addEventListener('change', function(){
        const name = this.value;
        const prod = PRODUCTS.find(p => p.Product_Name_AR === name);
        productCard.querySelector('.prod-code').value = prod ? prod.Product_Code : '';
        productCard.querySelector('.prod-cat').value = prod ? prod.Category : '';
    });
    
    // 🛑 ربط دالة التلوين الشرطي بتاريخ الانتهاء
    const expiryInput = productCard.querySelector('.prod-expiry');
    expiryInput.addEventListener('input', function() {
        updateExpiryColor(this);
    });
}

function removeProductRow(btn) {
    const productsBody = document.getElementById('productsBody');
    if (productsBody.children.length > 1) {
         btn.closest('.col-12').remove();
    } else {
        showMsg("يجب أن يبقى منتج واحد على الأقل في القائمة.", true);
    }
}

// ===================================================
// 6. دوال التحقق والإرسال (منطق JSON Body)
// ===================================================

function validateForm() {
    const form = document.getElementById('inventoryForm');
    
    let exitTime = document.getElementById('exit_time').value;
    if (!exitTime) {
        exitTime = formatTime(new Date());
        document.getElementById('exit_time').value = exitTime;
    }

    if (!form.checkValidity()) {
        form.reportValidity();
        return false;
    }

    if (!document.getElementById('customer_code').value) {
        showMsg("يرجى اختيار العميل لتعبئة كود العميل تلقائياً!", true);
        return false;
    }
    
    const visitTime = document.getElementById('visit_time').value;
    if (exitTime <= visitTime) {
        showMsg("خطأ في الأوقات: يجب أن يكون وقت الخروج بعد وقت الدخول.", true);
        return false;
    }

    // 🛑 منطق التحقق من الكميات
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
        } 
        // التحقق من العبوة (ألا تكون الكمية صفراً لكلا الصنفين)
        else if (carton === 0 && packet === 0) {
            showMsg(`خطأ في بطاقة المنتج ${index + 1}: يجب إدخال كمية (كرتون أو باكت) أكبر من الصفر.`, true);
            allProductsValid = false;
        }
    });

    return allProductsValid;
}

// 💡 دالة لتجميع البيانات في كائن JSON واحد (يتضمن مصفوفة المنتجات)
function collectData() {
    const form = document.getElementById('inventoryForm');
    const fd = new FormData(form);
    const data = {};
    const productsArray = [];
    
    // 1. جمع بيانات الزيارة المشتركة
    for (let [key, val] of fd.entries()) {
        data[key] = val;
    }
    
    // 🛑 ضبط أسماء الحقول لتطابق الأعمدة الجديدة/المتوقعة في Sheet
    data.customer = document.getElementById('customer').value;
    // الحقول الإضافية التي قد تكون غير موجودة في النموذج ولكنها مطلوبة في Sheet
    data.address_city = document.getElementById('address_city')?.value || '';
    data.suggestions = document.getElementById('suggestions')?.value || '';
    data.region = document.getElementById('region')?.value || '';
    data.notes = document.getElementById('notes')?.value || ''; 

    // 2. جمع بيانات المنتجات في مصفوفة منفصلة
    document.getElementById('productsBody').querySelectorAll('.col-12').forEach(productCard => { 
        const product = {};
        
        product.product_name = productCard.querySelector('.prod-name').value;
        product.product_code = productCard.querySelector('.prod-code').value;
        product.product_category = productCard.querySelector('.prod-cat').value;
        product.carton_qty = productCard.querySelector('.prod-carton').value || "0";
        product.packet_qty = productCard.querySelector('.prod-packet').value || "0";
        product.expiry_date = productCard.querySelector('.prod-expiry').value;
        
        productsArray.push(product);
    });
    
    // 3. دمج البيانات المشتركة مع مصفوفة المنتجات
    data.products = productsArray;
    
    return data;
}

// 💡 دالة لإرسال طلب POST واحد بجسم JSON
async function sendData(data) {
    try {
        const res = await fetch(GOOGLE_SCRIPT_URL, {
            method: "POST",
            // 🛑 مهم: إرسال JSON Body
            headers: { "Content-Type": "application/json" }, 
            body: JSON.stringify(data), 
        });
        
        // نظرًا لأننا نستخدم Apps Script، نحاول قراءة الرد كنص عادي
        const txt = await res.text();

        if (res.ok && txt.includes("Success")) {
            showMsg(`✅ تم إرسال البيانات بنجاح! (${data.products.length} منتجات)`);
            document.getElementById('inventoryForm').reset();
            document.getElementById('productsBody').innerHTML = "";
            addProductRow(); 
            return true;
        } else {
            console.error("خطأ في الإرسال:", txt);
            showMsg("❌ فشل الإرسال! يرجى مراجعة سجل الأخطاء والتحقق من Apps Script.", true);
            return false;
        }
    } catch (err) {
        console.error("خطأ شبكة/إرسال:", err);
        showMsg("❌ خطأ في الاتصال بالشبكة أو بخادم Google Apps Script.", true);
        return false;
    }
}


document.getElementById('inventoryForm').addEventListener('submit', async function(e){
    e.preventDefault();
    if (!validateForm()) return;
    
    showMsg("⏳ يتم الآن إرسال البيانات، يرجى الانتظار...");
    
    const dataToSend = collectData();
    await sendData(dataToSend);
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
        document.getElementById('exit_time').value = initialTime; // يتم تعيين وقت الخروج مبدئيا نفس وقت الدخول

        // 2. تحميل البيانات
        await fillSelects(); 
        
        // 3. إضافة أول بطاقة منتج
        if (PRODUCTS.length > 0) {
            addProductRow(); 
        }
    } catch (e) {
        console.error("فشل التحميل الأولي للبيانات:", e);
    }
    
    // ربط زر الإضافة بالدالة
    document.getElementById('addProductBtn')?.addEventListener('click', addProductRow);
});
