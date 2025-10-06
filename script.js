/* الخط الأساسي */
body {
    font-family: 'Arial', sans-serif;
    background-color: #f8f9fa;
}

/* الرسائل (نجاح / خطأ) */
.msg {
    padding: 15px;
    margin-bottom: 20px;
    border-radius: 8px;
    text-align: center;
    font-weight: bold;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.msg.success {
    background-color: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
}

.msg.error {
    background-color: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
}

/* البطاقة الرئيسية */
.card {
    border-radius: 15px;
}

/* بطاقات المنتجات */
.product-card {
    transition: transform 0.2s, box-shadow 0.2s;
    border-radius: 12px;
    border-left: 5px solid var(--bs-primary);
    background-color: #fff;
}

/* تأثير عند المرور */
.product-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15) !important;
}

/* زر إضافة منتج */
.add-product-btn {
    border-radius: 20px;
    font-weight: bold;
}

/* الحقول داخل بطاقة المنتج */
.product-card .form-control,
.product-card .form-select {
    font-size: 0.95rem;
}

/* الحقول للقراءة فقط */
.product-card input[readonly] {
    background-color: #f8f9fa;
    color: #6c757d;
    font-weight: bold;
}

/* نافذة التأكيد قبل الإرسال */
#confirmModal .modal-content {
    border-radius: 12px;
}

#confirmModal h5 {
    color: #0d6efd;
    font-weight: bold;
}
