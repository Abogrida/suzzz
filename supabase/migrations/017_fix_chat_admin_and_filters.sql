-- ===================================================
-- 🛠️ إصلاح نظام الدردشة ليدعم حساب الأدمن والفلاتر
-- ===================================================

-- 1. تعديل جدول الرسائل (Messages)
-- السماح بـ NULL في sender_id لأن الأدمن العام (ID: 0) ليس موظفاً
ALTER TABLE messages ALTER COLUMN sender_id DROP NOT NULL;

-- 2. تعديل جدول المحادثات (Chats)
-- حذف القيد القديم وإضافة قيد جديد يسمح بوجود NULL في أحد الطرفين (إذا كان الطرف هو الأدمن)
ALTER TABLE chats DROP CONSTRAINT IF EXISTS chats_participant1_emp_id_participant2_emp_id_key;

-- سنعتمد على منطق الـ API لضمان التفرد، أو نستخدم قيداً ذكياً
-- إذا كان participant1_emp_id فارغاً، فهذا يعني أنه "الأدمن"
CREATE UNIQUE INDEX IF NOT EXISTS idx_chat_admin_emp ON chats (participant2_emp_id) WHERE participant1_emp_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_chat_emp_emp ON chats (participant1_emp_id, participant2_emp_id) WHERE participant1_emp_id IS NOT NULL;

-- 3. تحديث صلاحيات الـ RLS للمدير العام
-- السماح للمسؤولين برؤية كل شيء (تعديل السياسات الحالية)
DROP POLICY IF EXISTS "Users can see their own chats" ON chats;
CREATE POLICY "Users and Admin can see chats" ON chats
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can see messages in their chats" ON messages;
CREATE POLICY "Users and Admin can see messages" ON messages
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert messages in their chats" ON messages;
CREATE POLICY "Users and Admin can insert messages" ON messages
FOR INSERT WITH CHECK (true);
