'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
    Clock, DollarSign, Search, FileText, Eye, X, Activity, Package, CreditCard, Wallet, ListChecks, Menu, Filter
} from 'lucide-react';

export default function CashierStatsPage() {
    // -------------------------------------------------------------
    // RESPONSIVENESS STATE
    // -------------------------------------------------------------
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // -------------------------------------------------------------
    // GLOBAL DATA STATE
    // -------------------------------------------------------------
    const [shifts, setShifts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateFilter, setDateFilter] = useState('today');
    const [searchTerm, setSearchTerm] = useState('');

    // -------------------------------------------------------------
    // MODAL LEVELS STATE
    // -------------------------------------------------------------
    const [selectedShift, setSelectedShift] = useState<any>(null);
    const [shiftOrders, setShiftOrders] = useState<any[]>([]);
    const [shiftOrdersLoading, setShiftOrdersLoading] = useState(false);
    const [shiftSearchTerm, setShiftSearchTerm] = useState('');
    const [showProductsReport, setShowProductsReport] = useState(false);
    const [shiftItems, setShiftItems] = useState<any[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [orderItems, setOrderItems] = useState<any[]>([]);
    const [orderItemsLoading, setOrderItemsLoading] = useState(false);

    // -------------------------------------------------------------
    // FETCHING DATA
    // -------------------------------------------------------------
    useEffect(() => {
        fetchGlobalShifts();
        const intervalId = setInterval(() => { fetchGlobalShifts(true); }, 3000);
        return () => clearInterval(intervalId);
    }, [dateFilter]);

    const fetchGlobalShifts = async (isBackground = false) => {
        if (!isBackground) setLoading(true);
        try {
            let dateLimit = new Date();
            if (dateFilter === 'today') dateLimit.setHours(0,0,0,0);
            if (dateFilter === 'week') dateLimit.setDate(dateLimit.getDate() - 7);
            if (dateFilter === 'month') dateLimit.setMonth(dateLimit.getMonth() - 1);
            const isoFilter = dateLimit.toISOString();

            let { data: fetchedShifts, error: shiftsError } = await supabase
                .from('cashier_shifts')
                .select('*')
                .order('opened_at', { ascending: false })
                .or(`closed_at.is.null,opened_at.gte.${isoFilter}`);

            if (shiftsError) console.error(shiftsError);
            setShifts(fetchedShifts || []);
            
            if (selectedShift && isBackground) {
                const updatedShift = (fetchedShifts || []).find(s => s.id === selectedShift.id);
                if (updatedShift) {
                    setSelectedShift(updatedShift);
                    fetchShiftOrders(updatedShift.id, true);
                }
            }
        } catch (error) {
            console.error('Error fetching global shifts:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchShiftOrders = async (shiftId: string, isBackground = false) => {
        if (!isBackground) setShiftOrdersLoading(true);
        try {
            const { data: oData, error: oError } = await supabase
                .from('cashier_orders')
                .select('*')
                .eq('shift_id', shiftId)
                .order('created_at', { ascending: false });
                
            if (oError) throw oError;
            const ordersList = oData || [];
            setShiftOrders(ordersList);

            if (ordersList.length > 0) {
                const orderIds = ordersList.map(o => o.id);
                const { data: iData } = await supabase.from('cashier_order_items').select('*').in('order_id', orderIds);
                if (iData) {
                    const aggregated: Record<string, any> = {};
                    iData.forEach(item => {
                        const key = item.product_name + (item.size ? ` - ${item.size}` : '');
                        if (!aggregated[key]) {
                            aggregated[key] = { product_name: key, quantity: 0, total: 0 };
                        }
                        aggregated[key].quantity += item.quantity;
                        aggregated[key].total += Number(item.total);
                    });
                    setShiftItems(Object.values(aggregated).sort((a,b) => b.total - a.total));
                }
            } else {
                setShiftItems([]);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setShiftOrdersLoading(false);
        }
    };

    // -------------------------------------------------------------
    // EVENT HANDLERS
    // -------------------------------------------------------------
    const openShiftModal = (shift: any) => {
        setSelectedShift(shift);
        setShiftSearchTerm('');
        setShowProductsReport(false);
        setSelectedOrder(null);
        fetchShiftOrders(shift.id);
    };

    const closeShiftModal = () => {
        setSelectedShift(null);
        setShiftOrders([]);
        setShiftItems([]);
        setShowProductsReport(false);
    };

    const openOrderModal = async (order: any) => {
        setSelectedOrder(order);
        setOrderItemsLoading(true);
        try {
            const { data, error } = await supabase.from('cashier_order_items').select('*').eq('order_id', order.id);
            if (error) throw error;
            setOrderItems(data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setOrderItemsLoading(false);
        }
    };

    const closeOrderModal = () => {
        setSelectedOrder(null);
        setOrderItems([]);
    };

    // -------------------------------------------------------------
    // FILTERING
    // -------------------------------------------------------------
    const filteredGlobalShifts = shifts.filter(s => 
        (s.shift_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
         s.local_id?.toString().includes(searchTerm))
    );

    const filteredShiftOrders = shiftOrders.filter(order => 
        (order.order_number?.toString().includes(shiftSearchTerm) || 
         order.customer_name?.toLowerCase().includes(shiftSearchTerm.toLowerCase()))
    );

    // -------------------------------------------------------------
    // STYLES HELPER (DYNAMIC)
    // -------------------------------------------------------------
    const containerPadding = isMobile ? '12px' : '32px';
    const headerTitleSize = isMobile ? '22px' : '32px';

    // -------------------------------------------------------------
    // RENDER COMPONENTS
    // -------------------------------------------------------------
    return (
        <div style={{ 
            padding: containerPadding, 
            minHeight: '100vh', 
            background: '#0f172a', 
            color: '#fff', 
            direction: 'rtl', 
            fontFamily: 'Cairo, sans-serif' 
        }}>
            {/* GLOBAL HEADER */}
            <div style={{ 
                display: 'flex', 
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: isMobile ? 'flex-start' : 'center', 
                justifyContent: 'space-between', 
                marginBottom: isMobile ? '20px' : '32px', 
                gap: '16px' 
            }}>
                <div>
                    <h1 style={{ fontSize: headerTitleSize, fontWeight: 900, margin: 0 }}>لوحة الكاشير <span style={{color: '#6366f1'}}>المركزية</span></h1>
                    <p style={{ color: '#94a3b8', marginTop: '4px', fontSize: isMobile ? '12px' : '15px' }}>نظرة شاملة على جميع العمليات والشيفتات</p>
                </div>
                
                <div style={{ 
                    display: 'flex', 
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: isMobile ? '8px' : '16px', 
                    alignItems: 'stretch',
                    width: isMobile ? '100%' : 'auto'
                }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search size={18} color="#94a3b8" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                        <input 
                            type="text" 
                            placeholder="بحث بالاسم أو الرقم..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ 
                                padding: '10px 40px 10px 16px', 
                                borderRadius: '10px', 
                                border: '1px solid rgba(255,255,255,0.1)', 
                                background: '#1e293b', 
                                color: '#fff', 
                                width: '100%',
                                minWidth: isMobile ? '0' : '220px',
                                outline: 'none' 
                            }}
                        />
                    </div>
                    <select 
                        value={dateFilter} 
                        onChange={(e) => setDateFilter(e.target.value)}
                        style={{ 
                            padding: '10px 16px', 
                            borderRadius: '10px', 
                            border: '1px solid rgba(255,255,255,0.1)', 
                            background: '#1e293b', 
                            color: '#fff', 
                            outline: 'none', 
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 700
                        }}>
                        <option value="today">اليوم</option>
                        <option value="week">آخر 7 أيام</option>
                        <option value="month">آخر 30 يوم</option>
                    </select>
                </div>
            </div>

            {/* MAIN SHIFTS LIST */}
            <div style={{ 
                background: isMobile ? 'transparent' : '#1e293b', 
                borderRadius: '16px', 
                border: isMobile ? 'none' : '1px solid rgba(255,255,255,0.05)', 
                overflow: 'hidden' 
            }}>
                {loading && shifts.length === 0 ? (
                    <div style={{ padding: '64px', textAlign: 'center', color: '#94a3b8' }}>جاري تحميل البيانات...</div>
                ) : filteredGlobalShifts.length === 0 ? (
                    <div style={{ padding: '64px', textAlign: 'center', color: '#94a3b8' }}>لا توجد شيفتات مسجلة حالياً.</div>
                ) : isMobile ? (
                    /* MOBILE CARD VIEW FOR SHIFTS */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {filteredGlobalShifts.map((shift) => {
                            const isOpen = !shift.closed_at && shift.status !== 'closed';
                            return (
                                <div key={shift.id} onClick={() => openShiftModal(shift)} style={{ 
                                    background: '#1e293b', 
                                    padding: '14px', 
                                    borderRadius: '14px', 
                                    border: isOpen ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.05)',
                                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                        <div style={{ fontWeight: 800, fontSize: '17px' }}>{shift.shift_name}</div>
                                        <span style={{ 
                                            padding: '4px 8px', 
                                            borderRadius: '6px', 
                                            fontSize: '10px', 
                                            fontWeight: 800, 
                                            background: isOpen ? '#10b98120' : '#64748b20', 
                                            color: isOpen ? '#10b981' : '#94a3b8',
                                            textTransform: 'uppercase'
                                        }}>
                                            {isOpen ? 'مباشر الآن' : 'مغلق'}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '12px', marginBottom: '8px' }}>
                                        <div><Clock size={12} style={{display: 'inline', marginLeft: '4px', verticalAlign: 'middle'}}/> {new Date(shift.opened_at).toLocaleTimeString('ar-EG', {hour:'2-digit', minute:'2-digit'})}</div>
                                        <div>{new Date(shift.shift_date).toLocaleDateString('ar-EG')}</div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.05)'}}>
                                        <div style={{ fontSize: '18px', fontWeight: 900, color: '#10b981' }}>{Number(shift.total_revenue || 0).toFixed(2)} <span style={{fontSize:'12px'}}>ج.م</span></div>
                                        <div style={{ color: '#6366f1', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, fontSize: '13px' }}>التفاصيل <Eye size={14}/></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    /* DESKTOP TABLE VIEW FOR SHIFTS */
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                            <thead>
                                <tr style={{ background: 'rgba(0,0,0,0.2)', color: '#94a3b8', fontSize: '14px' }}>
                                    <th style={{ padding: '16px' }}>اسم الشيفت</th>
                                    <th style={{ padding: '16px' }}>تاريخ العمل</th>
                                    <th style={{ padding: '16px' }}>توقيت الفتح</th>
                                    <th style={{ padding: '16px' }}>الحالة</th>
                                    <th style={{ padding: '16px' }}>الإيرادات</th>
                                    <th style={{ padding: '16px', textAlign: 'center' }}>عرض التفاصيل</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredGlobalShifts.map((shift) => {
                                    const isOpen = !shift.closed_at && shift.status !== 'closed';
                                    return (
                                        <tr key={shift.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: isOpen ? 'rgba(16, 185, 129, 0.08)' : 'transparent' }}>
                                            <td style={{ padding: '16px', fontWeight: 800 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    {isOpen && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />}
                                                    {shift.shift_name} <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 400 }}>(رقم {shift.shift_number || shift.local_id})</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px' }}>{new Date(shift.shift_date).toLocaleDateString('ar-EG')}</td>
                                            <td style={{ padding: '16px', direction: 'ltr', textAlign: 'right' }}>{new Date(shift.opened_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute:'2-digit' })}</td>
                                            <td style={{ padding: '16px' }}>
                                                <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, background: isOpen ? '#10b98120' : '#64748b20', color: isOpen ? '#10b981' : '#94a3b8' }}>
                                                    {isOpen ? 'مفتوح (مباشر)' : 'مغلق'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '16px', fontWeight: 800, color: '#10b981' }}>{Number(shift.total_revenue || 0).toFixed(2)} ج.م</td>
                                            <td style={{ padding: '16px', textAlign: 'center' }}>
                                                <button onClick={() => openShiftModal(shift)} style={{ background: '#6366f120', border: '1px solid #6366f1', color: '#6366f1', borderRadius: '8px', padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 700 }}>
                                                    <Eye size={16} /> تفاصيل
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ========================================================= */}
            {/* LEVEL 1 MODAL: SHIFT DETAILS & ORDERS LIST */}
            {/* ========================================================= */}
            {selectedShift && (
                <div style={{ 
                    position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', 
                    display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', padding: isMobile ? '0' : '24px' 
                }}>
                    <div style={{ 
                        background: '#f8fafc', 
                        width: '100%', 
                        maxWidth: isMobile ? '100%' : '1200px', 
                        height: isMobile ? '92vh' : '90vh', 
                        borderRadius: isMobile ? '20px 20px 0 0' : '16px', 
                        display: 'flex', flexDirection: 'column', overflow: 'hidden', 
                        boxShadow: '0 -10px 25px -5px rgba(0, 0, 0, 0.3)',
                        overscrollBehavior: 'contain'
                    }}>
                        {/* Mobile Drawer Handle */}
                        {isMobile && <div style={{ width: '40px', height: '4px', background: '#e2e8f0', borderRadius: '10px', margin: '12px auto' }} />}

                        {/* Modal Header */}
                        <div style={{ 
                            padding: isMobile ? '12px 16px' : '20px 24px', 
                            background: '#fff', borderBottom: '1px solid #e2e8f0', 
                            display: 'flex', flexDirection: isMobile ? 'column-reverse' : 'row', 
                            justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', gap: '10px' 
                        }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => setShowProductsReport(true)} style={{ 
                                    flex: 1, background: '#fef3c7', color: '#d97706', border: '1px solid #fde68a', 
                                    padding: '8px 14px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 800, cursor: 'pointer', fontSize: '13px' 
                                }}>
                                    <Package size={16} /> جرد الأصناف
                                </button>
                                {isMobile && (
                                    <button onClick={closeShiftModal} style={{ background: '#f1f5f9', color: '#64748b', border: 'none', padding: '10px', borderRadius: '10px' }}>
                                        <X size={20}/>
                                    </button>
                                )}
                            </div>
                            
                            <div style={{ textAlign: isMobile ? 'center' : 'left', color: '#1e293b' }}>
                                <h2 style={{ margin: 0, fontSize: isMobile ? '17px' : '20px', fontWeight: 900 }}>تفاصيل {selectedShift.shift_name}</h2>
                            </div>

                            {!isMobile && <button onClick={closeShiftModal} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={24} /></button>}
                        </div>

                        <div style={{ padding: isMobile ? '12px' : '20px', overflowY: 'auto', flex: 1, background: '#f8fafc', WebkitOverflowScrolling: 'touch' }}>
                            {/* Stats Grid */}
                            <div style={{ 
                                display: 'grid', 
                                gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', 
                                gap: isMobile ? '8px' : '16px', 
                                marginBottom: '16px' 
                            }}>
                                <div style={{ background: '#fff', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', gridColumn: isMobile ? 'span 2' : 'span 1' }}>
                                    <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>إجمالي المبيعات</div>
                                    <div style={{ fontSize: isMobile ? '22px' : '26px', fontWeight: 900, color: '#10b981' }}>{Number(selectedShift.total_revenue || 0).toFixed(2)} <span style={{fontSize:'11px'}}>ج.م</span></div>
                                </div>
                                <div style={{ background: '#fff', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ fontSize: '11px', color: '#64748b' }}>الطلبات</div>
                                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#3b82f6', marginTop: '2px' }}>{selectedShift.total_orders || 0}</div>
                                </div>
                                <div style={{ background: '#fff', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ fontSize: '11px', color: '#64748b' }}>الفواتير</div>
                                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#8b5cf6', marginTop: '2px' }}>{selectedShift.total_invoices || 0}</div>
                                </div>
                            </div>

                            {/* Inner Search Container (Sticky-ish?) */}
                            <div style={{ 
                                position: 'sticky', top: '-1px', zIndex: 10, background: '#f8fafc', paddingBottom: '12px'
                            }}>
                                <div style={{ position: 'relative', background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                                    <Search size={16} color="#94a3b8" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                                    <input 
                                        type="text" 
                                        placeholder="بحث برقم الطلب أو الطاولة..." 
                                        value={shiftSearchTerm}
                                        onChange={(e) => setShiftSearchTerm(e.target.value)}
                                        style={{ padding: '10px 38px 10px 12px', width: '100%', border: 'none', background: 'transparent', outline: 'none', fontSize: '13px' }}
                                    />
                                </div>
                            </div>

                            {/* Orders List Container */}
                            <div style={{ 
                                display: 'flex', flexDirection: 'column', gap: '8px'
                            }}>
                                {shiftOrdersLoading ? (
                                    <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>جاري التحميل...</div>
                                ) : isMobile ? (
                                    /* MOBILE LIST FOR ORDERS */
                                    <>
                                        {filteredShiftOrders.map((order) => {
                                            const isPaid = order.status === 'completed' || order.status === 'paid';
                                            return (
                                                <div key={order.id} onClick={() => openOrderModal(order)} style={{ 
                                                    background: '#fff', padding: '14px', borderRadius: '14px', border: '1px solid #e2e8f0'
                                                }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                                        <div style={{ fontWeight: 900, color: '#1e293b', fontSize: '15px' }}>طلب #{order.order_number || order.local_id}</div>
                                                        <span style={{ fontSize: '10px', color: '#64748b' }} dir="ltr">{new Date(order.created_at).toLocaleTimeString('ar-EG', {hour:'2-digit', minute:'2-digit'})}</span>
                                                    </div>
                                                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px' }}>
                                                        {order.table_number > 0 ? `طاولة ${order.table_number}` : 'سفري'} • {order.customer_name || 'عميل نقدي'}
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <div style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a' }}>{Number(order.total_amount).toFixed(2)} ج.م</div>
                                                        <span style={{ 
                                                            padding: '4px 10px', borderRadius: '10px', fontSize: '10px', fontWeight: 800,
                                                            background: isPaid ? '#dcfce7' : '#fef3c7', color: isPaid ? '#166534' : '#b45309' 
                                                        }}>
                                                            {isPaid ? 'مكتمل' : 'معلق'}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </>
                                ) : (
                                    /* DESKTOP TABLE FOR ORDERS */
                                    <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                                            <thead>
                                                <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '13px' }}>
                                                    <th style={{ padding: '12px 16px' }}>رقم الطلب</th>
                                                    <th style={{ padding: '12px 16px' }}>النوع/الطاولة</th>
                                                    <th style={{ padding: '12px 16px' }}>العميل</th>
                                                    <th style={{ padding: '12px 16px' }}>الإجمالي</th>
                                                    <th style={{ padding: '12px 16px' }}>الوقت</th>
                                                    <th style={{ padding: '12px 16px' }}>الحالة</th>
                                                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>عرض</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredShiftOrders.map((order) => {
                                                    const isPaid = order.status === 'completed' || order.status === 'paid';
                                                    return (
                                                        <tr key={order.id} style={{ borderBottom: '1px solid #f1f5f9', color: '#334155', fontSize: '14px', fontWeight: 600 }}>
                                                            <td style={{ padding: '16px', fontWeight: 900 }}>#{order.order_number || order.local_id}</td>
                                                            <td style={{ padding: '16px' }}>{order.table_number > 0 ? `طاولة ${order.table_number}` : 'سفري'}</td>
                                                            <td style={{ padding: '16px', color: '#64748b' }}>{order.customer_name || '-'}</td>
                                                            <td style={{ padding: '16px', fontWeight: 900 }}>{Number(order.total_amount).toFixed(2)}</td>
                                                            <td style={{ padding: '16px', color: '#64748b' }} dir="ltr">{new Date(order.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute:'2-digit' })}</td>
                                                            <td style={{ padding: '16px' }}>
                                                                <span style={{ padding: '4px 12px', borderRadius: '12px', fontSize: '12px', background: isPaid ? '#dcfce7' : '#fef3c7', color: isPaid ? '#166534' : '#b45309' }}>
                                                                    {isPaid ? 'مكتمل' : 'معلق'}
                                                                </span>
                                                            </td>
                                                            <td style={{ padding: '16px', textAlign: 'center' }}>
                                                                <button onClick={() => openOrderModal(order)} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer' }}><Eye size={20}/></button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ========================================================= */}
                    {/* LEVEL 2A MODAL: PRODUCTS REPORT */}
                    {/* ========================================================= */}
                    {showProductsReport && (
                        <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', padding: isMobile ? '0' : '24px' }}>
                            <div style={{ 
                                background: '#fff', width: '100%', maxWidth: '700px', height: isMobile ? '85vh' : 'auto', maxHeight: isMobile ? '85vh' : '90vh', 
                                borderRadius: isMobile ? '20px 20px 0 0' : '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden',
                                overscrollBehavior: 'contain'
                            }}>
                                {isMobile && <div style={{ width: '40px', height: '4px', background: '#e2e8f0', borderRadius: '10px', margin: '12px auto' }} />}
                                <div style={{ padding: '14px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b45309', fontWeight: 900, fontSize: '16px' }}>
                                        <Package size={18} /> جرد الأصناف المباعة
                                    </div>
                                    <button onClick={() => setShowProductsReport(false)} style={{ background: 'none', border: 'none', color: '#64748b' }}><X size={24} /></button>
                                </div>
                                <div style={{ padding: '0', overflowY: 'auto', flex: 1, color: '#334155', WebkitOverflowScrolling: 'touch' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '14px' }}>
                                        <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 5 }}>
                                            <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>
                                                <th style={{ padding: '12px 16px' }}>المنتج</th>
                                                <th style={{ padding: '12px', textAlign: 'center' }}>الكمية</th>
                                                <th style={{ padding: '12px 16px' }}>الإجمالي</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {shiftItems.map((item, idx) => (
                                                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', fontWeight: 700 }}>
                                                    <td style={{ padding: '12px 16px' }}>{item.product_name}</td>
                                                    <td style={{ padding: '12px', textAlign: 'center', color: '#3b82f6' }}>{item.quantity}</td>
                                                    <td style={{ padding: '12px 16px', color: '#10b981' }}>{Number(item.total).toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ========================================================= */}
                    {/* LEVEL 2B MODAL: ORDER DETAILS */}
                    {/* ========================================================= */}
                    {selectedOrder && (
                        <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', padding: isMobile ? '0' : '24px' }}>
                            <div style={{ 
                                background: '#fff', width: '100%', maxWidth: '600px', height: isMobile ? '80vh' : 'auto', maxHeight: isMobile ? '80vh' : '90vh', 
                                borderRadius: isMobile ? '20px 20px 0 0' : '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden',
                                overscrollBehavior: 'contain'
                            }}>
                                {isMobile && <div style={{ width: '40px', height: '4px', background: '#e2e8f0', borderRadius: '10px', margin: '12px auto' }} />}
                                <div style={{ padding: '14px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 900, color: '#1e293b' }}>تفاصيل طلب #{selectedOrder.order_number || selectedOrder.local_id}</h2>
                                    <button onClick={closeOrderModal} style={{ background: 'none', border: 'none', color: '#64748b' }}><X size={24} /></button>
                                </div>
                                <div style={{ padding: '16px', overflowY: 'auto', flex: 1, color: '#334155', WebkitOverflowScrolling: 'touch' }}>
                                    <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                                        <div style={{ display: 'inline-block', padding: '4px 10px', background: '#fef3c7', color: '#b45309', borderRadius: '8px', fontSize: '11px', fontWeight: 800 }}>
                                            {(selectedOrder.status === 'completed' || selectedOrder.status === 'paid') ? 'مكتمل ومسدد' : 'قيد الانتظار'}
                                        </div>
                                    </div>

                                    {orderItemsLoading ? (
                                        <div style={{ textAlign: 'center', padding: '20px' }}>جاري التحميل...</div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {orderItems.map((item, idx) => (
                                                <div key={idx} style={{ padding: '12px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '14px' }}>
                                                        <span>{item.product_name} x {item.quantity}</span>
                                                        <span style={{color: '#10b981'}}>{Number(item.total).toFixed(2)} ج.م</span>
                                                    </div>
                                                    {(item.size || item.additions) && (
                                                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                                                            {item.size && <span>الحجم: {item.size} </span>}
                                                            {item.additions && <span>• الإضافات: {item.additions}</span>}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div style={{ marginTop: '16px', padding: '16px', borderRadius: '12px', background: '#1e293b', color: '#fff' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', opacity: 0.8, fontSize: '13px' }}>
                                            <span>الضريبة:</span>
                                            <span>{Number(selectedOrder.tax_amount || 0).toFixed(2)}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', opacity: 0.8, fontSize: '13px' }}>
                                            <span>الخصم:</span>
                                            <span>{Number(selectedOrder.discount_amount || 0).toFixed(2)}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.1)', fontWeight: 900, fontSize: '19px' }}>
                                            <span>الإجمالي:</span>
                                            <span style={{ color: '#10b981' }}>{Number(selectedOrder.total_amount || 0).toFixed(2)} ج.م</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
            
        </div>
    );
}
