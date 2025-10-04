// إعدادات Google Sheet (رابط السكربت)
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw-lQEIp50L0lf67_tYOX42VBBJH39Yh07A7xxP4k08AfxKkb9L5xFFBinPvpvGA_fI/exec";

// تخزين بيانات المنتجات لمرة واحدة
let PRODUCTS = [];
// ✅ إضافة متغير لتخزين بيانات العملاء للمساعدة في البحث عن الكود
let CUSTOMERS = []; 

/**
 * تحميل بيانات JSON من مسار ملف معين.
 * @param {string} file - مسار ملف JSON.
 * @returns {Promise<Object>} - وعد يحتوي على بيانات JSON.
 */
async function loadJSON(file) {
    const res = await fetch(file);
    if (!res.ok) {
        console.error(`خطأ في تحميل ${file}: ${res.statusText}`);
        throw new Error(`خطأ في تحميل ${file}`);
    }
    return await res.json();
}

/**
 * تعبئة القوائم المنسدلة (المندوبين، المحافظات) وقائمة بيانات العملاء.
 */
async function fillSelects() {
    try {
        // تغيير اسم المتغير المؤقت إلى customersData لتجنب التعارض
        const [salesReps, governorates, customersData] = await Promise.all([
            loadJSON('sales_representatives.json'),
            loadJSON('governorates.json'),
            loadJSON('customers_main.json'),
        ]);

        // ✅ تخزين بيانات العملاء في المتغير العام
        CUSTOMERS = customersData;

        // تعبئة قائمة المندوبين
        const salesRepSelect = document.getElementById('salesRep');
        salesReps.forEach(rep => {
            const opt = new Option(rep.name, rep.name);
            salesRepSelect.appendChild(opt);
        });

        // تعبئة قائمة المحافظات
        const governorateSelect = document.getElementById('governorate');
        governorates.forEach(gov => {
            const opt = new Option(gov.name, gov.name);
            governorateSelect.appendChild(opt);
        });

        // تعبئة قائمة بيانات العملاء (لـ datalist)
        const customersList = document.getElementById('customersList');
        CUSTOMERS.forEach(cust => {
            const opt = document.createElement('option');
            opt.value = cust.name;
            // لا حاجة لـ data-code هنا، سنبحث في مصفوفة CUSTOMERS مباشرة
            customersList.appendChild(opt);
        });

        // ✅ التعديل لحل مشكلة البحث عن الكود باستخدام المصفوفة المخزنة
        document.getElementById('customer').addEventListener('input', function() {
            const name = this.value;
            // البحث عن الكود مباشرة في المصفوفة الأصلية المخزنة CUSTOMERS
            const found = CUSTOMERS.find(c => c.name === name);
            document.getElementById('customer_code').value = found ? found.code : '';
        });
    } catch (err) {
        console.error("خطأ في تحميل البيانات الأساسية:", err);
        showMsg("حدث خطأ في تحميل البيانات الأساسية!", true);
    }
}

/**
 * تحميل بيانات المنتجات وتخزينها في المتغير PRODUCTS.
 */
async function prepareProducts() {
    try {
        PRODUCTS = await loadJSON('products.json');
    } catch (err) {
        console.error("خطأ في تحميل بيانات المنتجات:", err);
        showMsg("حدث خطأ في تحميل بيانات المنتجات!", true);
    }
}

/**
 * إضافة صف جديد لبيانات منتج في الجدول.
 */
function addProductRow() {
    const tbody = document.getElementById('productsBody');
    const tr = document.createElement('tr');
    
    // إعداد قائمة الخيارات المنسدلة للمنتجات
    let options = '<option value="">اختر المنتج...</option>';
    PRODUCTS.forEach(prod => {
        options += `<option value="${prod.name}">${prod.name}</option>`;
    });

    tr.innerHTML = `
        <td><select class="prod-name" required>${options}</select></td>
        <td><input type="text" class="prod-code" readonly></td>
        <td><input type="text" class="prod-cat" readonly></td>
        <td><input type="number" class="prod-carton" min="0" value="0" required></td>
        <td><input type="number" class="prod-packet" min="0" value="0" required></td>
        <td><input type="date" class="prod-expiry"></td>
        <td><button type="button" class="remove-btn" onclick="removeProductRow(this)">حذف</button></td>
    `;
    tbody.appendChild(tr);

    // إضافة مستمع حدث عند اختيار المنتج لملء الكود والفئة تلقائياً
    tr.querySelector('.prod-name').addEventListener('change', function(){
        const name = this.value;
        const prod = PRODUCTS.find(p => p.name === name);
        tr.querySelector('.prod-code').value = prod ? prod.code : '';
        tr.querySelector('.prod-cat').value = prod ? prod.category : '';
    });
}

/**
 * حذف صف منتج من الجدول.
 * @param {HTMLButtonElement} btn - زر الحذف الذي تم النقر عليه.
 */
function removeProductRow(btn) {
    btn.closest('tr').remove();
}

/**
 * عرض رسالة للمستخدم (نجاح أو خطأ).
 * @param {string} msg - محتوى الرسالة.
 * @param {boolean} [error=false] - هل الرسالة خطأ (true) أم نجاح (false).
 */
function showMsg(msg, error = false) {
    const el = document.getElementById('formMsg');
    el.textContent = msg;
    el.className = "msg" + (error ? " error" : " success");
    // إخفاء رسالة النجاح بعد 3 ثوانٍ
    if (!error) setTimeout(() => { el.textContent = ""; el.className = "msg"; }, 3000);
}

/**
 * التحقق من صحة النموذج قبل الإرسال.
 * @returns {boolean} - true إذا كان النموذج صالحًا، false إذا كان غير صالح.
 */
function validateForm() {
    const form = document.getElementById('inventoryForm');
    // التحقق من صلاحية حقول النموذج الرئيسية
    if (!form.checkValidity()) {
        form.reportValidity(); // لعرض رسائل الأخطاء الافتراضية للمتصفح
        return false;
    }
    
    const tbody = document.getElementById('productsBody');
    const productRows = tbody.children;

    // 1. تحقق من وجود منتج واحد على الأقل
    if (productRows.length === 0) {
        showMsg("يجب إضافة منتج واحد على الأقل!", true);
        return false;
    }

    // 2. تحقق من تعبئة جميع بيانات المنتجات المطلوبة
    let allProductsValid = true;
    Array.from(productRows).forEach(tr => {
        const prodName = tr.querySelector('.prod-name').value;
        const carton = tr.querySelector('.prod-carton').value;
        const packet = tr.querySelector('.prod-packet').value;
        
        // التحقق من اختيار المنتج ووجود كمية واحدة على الأقل (كرتون أو حزمة)
        if (!prodName || (!carton && !packet) || (carton === "0" && packet === "0") || (carton === "" && packet === "")) {
            allProductsValid = false;
        }
    });

    if (!allProductsValid) {
        showMsg("تأكد من اختيار المنتج وتحديد كمية واحدة على الأقل (كرتون أو حزمة) لكل صف!", true);
        return false;
    }

    return true;
}

/**
 * تجميع البيانات من النموذج، حيث يتم إنشاء صف إرسال لكل منتج.
 * @returns {Array<Object>} - مصفوفة من كائنات البيانات جاهزة للإرسال.
 */
function collectRows() {
    const form = document.getElementById('inventoryForm');
    const fd = new FormData(form);
    const commonData = {};
    // استخراج بيانات النموذج الرئيسية
    for (let [key, val] of fd.entries()) {
        // تجاهل الحقول الخاصة بالمنتج من FormData الأصلية
        if (!key.startsWith('product_')) {
             commonData[key] = val;
        }
    }

    // تجميع بيانات المنتجات
    const resultRows = [];
    const tbody = document.getElementById('productsBody');
    tbody.querySelectorAll('tr').forEach(tr => {
        // دمج البيانات المشتركة مع بيانات هذا المنتج
        const row = { ...commonData };
        row.product_name = tr.querySelector('.prod-name').value;
        row.product_code = tr.querySelector('.prod-code').value;
        row.product_category = tr.querySelector('.prod-cat').value;
        // التأكد من إرسال "0" إذا كانت الحقل فارغاً
        row.carton_qty = tr.querySelector('.prod-carton').value || "0";
        row.packet_qty = tr.querySelector('.prod-packet').value || "0";
        row.expiry_date = tr.querySelector('.prod-expiry').value;
        resultRows.push(row);
    });
    return resultRows;
}

/**
 * إرسال البيانات إلى Google Sheet لكل صف بيانات على حدة.
 * @param {Array<Object>} rows - مصفوفة من كائنات البيانات للإرسال.
 */
async function sendRows(rows) {
    let success = 0, failed = 0;
    const total = rows.length;

    for (let row of rows) {
        try {
            // تحويل كائن البيانات إلى صيغة x-www-form-urlencoded
            const formBody = Object.keys(row).map(key => 
                encodeURIComponent(key) + "=" + encodeURIComponent(row[key])
            ).join("&");

            const res = await fetch(GOOGLE_SCRIPT_URL, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: formBody,
            });
            
            const txt = await res.text();

            // فحص محتوى الاستجابة
            if (res.ok && (txt.includes("تم إرسال البيانات") || txt.includes("Success"))) {
                success++;
            } else {
                console.error("خطأ في إرسال صف:", row, "الاستجابة:", txt);
                failed++;
            }
        } catch (err) {
            console.error("خطأ شبكة/إرسال:", err);
            failed++;
        }
    }

    // عرض رسالة ملخصة للإرسال
    if (success === total) {
        showMsg(`✅ تم إرسال جميع المنتجات (${success}) بنجاح`);
        // إعادة تعيين النموذج إذا نجح الإرسال بالكامل
        document.getElementById('inventoryForm').reset();
        document.getElementById('productsBody').innerHTML = "";
        addProductRow(); // إضافة صف افتراضي جديد
    } else if (success > 0 && failed > 0) {
        showMsg(`⚠️ تم إرسال ${success} منتج بنجاح، وحدثت مشكلة في ${failed} منتج. يرجى مراجعة سجل الأخطاء.`, true);
    } else {
        showMsg("❌ لم يتم إرسال أي بيانات بنجاح. حاول مجددًا.", true);
    }
}

// ===================================================
//              مستمعات الأحداث الرئيسية
// ===================================================

// عند الإرسال
document.getElementById('inventoryForm').addEventListener('submit', async function(e){
    e.preventDefault();
    if (!validateForm()) return;
    
    showMsg("⏳ يتم الآن إرسال البيانات، يرجى الانتظار...");
    
    const rows = collectRows();
    await sendRows(rows);
});

// بداية التحميل - يتم استدعاء الدوال عند تحميل الصفحة بالكامل
window.addEventListener('DOMContentLoaded', async function() {
    // تحميل البيانات الأساسية (المندوبين، المحافظات، العملاء)
    await fillSelects(); 
    // تحميل بيانات المنتجات
    await prepareProducts(); 
    
    // إضافة أول صف منتج بعد تحميل البيانات
    if (PRODUCTS.length > 0) {
        addProductRow(); // صف افتراضي أول
    }
});
