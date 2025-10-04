/**
 * إضافة بطاقة منتج جديدة بتصميم أنيق ومرن.
 */
function addProductRow() {
    const productsBody = document.getElementById('productsBody');
    // نستخدم div.col-12 بدلاً من tr
    const productCard = document.createElement('div');
    productCard.classList.add('col-12'); 
    
    // إعداد قائمة الخيارات المنسدلة للمنتجات
    let options = '<option value="">اختر المنتج...</option>';
    PRODUCTS.forEach(prod => {
        // تم تفعيل البحث السريع للنواتج عبر <select>
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

    // إضافة مستمع حدث عند اختيار المنتج
    productCard.querySelector('.prod-name').addEventListener('change', function(){
        const name = this.value;
        const prod = PRODUCTS.find(p => p.Product_Name_AR === name);
        productCard.querySelector('.prod-code').value = prod ? prod.Product_Code : '';
        productCard.querySelector('.prod-cat').value = prod ? prod.Category : '';
    });
}
