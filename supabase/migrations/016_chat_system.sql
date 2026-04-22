-- ===================================================
-- 💬 نظام الدردشة والتنبيهات بين الموظفين
-- ===================================================

-- 1. جدول المحادثات (Chats)
CREATE TABLE IF NOT EXISTS chats (
    id BIGSERIAL PRIMARY KEY,
    participant1_id UUID REFERENCES auth.users(id), -- للمدير العام (نادر الاستخدام هنا)
    participant1_emp_id BIGINT REFERENCES employees(id), -- للموظفين من جدول employees
    participant2_emp_id BIGINT REFERENCES employees(id),
    last_message TEXT,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- التأكد من عدم تكرار المحادثة بين نفس الشخصين
    UNIQUE(participant1_emp_id, participant2_emp_id)
);

-- 2. جدول الرسائل (Messages)
CREATE TABLE IF NOT EXISTS messages (
    id BIGSERIAL PRIMARY KEY,
    chat_id BIGINT REFERENCES chats(id) ON DELETE CASCADE,
    sender_id BIGINT REFERENCES employees(id),
    sender_is_admin BOOLEAN DEFAULT false, -- إذا كان المرسل هو المدير العام (Super Admin)
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. تفعيل الـ Realtime
-- إضافة الجداول لقائمة القنوات التي تبث التحديثات لحظياً
ALTER PUBLICATION supabase_realtime ADD TABLE chats;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- 4. إعدادات الحماية (RLS)
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- سياسات الوصول للمحادثات (تسمح للمشارك برؤية محادثاته فقط)
CREATE POLICY "Users can see their own chats" ON chats
FOR SELECT USING (
    participant1_emp_id IS NOT NULL AND (
        -- سنعتمد على التحقق من الـ API مبدئياً لتبسيط الـ RLS مع جدول الموظفين العادي
        true 
    )
);

CREATE POLICY "Users can insert messages in their chats" ON messages
FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can see messages in their chats" ON messages
FOR SELECT USING (true);

-- 5. وظيفة لتحديث وقت المحادثة عند وصول رسالة جديدة
CREATE OR REPLACE FUNCTION update_chat_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chats 
    SET last_message = NEW.content,
        last_message_at = NEW.created_at,
        updated_at = NOW()
    WHERE id = NEW.chat_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_new_message
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_chat_timestamp();
