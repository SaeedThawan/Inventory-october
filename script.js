// script.js

// ===================================================
// 1. الإعدادات والمتغيرات العالمية
// ===================================================

// ضع رابط Google Script الخاص بك هنا
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw-lQEIp50L0lf67_tYOX42VBBJH39Yh07A7xxP4k08AfxKkb9L5xFFBinPvpvGA_fI/exec";

// متغيرات لتخزين البيانات التي تم تحميلها
let PRODUCTS = [];
let CUSTOMERS = []; 

// ===================================================
// 2. دوال مساعدة (تحميل وعرض رسائل)
// ===================================================

/**
 * تحميل بيانات JSON من مسار ملف معين.
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
 * عرض رسالة للمستخدم (نجاح أو خطأ).
 */
function showMsg(msg, error = false) {
    const el = document.getElementById('formMsg');
    el.textContent = msg;
    el.className = "msg" + (error ? " error" : " success");
    el.style.display = 'block';
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (!error) {
        // إخفاء رسالة النجاح بعد 5 ثوانٍ
        setTimeout(() => { el.style.display = 'none'; }, 5000);
    }
}

// ===================================================
// 3. دوال تحميل البيانات وتعبئة القوائم
// ===================================================

/**
 * تعبئة القوائم المنسدلة (المندوبين، المحافظات) وقائمة بيانات العملاء.
 */
async function fillSelects() {
    try {
        // تحميل جميع البيانات الأساسية بالتوازي
        const [salesReps, governorates, customersData] = await Promise.all([
            loadJSON('sales_representatives.json'), // مصفوفة سلاسل نصية [ "احمد المريسي", ... ]
            loadJSON('governorates.json'),         // مصفوفة سلاسل نصية [ "الرياض", ... ]
            loadJSON('customers_main.json'),       // مصفوفة كائنات { "Customer_Name_AR": ..., "Customer_Code": ... }
        ]);

        CUSTOMERS = customersData;

        // تعبئة قائمة المندوبين (تتعامل مع مصفوفة السلاسل النصية)
        const salesRepSelect = document.getElementById('salesRep');
        salesReps.forEach(repName => {
            const opt = new Option(repName, repName); 
            salesRepSelect.appendChild(opt);
        });

        // تعبئة قائمة المحافظات (تتعامل مع مصفوفة السلاسل النصية)
        const governorateSelect = document.getElementById('governorate');
        governorates.forEach(govName => {
            const opt = new Option(govName, govName); 
            governorateSelect.appendChild(opt);
        });

        // تعبئة قائمة بيانات العملاء (لـ datalist)
        const customersList = document.getElementById('customersList');
        CUSTOMERS.forEach(cust => {
            const opt = document.createElement('option');
            // 💡 استخدام اسم الخاصية الصحيح من JSON
            opt.value = cust.Customer_Name_AR; 
            customersList.appendChild(opt);
        });

        // ربط حقل العميل بجلب الكود
        document.getElementById('customer').addEventListener('input', function() {
            const name = this.value;
            // 💡 البحث عن العميل بالاسم الصحيح وإخراج الكود الصحيح
            const found = CUSTOMERS.find(c => c.Customer_Name_AR === name);
            document.getElementById('customer_code').value = found ? found.Customer_Code : '';
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
        PRODUCTS = await loadJSON('products.json'); // مصفوفة كائنات { "Product_Name_AR": ..., "Product_Code": ..., "Category": ... }
    } catch (err) {
        console.error("خطأ في تحميل بيانات المنتجات:", err);
        showMsg("حدث خطأ في تحميل بيانات المنتجات!", true);
    }
}

// ===================================================
// 4. دوال التعامل مع جدول المنتجات
// ===================================================

/**
 * إضافة صف جديد لبيانات منتج في الجدول.
 */
function addProductRow() {
    const tbody = document.getElementById('productsBody');
    const tr = document.createElement('tr');
    
    // إعداد قائمة الخيارات المنسدلة للمنتجات
    let options = '<option value="">اختر المنتج...</option>';
    PRODUCTS.forEach(prod => {
        // 💡 استخدام اسم الخاصية الصحيح من JSON لاسم المنتج
        options += `<option value="${prod.Product_Name_AR}">${prod.Product_Name_AR}</option>`;
    });

    tr.innerHTML = `
        <td><select class="prod-name" required>${options}</select></td>
        <td><input type="text" class="prod-code" readonly placeholder="الكود"></td>
        <td><input type="text" class="prod-cat" readonly placeholder="الفئة"></td>
        <td><input type="number" class="prod-carton" min="0" value="0" required></td>
        <td><input type="number" class="prod-packet" min="0" value="0" required></td>
        <td><input type="date" class="prod-expiry"></td>
        <td><button type="button" class="delete-btn remove-btn" onclick="removeProductRow(this)">حذف</button></td>
    `;
    tbody.appendChild(tr);

    // إضافة مستمع حدث عند اختيار المنتج لملء الكود والفئة تلقائياً
    tr.querySelector('.prod-name').addEventListener('change', function(){
        const name = this.value;
        // 💡 البحث عن المنتج بالاسم الصحيح
        const prod = PRODUCTS.find(p => p.Product_Name_AR === name);
        // 💡 إخراج الكود والفئة بالأسماء الصحيحة
        tr.querySelector('.prod-code').value = prod ? prod.Product_Code : '';
        tr.querySelector('.prod-cat').value = prod ? prod.Category : '';
    });
}

/**
 * حذف صف منتج من الجدول.
 */
function removeProductRow(btn) {
    btn.closest('tr').remove();
}

// ===================================================
// 5. دوال التحقق وتجميع البيانات
// ===================================================

/**
 * التحقق من صحة النموذج قبل الإرسال.
 */
function validateForm() {
    const form = document.getElementById('inventoryForm');
    
    // 1. التحقق من صلاحية حقول النموذج الرئيسية (HTML5 validation)
    if (!form.checkValidity()) {
        form.reportValidity();
        return false;
    }

    // 2. التحقق من وجود كود العميل (للتأكد من اختيار العميل من القائمة)
    if (!document.getElementById('customer_code').value) {
        showMsg("يرجى اختيار العميل من قائمة البحث للتأكد من ربط كود العميل!", true);
        return false;
    }
    
    // 3. التحقق من الأوقات
    const visitTime = document.getElementById('visit_time').value;
    const exitTime = document.getElementById('exit_time').value;
    if (exitTime <= visitTime) {
        showMsg("خطأ: يجب أن يكون وقت الخروج بعد وقت الدخول.", true);
        return false;
    }

    // 4. التحقق من تعبئة جميع بيانات المنتجات المطلوبة
    const tbody = document.getElementById('productsBody');
    const productRows = tbody.children;

    if (productRows.length === 0) {
        showMsg("يجب إضافة منتج واحد على الأقل!", true);
        return false;
    }

    let allProductsValid = true;
    Array.from(productRows).forEach((tr, index) => {
        const prodName = tr.querySelector('.prod-name').value;
        const carton = parseInt(tr.querySelector('.prod-carton').value) || 0;
        const packet = parseInt(tr.querySelector('.prod-packet').value) || 0;
        
        if (!prodName) {
            showMsg(`خطأ في الصف ${index + 1}: يرجى اختيار اسم المنتج.`, true);
            allProductsValid = false;
        } else if (carton === 0 && packet === 0) {
            showMsg(`خطأ في الصف ${index + 1}: يجب إدخال كمية (كرتون أو باكت) أكبر من الصفر.`, true);
            allProductsValid = false;
        }
    });

    return allProductsValid;
}

/**
 * تجميع البيانات من النموذج، حيث يتم إنشاء صف إرسال لكل منتج.
 */
function collectRows() {
    const form = document.getElementById('inventoryForm');
    const fd = new FormData(form);
    const commonData = {};
    
    // استخراج بيانات النموذج الرئيسية (باستثناء حقول المنتجات)
    for (let [key, val] of fd.entries()) {
         commonData[key] = val;
    }

    // تجميع بيانات المنتجات
    const resultRows = [];
    const tbody = document.getElementById('productsBody');
    tbody.querySelectorAll('tr').forEach(tr => {
        const row = { ...commonData };
        row.product_name = tr.querySelector('.prod-name').value;
        row.product_code = tr.querySelector('.prod-code').value;
        row.product_category = tr.querySelector('.prod-cat').value;
        row.carton_qty = tr.querySelector('.prod-carton').value || "0";
        row.packet_qty = tr.querySelector('.prod-packet').value || "0";
        row.expiry_date = tr.querySelector('.prod-expiry').value;
        resultRows.push(row);
    });
    return resultRows;
}

/**
 * إرسال البيانات إلى Google Sheet لكل صف بيانات على حدة.
 */
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

    // عرض رسالة ملخصة نهائية
    if (success === total) {
        showMsg(`✅ تم إرسال جميع المنتجات (${success}) بنجاح!`);
        // إعادة تعيين النموذج بعد الإرسال الكامل
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
// 6. مستمعات الأحداث الرئيسية
// ===================================================

// معالج إرسال النموذج
document.getElementById('inventoryForm').addEventListener('submit', async function(e){
    e.preventDefault();
    if (!validateForm()) return;
    
    showMsg("⏳ يتم الآن إرسال البيانات، يرجى الانتظار...");
    
    const rows = collectRows();
    await sendRows(rows);
});

// بداية التحميل - يتم استدعاء الدوال عند تحميل الصفحة بالكامل
window.addEventListener('DOMContentLoaded', async function() {
    // تحميل بيانات المنتجات أولاً، ثم البيانات الأساسية (لا يهم الترتيب كثيراً هنا)
    await prepareProducts(); 
    await fillSelects(); 
    
    // إضافة أول صف منتج بعد تحميل البيانات
    if (PRODUCTS.length > 0) {
        addProductRow(); 
    } else {
        showMsg("❌ لا يمكن إضافة منتجات، لم يتم تحميل قائمة المنتجات!", true);
    }
});
