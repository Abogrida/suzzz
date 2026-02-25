'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Search, X, ArrowRight } from 'lucide-react';
import Link from 'next/link';

type Product = { id: number; name: string; unit: string; price: number; barcode: string };
type Supplier = { id: number; name: string; phone: string };
type Item = { product_id: number; product_name: string; quantity: number; price: number; unit: string };

const fmt = (n: number) => n.toLocaleString('ar-EG', { minimumFractionDigits: 2 });

export default function PurchaseInvoicePage() {
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [items, setItems] = useState<Item[]>([]);
    const [productSearch, setProductSearch] = useState('');
    const [supplierSearch, setSupplierSearch] = useState('');
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
    const [showProductList, setShowProductList] = useState(false);
    const [showSupplierList, setShowSupplierList] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [paidAmount, setPaidAmount] = useState('');
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<string | null>(null);

    useEffect(() => {
        Promise.all([
            fetch('/api/products').then(r => r.json()),
            fetch('/api/customers?type=supplier').then(r => r.json()),
        ]).then(([p, s]) => {
            setProducts(Array.isArray(p) ? p : []);
            setSuppliers(Array.isArray(s) ? s : []);
        });
    }, []);

    const filteredProducts = products.filter(p =>
        !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.barcode.includes(productSearch)
    ).slice(0, 10);

    const filteredSuppliers = suppliers.filter(s =>
        !supplierSearch || s.name.includes(supplierSearch) || s.phone.includes(supplierSearch)
    ).slice(0, 8);

    const addItem = (product: Product) => {
        const existing = items.findIndex(i => i.product_id === product.id);
        if (existing >= 0) {
            const updated = [...items];
            updated[existing].quantity++;
            setItems(updated);
        } else {
            setItems([...items, { product_id: product.id, product_name: product.name, quantity: 1, price: product.price, unit: product.unit }]);
        }
        setProductSearch('');
        setShowProductList(false);
    };

    const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));
    const updateItem = (idx: number, field: 'quantity' | 'price', value: string) => {
        const updated = [...items];
        (updated[idx] as any)[field] = parseFloat(value) || 0;
        setItems(updated);
    };

    const total = items.reduce((s, i) => s + i.quantity * i.price, 0);
    const paid = parseFloat(paidAmount) || 0;
    const remaining = total - paid;

    const handleSubmit = async () => {
        if (items.length === 0) { setToast('أضف منتجات للفاتورة'); return; }
        setSaving(true);
        const res = await fetch('/api/invoices', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                invoice_type: 'purchase',
                customer_id: selectedSupplier?.id,
                customer_name: selectedSupplier?.name || supplierSearch,
                customer_phone: selectedSupplier?.phone || '',
                items: items.map(i => ({ product_id: i.product_id, product_name: i.product_name, quantity: i.quantity, price: i.price })),
                paid_amount: paid,
                payment_method: paymentMethod,
                notes,
            }),
        });
        const result = await res.json();
        setSaving(false);
        if (result.success) {
            setToast(`تم إنشاء الفاتورة: ${result.invoice_number}`);
            setTimeout(() => router.push('/invoices'), 1500);
        } else {
            setToast(result.message || 'خطأ');
        }
    };

    return (
        <div className="page-content">
            {toast && (
                <div className="toast-success" style={{ top: 16 }}>
                    {toast}
                    <button onClick={() => setToast(null)} className="mr-2"><X className="w-4 h-4" /></button>
                </div>
            )}

            <div className="page-header">
                <div className="flex items-center gap-3">
                    <Link href="/invoices" className="btn-outline btn btn-sm"><ArrowRight className="w-4 h-4" /></Link>
                    <h1 className="page-title">فاتورة شراء جديدة</h1>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 flex flex-col gap-4">
                    <div className="card">
                        <h2 className="font-semibold text-gray-700 mb-3">إضافة منتجات</h2>
                        <div className="relative">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input className="form-input pr-10" value={productSearch}
                                onChange={e => { setProductSearch(e.target.value); setShowProductList(true); }}
                                onFocus={() => setShowProductList(true)} placeholder="ابحث عن منتج..." />
                            {showProductList && productSearch && (
                                <div className="absolute top-full mt-1 right-0 left-0 bg-white border border-gray-200 rounded-xl shadow-xl z-20 max-h-60 overflow-y-auto">
                                    {filteredProducts.map(p => (
                                        <button key={p.id} onClick={() => addItem(p)}
                                            className="w-full text-right px-4 py-3 hover:bg-blue-50 flex justify-between items-center border-b border-gray-50 last:border-0">
                                            <div>
                                                <div className="font-medium text-gray-800">{p.name}</div>
                                                <div className="text-xs text-gray-400">{p.unit}</div>
                                            </div>
                                            <div className="font-semibold text-blue-600">{fmt(p.price)}</div>
                                        </button>
                                    ))}
                                    {filteredProducts.length === 0 && <div className="p-4 text-center text-gray-400">لا توجد نتائج</div>}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="card p-0 overflow-hidden">
                        {items.length === 0 ? (
                            <div className="text-center py-12 text-gray-400"><p>لم تضف أي منتجات</p></div>
                        ) : (
                            <table className="data-table">
                                <thead><tr><th>المنتج</th><th>الكمية</th><th>سعر الشراء</th><th>الإجمالي</th><th></th></tr></thead>
                                <tbody>
                                    {items.map((item, idx) => (
                                        <tr key={idx}>
                                            <td className="font-medium">{item.product_name}<div className="text-xs text-gray-400">{item.unit}</div></td>
                                            <td><input type="number" value={item.quantity} min="0.01" step="0.01" onChange={e => updateItem(idx, 'quantity', e.target.value)} className="form-input w-24" /></td>
                                            <td><input type="number" value={item.price} min="0" step="0.01" onChange={e => updateItem(idx, 'price', e.target.value)} className="form-input w-28" /></td>
                                            <td className="font-bold text-blue-600 amount">{fmt(item.quantity * item.price)}</td>
                                            <td><button onClick={() => removeItem(idx)} className="btn-icon btn-danger btn btn-sm"><Trash2 className="w-4 h-4" /></button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <div className="card">
                        <h2 className="font-semibold text-gray-700 mb-3">المورد</h2>
                        <div className="relative">
                            <input className="form-input" value={selectedSupplier ? selectedSupplier.name : supplierSearch}
                                onChange={e => { setSupplierSearch(e.target.value); setSelectedSupplier(null); setShowSupplierList(true); }}
                                onFocus={() => setShowSupplierList(true)} placeholder="اسم المورد (اختياري)" />
                            {selectedSupplier && (
                                <button onClick={() => { setSelectedSupplier(null); setSupplierSearch(''); }} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                            {showSupplierList && supplierSearch && !selectedSupplier && (
                                <div className="absolute top-full mt-1 right-0 left-0 bg-white border border-gray-200 rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto">
                                    {filteredSuppliers.map(s => (
                                        <button key={s.id} onClick={() => { setSelectedSupplier(s); setSupplierSearch(''); setShowSupplierList(false); }}
                                            className="w-full text-right px-4 py-2.5 hover:bg-blue-50 border-b border-gray-50 last:border-0">
                                            <div className="font-medium">{s.name}</div>
                                            <div className="text-xs text-gray-400">{s.phone}</div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="card flex flex-col gap-4">
                        <h2 className="font-semibold text-gray-700">الدفع</h2>
                        <div className="form-group">
                            <label className="form-label">طريقة الدفع</label>
                            <select className="form-input" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                                <option value="cash">نقدي</option>
                                <option value="bank">تحويل بنكي</option>
                                <option value="check">شيك</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">المبلغ المدفوع</label>
                            <input type="number" className="form-input" value={paidAmount} onChange={e => setPaidAmount(e.target.value)} placeholder="0.00" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">ملاحظات</label>
                            <textarea className="form-input" rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
                        </div>
                    </div>

                    <div className="card bg-slate-800 text-white">
                        <div className="flex justify-between mb-2"><span className="text-slate-300">الإجمالي</span><span className="font-bold text-xl">{fmt(total)}</span></div>
                        <div className="flex justify-between mb-2"><span className="text-slate-300">المدفوع</span><span className="font-semibold text-blue-400">{fmt(paid)}</span></div>
                        <div className="flex justify-between border-t border-slate-600 pt-2 mt-2">
                            <span className="text-slate-300">المتبقي</span>
                            <span className={`font-bold text-lg ${remaining > 0 ? 'text-red-400' : 'text-green-400'}`}>{fmt(remaining)}</span>
                        </div>
                    </div>

                    <button onClick={handleSubmit} disabled={saving || items.length === 0} className="btn-primary btn btn-lg justify-center w-full bg-blue-600 hover:bg-blue-700">
                        {saving ? <div className="spinner border-white/30 border-t-white" /> : 'حفظ فاتورة الشراء'}
                    </button>
                </div>
            </div>
        </div>
    );
}
