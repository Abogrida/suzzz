'use client';
import { useEffect, useState, useRef } from 'react';
import { Plus, Search, Trash2, Edit2, Loader2, ChefHat, X, ChevronDown, ChevronUp, Type, Package, Check, Keyboard, Copy, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

type RecipeItem = {
    id?: number;
    product_id: string | null;
    manual_name: string | null;
    quantity: number;
    unit: string;
    products?: { name: string; unit: string };
};

type MenuItem = {
    id: number;
    name: string;
    category: string;
    price: number;
    description: string;
    recipe_items: RecipeItem[];
};

type InventoryProduct = {
    id: string;
    name: string;
    unit: string;
};

// --- Sub-component: Searchable Product Selector ---
function ProductSearchSelector({
    inventory,
    value,
    onChange,
    onSelectManual
}: {
    inventory: InventoryProduct[],
    value: string | null,
    onChange: (id: string) => void,
    onSelectManual: () => void
}) {
    const [search, setSearch] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedProduct = inventory.find(p => p.id.toString() === value?.toString());
    const displayValue = selectedProduct ? selectedProduct.name : search;

    const filtered = inventory.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase())
    ).slice(0, 8);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setSearch('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
            <div
                onClick={() => setIsOpen(true)}
                style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: '#fff', border: '1.5px solid #e2e8f0',
                    borderRadius: 12, padding: '0 12px', height: 42,
                    cursor: 'text'
                }}
            >
                <Search size={16} color="#94a3b8" />
                <input
                    type="text"
                    placeholder="ابحث عن منتج..."
                    value={isOpen ? search : (selectedProduct?.name || '')}
                    onChange={(e) => { setSearch(e.target.value); setIsOpen(true); }}
                    onFocus={() => setIsOpen(true)}
                    style={{
                        border: 'none', outline: 'none', width: '100%',
                        fontSize: 14, fontWeight: 600, color: '#1e293b', background: 'transparent'
                    }}
                />
            </div>

            {isOpen && (
                <div style={{
                    position: 'absolute', top: '110%', right: 0, left: 0,
                    background: '#fff', borderRadius: 12, boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                    zIndex: 50, overflow: 'hidden', border: '1px solid #e2e8f0'
                }}>
                    <div style={{ maxHeight: 250, overflowY: 'auto' }}>
                        {filtered.map(p => (
                            <div
                                key={p.id}
                                onClick={() => { onChange(p.id); setIsOpen(false); setSearch(''); }}
                                style={{
                                    padding: '10px 16px', cursor: 'pointer', fontSize: 13,
                                    fontWeight: 600, color: '#334155', borderBottom: '1px solid #f1f5f9',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                                <span>{p.name}</span>
                                <span style={{ fontSize: 11, color: '#94a3b8' }}>{p.unit}</span>
                            </div>
                        ))}
                        {filtered.length === 0 && search && (
                            <div style={{ padding: 16, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                                لا توجد نتائج
                            </div>
                        )}
                        <div
                            onClick={onSelectManual}
                            style={{
                                padding: '12px 16px', background: '#fffbeb', color: '#d97706',
                                fontSize: 13, fontWeight: 800, cursor: 'pointer', textAlign: 'center',
                                borderTop: '1px solid #fef3c7'
                            }}
                        >
                            ✍️ إضافة كـ "إدخال يدوي"
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function RecipesPage() {
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [inventory, setInventory] = useState<InventoryProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<Partial<MenuItem> | null>(null);
    const [expandedItem, setExpandedItem] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>('');

    useEffect(() => {
        fetchData();
        fetchInventory();
    }, []);

    const fetchData = async () => {
        try {
            const res = await fetch('/api/recipes');
            const data = await res.json();
            setMenuItems(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching recipes:', error);
            setLoading(false);
        }
    };

    const fetchInventory = async () => {
        try {
            const res = await fetch('/api/products?warehouse=all');
            const data = await res.json();
            setInventory(data);
        } catch (error) {
            console.error('Error fetching inventory:', error);
        }
    };

    const handleSave = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!editingItem?.name || saving) return;

        setSaving(true);
        try {
            const res = await fetch('/api/recipes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...editingItem,
                    items: editingItem.recipe_items
                }),
            });
            if (res.ok) {
                setShowModal(false);
                fetchData();
            }
        } catch (error) {
            console.error('Error saving recipe:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
        try {
            const res = await fetch(`/api/recipes/${id}`, { method: 'DELETE' });
            if (res.ok) fetchData();
        } catch (error) {
            console.error('Error deleting recipe:', error);
        }
    };

    const handleDuplicate = (item: MenuItem) => {
        // Clone the item without the ID to trigger a "Create" rather than "Update"
        const clonedItem: Partial<MenuItem> = {
            ...item,
            id: undefined,
            name: `${item.name} (نسخة)`,
            recipe_items: item.recipe_items.map(ri => ({
                ...ri,
                id: undefined // Also clear recipe item IDs if they exist
            }))
        };
        setEditingItem(clonedItem);
        setShowModal(true);
    };

    const addRecipeItem = () => {
        const newItem: RecipeItem = { product_id: null, manual_name: '', quantity: 1, unit: '' };
        setEditingItem(prev => ({
            ...prev!,
            recipe_items: [...(prev?.recipe_items || []), newItem]
        }));
    };

    const updateRecipeItem = (index: number, field: keyof RecipeItem, value: any) => {
        const newItems = [...(editingItem?.recipe_items || [])];
        newItems[index] = { ...newItems[index], [field]: value };

        if (field === 'product_id' && value) {
            const prod = inventory.find(p => p.id.toString() === value.toString());
            if (prod) {
                newItems[index].unit = prod.unit;
                newItems[index].manual_name = null;
            }
        }

        setEditingItem(prev => ({ ...prev!, recipe_items: newItems }));
    };

    const removeRecipeItem = (index: number) => {
        const newItems = (editingItem?.recipe_items || []).filter((_, i) => i !== index);
        setEditingItem(prev => ({ ...prev!, recipe_items: newItems }));
    };

    const filteredItems = menuItems.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
            item.category.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = selectedCategory === '' || item.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const uniqueCategories = Array.from(new Set(menuItems.map(item => item.category).filter(Boolean)));

    const exportToExcel = () => {
        const worksheetData: any[] = [];

        // Main Title Header
        worksheetData.push(["تقرير الوصفات (الريسبي) الشامل"]);
        worksheetData.push(["تاريخ التصدير:", new Date().toLocaleDateString('ar-EG')]);
        worksheetData.push([]);

        // Sort items by category
        const sortedItems = [...menuItems].sort((a, b) =>
            (a.category || "").localeCompare(b.category || "")
        );

        let currentCategory = "";

        sortedItems.forEach((item, itemIndex) => {
            // Category Divider
            if (item.category !== currentCategory) {
                currentCategory = item.category || "بدون فئة";
                worksheetData.push([]);
                worksheetData.push([`📁 القسم: ${currentCategory}`]);
                worksheetData.push(["--------------------------------------------------"]);
            }

            // Compact Product Header
            worksheetData.push([`المنتج (${itemIndex + 1}): ${item.name}`]);

            // Ingredients Sub-header
            worksheetData.push(["", "المكون", "الكمية", "الوحدة"]);

            if (item.recipe_items.length === 0) {
                worksheetData.push(["", "لا توجد مكونات مضافة", "-", "-"]);
            } else {
                item.recipe_items.forEach((ri, riIndex) => {
                    const ingredientName = ri.product_id ? ri.products?.name : ri.manual_name;
                    worksheetData.push([
                        `${riIndex + 1}-`,
                        ingredientName,
                        ri.quantity,
                        ri.unit
                    ]);
                });
            }

            // Minimalist Separator
            worksheetData.push([]);
        });

        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

        // RTL and Column width settings
        worksheet['!dir'] = 'rtl';
        worksheet['!cols'] = [
            { wch: 15 }, // Labels/ID
            { wch: 40 }, // Product Name / Ingredient
            { wch: 15 }, // Category / Qty
            { wch: 15 }  // Unit
        ];

        XLSX.utils.book_append_sheet(workbook, worksheet, "الريسبي");
        XLSX.writeFile(workbook, `الريسبي_${new Date().getTime()}.xlsx`);
    };

    const commonUnits = ['جرام', 'جم', 'كجم', 'لتر', 'مل', 'قطعة', 'شريحة'];

    return (
        <div className="page-content" style={{ direction: 'rtl' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <div>
                    <h1 className="page-title" style={{ marginBottom: 8 }}>👨‍🍳 نظام الريسبي</h1>
                    <p style={{ color: '#64748b', fontSize: 15, fontWeight: 600 }}>إدارة المنتجات النهائية ومكوناتها</p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button
                        onClick={exportToExcel}
                        className="btn"
                        style={{
                            borderRadius: 16, padding: '12px 24px', display: 'flex',
                            alignItems: 'center', gap: 8, background: '#10b981',
                            color: '#fff', border: 'none', fontWeight: 700
                        }}
                    >
                        <FileSpreadsheet size={20} />
                        تصدير Excel
                    </button>
                    <button
                        onClick={() => {
                            setEditingItem({ name: '', category: '', price: 0, description: '', recipe_items: [] });
                            setShowModal(true);
                        }}
                        className="btn btn-primary"
                        style={{ borderRadius: 16, padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 8 }}
                    >
                        <Plus size={20} />
                        إضافة منتج جديد
                    </button>
                </div>
            </div>

            <div style={{ marginBottom: 32, display: 'flex', gap: 12 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search style={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={20} />
                    <input
                        type="text"
                        placeholder="ابحث عن منتج أو فئة..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '16px 52px 16px 20px',
                            background: '#fff',
                            border: '2px solid #f1f5f9',
                            borderRadius: 20,
                            fontSize: 16,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                            outline: 'none',
                        }}
                    />
                </div>
                <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    style={{
                        padding: '0 24px',
                        borderRadius: 20,
                        border: '2px solid #f1f5f9',
                        fontSize: 16,
                        background: '#fff',
                        outline: 'none',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                        minWidth: 180,
                        cursor: 'pointer'
                    }}
                >
                    <option value="">كل الفئات</option>
                    {uniqueCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
                    <Loader2 className="animate-spin" size={48} color="#6366f1" />
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 24 }}>
                    {filteredItems.map(item => (
                        <div key={item.id} style={{
                            background: '#fff',
                            borderRadius: 24,
                            border: '1px solid #f1f5f9',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
                            overflow: 'hidden',
                            transition: 'all 0.3s ease',
                        }}>
                            <div style={{ padding: 24 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                    <div>
                                        <h3 style={{ fontSize: 20, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>{item.name}</h3>
                                        <span style={{
                                            background: '#f1f5f9',
                                            color: '#64748b',
                                            padding: '4px 12px',
                                            borderRadius: 8,
                                            fontSize: 13,
                                            fontWeight: 700
                                        }}>{item.category || 'بدون فئة'}</span>
                                    </div>
                                    <div style={{ textAlign: 'left' }}>
                                        <div style={{ fontSize: 22, fontWeight: 900, color: '#6366f1' }}>{item.price} <span style={{ fontSize: 13 }}>ج.م</span></div>
                                    </div>
                                </div>

                                <p style={{ color: '#64748b', fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>
                                    {item.description || 'لا يوجد وصف'}
                                </p>

                                <div style={{
                                    background: '#f8fafc',
                                    borderRadius: 16,
                                    padding: '12px 16px'
                                }}>
                                    <div
                                        onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: '#475569', fontSize: 14 }}>
                                            <ChefHat size={18} />
                                            مكونات الريسبي ({item.recipe_items.length})
                                        </div>
                                        {expandedItem === item.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                    </div>

                                    {expandedItem === item.id && (
                                        <div style={{ marginTop: 12, borderTop: '1px solid #e2e8f0', paddingTop: 12 }}>
                                            {item.recipe_items.map((recipeItem, idx) => (
                                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8, color: '#64748b' }}>
                                                    <span style={{ fontWeight: 600, color: '#334155' }}>• {recipeItem.product_id ? recipeItem.products?.name : recipeItem.manual_name}</span>
                                                    <span>{recipeItem.quantity} {recipeItem.unit}</span>
                                                </div>
                                            ))}
                                            {item.recipe_items.length === 0 && <div style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center' }}>لا توجد مكونات</div>}
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                                    <button
                                        onClick={() => {
                                            setEditingItem(item);
                                            setShowModal(true);
                                        }}
                                        className="btn"
                                        style={{ flex: 1.5, background: '#f1f5f9', color: '#475569', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 44, fontWeight: 700 }}
                                    >
                                        <Edit2 size={16} /> تعديل
                                    </button>
                                    <button
                                        onClick={() => handleDuplicate(item)}
                                        className="btn"
                                        style={{ width: 44, height: 44, background: '#eef2ff', color: '#6366f1', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        title="نسخ (Duplicate)"
                                    >
                                        <Copy size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="btn"
                                        style={{ width: 44, height: 44, background: '#fef2f2', color: '#ef4444', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000, padding: 20, backdropFilter: 'blur(10px)'
                }}>
                    <div style={{
                        background: '#fff', width: '100%', maxWidth: 850, borderRadius: 32,
                        maxHeight: '92vh', overflowY: 'auto', position: 'relative',
                        boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.3)',
                        animation: 'modalFadeIn 0.3s ease-out'
                    }}>
                        <style>{`
                            @keyframes modalFadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
                            .row-hover:hover { background: #f8fafc !important; }
                            .unit-chip { cursor: pointer; padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: 700; background: #f1f5f9; color: #64748b; transition: all 0.2s; }
                            .unit-chip:hover { background: #6366f1; color: #fff; }
                        `}</style>

                        <button
                            onClick={() => setShowModal(false)}
                            style={{ position: 'absolute', left: 24, top: 24, padding: 8, borderRadius: 12, background: '#f8fafc', color: '#64748b', border: 'none', zIndex: 10 }}
                        >
                            <X size={24} />
                        </button>

                        <form onSubmit={handleSave} style={{ padding: '40px 32px' }}>
                            <div style={{ textAlign: 'center', marginBottom: 32 }}>
                                <div style={{
                                    width: 64, height: 64, background: '#f0f4ff', color: '#6366f1',
                                    borderRadius: 20, display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', margin: '0 auto 16px'
                                }}>
                                    <ChefHat size={32} />
                                </div>
                                <h2 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a' }}>
                                    {editingItem?.id ? 'تعديل بيانات الريسبي' : 'إنشاء منتج جديد'}
                                </h2>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32, background: '#f8fafc', padding: 20, borderRadius: 24 }}>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>اسم المنتج</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        style={{ borderRadius: 12, height: 44 }}
                                        value={editingItem?.name || ''}
                                        onChange={e => setEditingItem({ ...editingItem!, name: e.target.value })}
                                        required
                                        autoFocus
                                    />
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>الفئة</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        style={{ borderRadius: 12, height: 44 }}
                                        value={editingItem?.category || ''}
                                        onChange={e => setEditingItem({ ...editingItem!, category: e.target.value })}
                                    />
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>السعر</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="form-control"
                                        style={{ borderRadius: 12, height: 44 }}
                                        value={editingItem?.price || 0}
                                        onChange={e => setEditingItem({ ...editingItem!, price: parseFloat(e.target.value) })}
                                    />
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>وصف مختص</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        style={{ borderRadius: 12, height: 44 }}
                                        value={editingItem?.description || ''}
                                        onChange={e => setEditingItem({ ...editingItem!, description: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: 40 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <Keyboard size={20} color="#6366f1" />
                                        <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1e293b' }}>مكونات الوصفة (الريسبي)</h3>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={addRecipeItem}
                                        style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 14, fontWeight: 800, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}
                                    >
                                        <Plus size={18} /> إضافة مكون
                                    </button>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {(editingItem?.recipe_items || []).map((item, idx) => (
                                        <div
                                            key={idx}
                                            className="row-hover"
                                            style={{
                                                display: 'grid',
                                                gridTemplateColumns: '40px 2.5fr 1fr 1.5fr 44px',
                                                gap: 16,
                                                alignItems: 'start',
                                                background: '#fff',
                                                padding: '16px',
                                                borderRadius: 20,
                                                border: '1.5px solid #f1f5f9',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            {/* Mode Toggle */}
                                            <div style={{ marginTop: 28 }}>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const isManual = !!item.manual_name || item.product_id === null;
                                                        if (isManual) {
                                                            // Switch to inventory
                                                            updateRecipeItem(idx, 'product_id', inventory[0]?.id || '');
                                                            updateRecipeItem(idx, 'manual_name', null);
                                                        } else {
                                                            // Switch to manual
                                                            updateRecipeItem(idx, 'product_id', null);
                                                            updateRecipeItem(idx, 'manual_name', '');
                                                        }
                                                    }}
                                                    style={{
                                                        width: 40, height: 40, borderRadius: 12,
                                                        background: item.product_id ? '#e0f2fe' : '#fef3c7',
                                                        color: item.product_id ? '#0284c7' : '#d97706',
                                                        border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    title={item.product_id ? "التحويل لإدخال يدوي" : "التحويل لاختيار من المخزن"}
                                                >
                                                    {item.product_id ? <Package size={20} /> : <Type size={20} />}
                                                </button>
                                            </div>

                                            {/* Product Selection / Name */}
                                            <div className="form-group" style={{ marginBottom: 0 }}>
                                                <label style={{ fontSize: 12, fontWeight: 800, color: '#64748b', marginBottom: 8, display: 'block' }}>
                                                    {item.product_id ? 'المكون من المخزن' : 'اسم المكون (يدوي)'}
                                                </label>
                                                {item.product_id ? (
                                                    <ProductSearchSelector
                                                        inventory={inventory}
                                                        value={item.product_id}
                                                        onChange={(id) => updateRecipeItem(idx, 'product_id', id)}
                                                        onSelectManual={() => {
                                                            updateRecipeItem(idx, 'product_id', null);
                                                            updateRecipeItem(idx, 'manual_name', '');
                                                        }}
                                                    />
                                                ) : (
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        style={{ borderRadius: 12, height: 42, border: '1.5px solid #e2e8f0', background: '#fffbeb' }}
                                                        placeholder="ملح، شريحة جبنة، فلفل..."
                                                        value={item.manual_name || ''}
                                                        onChange={e => updateRecipeItem(idx, 'manual_name', e.target.value)}
                                                        required
                                                    />
                                                )}
                                            </div>

                                            {/* Quantity */}
                                            <div className="form-group" style={{ marginBottom: 0 }}>
                                                <label style={{ fontSize: 12, fontWeight: 800, color: '#64748b', marginBottom: 8, display: 'block' }}>الكمية</label>
                                                <input
                                                    type="number"
                                                    step="0.001"
                                                    className="form-control"
                                                    style={{ borderRadius: 12, height: 42, border: '1.5px solid #e2e8f0' }}
                                                    value={item.quantity}
                                                    onChange={e => updateRecipeItem(idx, 'quantity', e.target.value)}
                                                    onKeyDown={e => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            addRecipeItem();
                                                        }
                                                    }}
                                                    required
                                                />
                                            </div>

                                            {/* Unit & Presets */}
                                            <div className="form-group" style={{ marginBottom: 0 }}>
                                                <label style={{ fontSize: 12, fontWeight: 800, color: '#64748b', marginBottom: 8, display: 'block' }}>الوحدة</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    style={{ borderRadius: 12, height: 42, border: '1.5px solid #e2e8f0', marginBottom: 8 }}
                                                    value={item.unit}
                                                    onChange={e => updateRecipeItem(idx, 'unit', e.target.value)}
                                                    readOnly={!!item.product_id}
                                                    placeholder="جرام، قطعة.."
                                                />
                                                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                                    {commonUnits.map(u => (
                                                        <span
                                                            key={u}
                                                            className="unit-chip"
                                                            onClick={() => updateRecipeItem(idx, 'unit', u)}
                                                        >{u}</span>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Delete */}
                                            <div style={{ marginTop: 28 }}>
                                                <button
                                                    type="button"
                                                    onClick={() => removeRecipeItem(idx)}
                                                    style={{ height: 42, width: 44, background: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                                                    onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
                                                    onMouseLeave={e => e.currentTarget.style.background = '#fef2f2'}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    {editingItem?.recipe_items?.length === 0 && (
                                        <div
                                            onClick={addRecipeItem}
                                            style={{
                                                textAlign: 'center', padding: '40px', background: '#f8fafc',
                                                borderRadius: 24, border: '2px dashed #e2e8f0', color: '#94a3b8',
                                                fontSize: 15, cursor: 'pointer', transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.color = '#6366f1'; }}
                                            onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#94a3b8'; }}
                                        >
                                            <div style={{ marginBottom: 8 }}><ChefHat size={32} style={{ margin: '0 auto' }} /></div>
                                            لا توجد مكونات بعد. <span style={{ fontWeight: 800, textDecoration: 'underline' }}>اضغط هنا للبدء</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={{
                                display: 'flex', gap: 16, position: 'sticky', bottom: 0,
                                background: '#fff', paddingTop: 24, borderTop: '1px solid #f1f5f9'
                            }}>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="btn btn-primary"
                                    style={{
                                        flex: 2, height: 60, borderRadius: 20, fontSize: 18,
                                        fontWeight: 900, display: 'flex', alignItems: 'center',
                                        justifyContent: 'center', gap: 12, boxShadow: '0 10px 25px rgba(99,102,241,0.4)'
                                    }}
                                >
                                    {saving ? <Loader2 className="animate-spin" /> : <Check size={24} />}
                                    {editingItem?.id ? 'حفظ التغييرات النهائية' : 'إضافة المنتج والريسبي'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    style={{
                                        flex: 1, height: 60, borderRadius: 20, fontSize: 16,
                                        fontWeight: 800, background: '#f1f5f9', color: '#475569',
                                        border: 'none'
                                    }}
                                >
                                    إلغاء
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
