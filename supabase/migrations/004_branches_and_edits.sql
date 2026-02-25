-- ===================================================
-- إضافة دعم الفروع وتعديلات الموظفين
-- ===================================================

-- 1. إضافة عمود الفرع لجدول عمليات الجرد
-- الافتراضي 'Suzz 1' للبيانات القديمة
ALTER TABLE inventory_counts ADD COLUMN IF NOT EXISTS branch TEXT DEFAULT 'Suzz 1';

-- 2. التأكد من أن عمود الفرع لا يقبل قيم فارغة في المستقبل
-- سيتم تحديد 'Suzz 1' أو 'Suzz 2' من الواجهة
UPDATE inventory_counts SET branch = 'Suzz 1' WHERE branch IS NULL;
ALTER TABLE inventory_counts ALTER COLUMN branch SET NOT NULL;

-- 3. السماح بتحديث باسوورد الموظفين (مفعل بالفعل عبر RLS الخدمة)
-- لا توجد حاجة لتعديلات SQL إضافية للموظفين حالياً
