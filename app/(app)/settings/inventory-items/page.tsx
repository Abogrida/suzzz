'use client';

import { useState, useEffect } from 'react';
import { Settings, Save, Plus, Trash2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error'; onClose: () => void }) {
    useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
    return <div className={type === 'success' ? 'toast-success' : 'toast-error'}>{msg}</div>;
}

export default function InventoryItemsSettingsPage() {
    const [hotItems, setHotItems] = useState<string[]>([]);
    const [coldItems, setColdItems] = useState<string[]>([]);
    const [newHotItem, setNewHotItem] = useState('');
    const [newColdItem, setNewColdItem] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        fetch('/api/settings/inventory-items')
            .then(res => res.json())
            .then(data => {
                if (data.hot) setHotItems(data.hot);
                if (data.cold) setColdItems(data.cold);
            })
            .catch(() => {
                setToast({ msg: 'فشل تحميل الأصناف', type: 'error' });
            })
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/settings/inventory-items', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hot: hotItems, cold: coldItems })
            });

            if (res.ok) {
                setToast({ msg: 'تم حفظ الأصناف بنجاح', type: 'success' });
            } else {
                const data = await res.json();
                setToast({ msg: data.error || 'حدث خطأ أثناء الحفظ', type: 'error' });
            }
        } catch {
            setToast({ msg: 'حدث خطأ في الاتصال بالسيرفر', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const addHotItem = () => {
        const item = newHotItem.trim();
        if (!item) return;
        if (hotItems.includes(item)) {
            setToast({ msg: 'هذا الصنف موجود مسبقاً', type: 'error' });
            return;
        }
        setHotItems([...hotItems, item]);
        setNewHotItem('');
    };

    const addColdItem = () => {
        const item = newColdItem.trim();
        if (!item) return;
        if (coldItems.includes(item)) {
            setToast({ msg: 'هذا الصنف موجود مسبقاً', type: 'error' });
            return;
        }
        setColdItems([...coldItems, item]);
        setNewColdItem('');
    };

    const removeHotItem = (index: number) => {
        setHotItems(hotItems.filter((_, i) => i !== index));
    };

    const removeColdItem = (index: number) => {
        setColdItems(coldItems.filter((_, i) => i !== index));
    };

    if (loading) {
        return (
            <div className="page-content flex items-center justify-center min-h-[50vh]">
                <div className="spinner w-8 h-8 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="page-content">
            {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
            
            <div className="page-header flex items-center gap-4">
                <Link href="/settings" className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors shadow-sm">
                    <ArrowRight className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="page-title mb-1">إعدادات أصناف الجرد</h1>
                    <p className="text-gray-500 text-sm">التحكم في الأصناف التي تظهر للموظفين في شاشة الجرد اليومي</p>
                </div>
                <div className="mr-auto">
                    <button onClick={handleSave} disabled={saving} className="btn btn-primary">
                        {saving ? <div className="spinner" /> : <><Save className="w-4 h-4" /> حفظ التغييرات</>}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Hot Items */}
                <div className="card flex flex-col h-[calc(100vh-200px)]">
                    <div className="flex items-center gap-3 mb-4 flex-shrink-0">
                        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                            <span className="text-xl">🔥</span>
                        </div>
                        <h2 className="font-bold text-gray-800 text-lg">المشروبات الساخنة</h2>
                        <span className="mr-auto bg-gray-100 text-gray-600 px-3 py-1 rounded-lg font-bold text-sm">
                            {hotItems.length}
                        </span>
                    </div>

                    <div className="flex gap-2 mb-4 flex-shrink-0">
                        <input
                            type="text"
                            className="form-input flex-1"
                            placeholder="اسم الصنف الجديد..."
                            value={newHotItem}
                            onChange={(e) => setNewHotItem(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addHotItem()}
                        />
                        <button onClick={addHotItem} className="btn bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-4 flex items-center justify-center transition-colors">
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 custom-scrollbar">
                        {hotItems.map((item, i) => (
                            <div key={`${item}-${i}`} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-xl group hover:border-orange-200 transition-colors">
                                <span className="font-bold text-gray-700">{item}</span>
                                <button
                                    onClick={() => removeHotItem(i)}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        {hotItems.length === 0 && (
                            <div className="text-center p-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                                لا توجد أصناف
                            </div>
                        )}
                    </div>
                </div>

                {/* Cold Items */}
                <div className="card flex flex-col h-[calc(100vh-200px)]">
                    <div className="flex items-center gap-3 mb-4 flex-shrink-0">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                            <span className="text-xl">🧊</span>
                        </div>
                        <h2 className="font-bold text-gray-800 text-lg">المشروبات الباردة</h2>
                        <span className="mr-auto bg-gray-100 text-gray-600 px-3 py-1 rounded-lg font-bold text-sm">
                            {coldItems.length}
                        </span>
                    </div>

                    <div className="flex gap-2 mb-4 flex-shrink-0">
                        <input
                            type="text"
                            className="form-input flex-1"
                            placeholder="اسم الصنف الجديد..."
                            value={newColdItem}
                            onChange={(e) => setNewColdItem(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addColdItem()}
                        />
                        <button onClick={addColdItem} className="btn bg-blue-500 hover:bg-blue-600 text-white rounded-xl px-4 flex items-center justify-center transition-colors">
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 custom-scrollbar">
                        {coldItems.map((item, i) => (
                            <div key={`${item}-${i}`} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-xl group hover:border-blue-200 transition-colors">
                                <span className="font-bold text-gray-700">{item}</span>
                                <button
                                    onClick={() => removeColdItem(i)}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        {coldItems.length === 0 && (
                            <div className="text-center p-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                                لا توجد أصناف
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: #cbd5e1;
                    border-radius: 20px;
                }
                .custom-scrollbar:hover::-webkit-scrollbar-thumb {
                    background-color: #94a3b8;
                }
            `}</style>
        </div>
    );
}
