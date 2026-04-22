-- ===================================================
-- إضافة نظام الصلاحيات والأدوار والمسميات الوظيفية
-- ===================================================

-- 1. إضافة الحقول الجديدة لجدول الموظفين
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'staff',
ADD COLUMN IF NOT EXISTS job_title TEXT,
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS is_system_user BOOLEAN DEFAULT false;

-- 2. تحديث جميع الموظفين النشطين ليكونوا مستخدمين للنظام (ليظهروا في صفحة الإدارة)
UPDATE employees 
SET is_system_user = true,
    permissions = COALESCE(permissions, '["/employee/inventory"]')::jsonb
WHERE is_active = true;

-- الموظفين الذين ليس لديهم دور، نعطيهم دور 'staff' كبداية
UPDATE employees SET role = 'staff' WHERE role IS NULL;

-- 3. (إضافي) تأكد من أن الـ RLS يسمح للأدمن برؤية وتعديل هذه الحقول
-- العبارات الحالية في Migration 002 تسمح بالوصول الكامل
