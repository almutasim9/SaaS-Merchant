'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface DeliveryZone {
    id: string;
    name: string;
    fee: number;
    enabled: boolean;
    cities: string[];
}

interface Store {
    id: string;
}

const IRAQ_CITIES = [
    'بغداد', 'البصرة', 'الموصل', 'أربيل', 'السليمانية', 'دهوك',
    'كركوك', 'النجف', 'كربلاء', 'الحلة', 'الأنبار', 'الديوانية',
    'الكوت', 'العمارة', 'الناصرية', 'السماوة', 'ديالى', 'صلاح الدين'
];

export default function MerchantDeliveryPage() {
    const [store, setStore] = useState<Store | null>(null);
    const [zones, setZones] = useState<DeliveryZone[]>([]);
    const [isFreeDelivery, setIsFreeDelivery] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);

    const router = useRouter();

    useEffect(() => {
        checkMerchant();
    }, []);

    const checkMerchant = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push('/login');
            return;
        }

        const { data: storeData } = await supabase
            .from('stores')
            .select('id, delivery_fees')
            .eq('merchant_id', user.id)
            .single();

        if (storeData) {
            setStore({ id: storeData.id });

            // Auto Migrate Database Formats to Zones
            const rawFees = storeData.delivery_fees;

            // Check if it's already in the new format { zones: [...] }
            if (rawFees && Array.isArray(rawFees.zones)) {
                setZones(rawFees.zones);
            }
            // Check if it's the detailed format { "بغداد": { fee: 5000, enabled: true }, ... }
            else if (rawFees && typeof rawFees === 'object' && !('baghdad' in rawFees) && Object.keys(rawFees).length > 2) {
                // Not ideal to reverse-engineer groups from individual prices, so we'll group by fee
                const groupedMap: Record<number, { name: string, cities: string[] }> = {};
                Object.keys(rawFees).forEach(city => {
                    const { fee, enabled } = rawFees[city];
                    if (enabled) {
                        if (!groupedMap[fee]) groupedMap[fee] = { name: `مجموعة ${fee} د.ع`, cities: [] };
                        groupedMap[fee].cities.push(city);
                    }
                });
                const newZones: DeliveryZone[] = Object.keys(groupedMap).map((feeStr, idx) => ({
                    id: Date.now().toString() + idx,
                    name: groupedMap[Number(feeStr)].name,
                    fee: Number(feeStr),
                    enabled: true,
                    cities: groupedMap[Number(feeStr)].cities
                }));
                // If no enabled cities left, add a default empty baghdad zone
                if (newZones.length === 0) {
                    newZones.push({ id: Date.now().toString(), name: 'توصيل بغداد', fee: 5000, enabled: true, cities: ['بغداد'] });
                }
                setZones(newZones);
            }
            // Legacy old format { baghdad: 5000, provinces: 8000 }
            else {
                const bFee = rawFees?.baghdad ?? 5000;
                const pFee = rawFees?.provinces ?? 8000;
                setZones([
                    { id: Date.now().toString() + '1', name: 'توصيل بغداد', fee: bFee, enabled: true, cities: ['بغداد'] },
                    { id: Date.now().toString() + '2', name: 'باقي المحافظات', fee: pFee, enabled: true, cities: IRAQ_CITIES.filter(c => c !== 'بغداد') }
                ]);
            }
        }
        setLoading(false);
    };

    const handleSave = async (zonesToSave = zones) => {
        if (!store) return;
        setSaving(true);
        const { error } = await supabase
            .from('stores')
            .update({ delivery_fees: { zones: zonesToSave, isFreeDelivery } })
            .eq('id', store.id);

        setSaving(false);
        if (error) {
            toast.error('فشل في حفظ إعدادات التوصيل');
        } else {
            toast.success('تم حفظ إعدادات التوصيل بنجاح');
        }
    };

    const handleDeleteZone = (id: string) => {
        if (confirm('هل أنت متأكد من حذف هذه المنطقة؟ سيتم إيقاف التوصيل للمحافظات بداخلها.')) {
            const newZones = zones.filter(z => z.id !== id);
            setZones(newZones);
        }
    };

    const handleToggleZone = (id: string) => {
        const newZones = zones.map(z => z.id === id ? { ...z, enabled: !z.enabled } : z);
        setZones(newZones);
    };

    const openModal = (zone?: DeliveryZone) => {
        if (zone) {
            setEditingZone({ ...zone, cities: [...zone.cities] }); // deep copy cities
        } else {
            setEditingZone({
                id: Date.now().toString(),
                name: '',
                fee: 5000,
                enabled: true,
                cities: []
            });
        }
        setIsModalOpen(true);
    };

    const saveZoneModal = () => {
        if (!editingZone || !editingZone.name.trim()) {
            toast.error('يرجى إدخال اسم المنطقة');
            return;
        }
        if (editingZone.cities.length === 0) {
            toast.error('يرجى اختيار محافظة واحدة على الأقل');
            return;
        }

        let newZones = [...zones];
        const existingIndex = newZones.findIndex(z => z.id === editingZone.id);

        // Remove cities from other zones to prevent overlap
        newZones = newZones.map(z => {
            if (z.id !== editingZone.id) {
                return { ...z, cities: z.cities.filter(c => !editingZone.cities.includes(c)) };
            }
            return z;
        });

        if (existingIndex >= 0) {
            newZones[existingIndex] = editingZone;
        } else {
            newZones.push(editingZone);
        }

        setZones(newZones);
        setIsModalOpen(false);
        setEditingZone(null);
    };

    const handleCityToggleInModal = (city: string) => {
        if (!editingZone) return;
        const cities = editingZone.cities.includes(city)
            ? editingZone.cities.filter(c => c !== city)
            : [...editingZone.cities, city];
        setEditingZone({ ...editingZone, cities });
    };

    if (loading) {
        return (
            <div className="p-10 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    // Helper: Which cities are unassigned?
    const allAssignedCities = zones.reduce((acc, z) => [...acc, ...z.cities], [] as string[]);
    const unassignedCities = IRAQ_CITIES.filter(c => !allAssignedCities.includes(c));

    return (
        <div className="px-4 lg:px-10 pb-20 space-y-8 lg:space-y-10 pt-6 lg:pt-0" dir="rtl">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:gap-0">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">إدارة التوصيل والمناطق</h1>
                    <p className="text-slate-400 font-medium mt-1 text-sm">أنشئ مناطق توصيل (كروبات)، حدد سعر المنطقة، وضم إليها المحافظات بسهولة.</p>
                </div>
                <button
                    onClick={() => handleSave(zones)}
                    disabled={saving}
                    className="flex items-center justify-center gap-2 px-6 lg:px-8 py-3.5 lg:py-4 bg-indigo-600 text-white rounded-xl lg:rounded-2xl font-bold text-sm shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {saving ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                            <span>جاري الحفظ...</span>
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>حفظ الإعدادات</span>
                        </>
                    )}
                </button>
            </div>

            {/* Free Delivery Global Toggle */}
            <div className={`p-6 lg:p-8 rounded-[2rem] lg:rounded-[2.5rem] border shadow-sm transition-all flex items-center justify-between ${isFreeDelivery ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-100'}`}>
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${isFreeDelivery ? 'bg-emerald-500 text-white shadow-emerald-500/30' : 'bg-slate-50 text-slate-400'}`}>
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <div>
                        <h3 className={`text-lg font-bold ${isFreeDelivery ? 'text-emerald-900' : 'text-slate-800'}`}>تفعيل الشحن المجاني</h3>
                        <p className={`text-xs font-medium mt-1 ${isFreeDelivery ? 'text-emerald-700' : 'text-slate-400'}`}>
                            عند التفعيل، سيتم تصفير أجور التوصيل لجميع المحافظات المشمولة في الكروبات. (يستخدم للعروض الخاصة)
                        </p>
                    </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={isFreeDelivery} onChange={() => setIsFreeDelivery(!isFreeDelivery)} />
                    <div className="w-14 h-8 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:right-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
            </div>

            {/* Unassigned Warning */}
            {unassignedCities.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4">
                    <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <div>
                        <h4 className="font-bold text-amber-800 mb-1">محافظات خارج التغطية</h4>
                        <p className="text-sm font-medium text-amber-700 leading-relaxed mb-3">هناك {unassignedCities.length} محافظات لم يتم إضافتها لأي كروب. هذه المحافظات لن تظهر للعملاء في صفحة الطلب. <br /> ({unassignedCities.join('، ')})</p>
                    </div>
                </div>
            )}

            {/* Zones Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

                {zones.map((zone) => (
                    <div key={zone.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 lg:p-8 flex flex-col relative group transition-all hover:shadow-md hover:border-indigo-100">
                        {/* Settings Dropdown Placeholder/Delete Button for simplicity */}
                        <button onClick={() => handleDeleteZone(zone.id)} className="absolute top-6 left-6 w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-100">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>

                        <div className="flex items-center gap-4 border-b border-slate-50 pb-5 mb-5">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${zone.enabled ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400'}`}>
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className={`text-xl font-bold ${zone.enabled ? 'text-slate-800' : 'text-slate-400'} line-clamp-1`}>{zone.name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-sm font-bold text-emerald-600" dir="ltr">{zone.fee.toLocaleString()} د.ع</span>
                                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                    <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">{zone.cities.length} محافظات</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">المحافظات المشمولة</h4>
                            <div className="flex flex-wrap gap-2 max-h-[140px] overflow-y-auto custom-scrollbar pr-2 pb-2">
                                {zone.cities.length === 0 && <span className="text-xs text-rose-500 font-bold bg-rose-50 px-2 py-1 rounded-md">لم يتم إضافة محافظات</span>}
                                {zone.cities.map(city => (
                                    <span key={city} className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${zone.enabled ? 'bg-white border-slate-200 text-slate-600' : 'bg-slate-50 border-transparent text-slate-400'}`}>
                                        {city}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="mt-6 pt-5 border-t border-slate-50 flex items-center justify-between">
                            <button onClick={() => openModal(zone)} className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
                                تعديل المنطقة
                            </button>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={zone.enabled} onChange={() => handleToggleZone(zone.id)} />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                            </label>
                        </div>
                    </div>
                ))}

                {/* Add New Zone Card */}
                <button onClick={() => openModal()} className="bg-[#F8F9FB] border-2 border-dashed border-slate-200 rounded-[2rem] p-6 lg:p-8 flex flex-col items-center justify-center min-h-[300px] hover:border-indigo-400 hover:bg-indigo-50/50 transition-all group">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600 shadow-sm border border-slate-100 mb-4 transition-colors">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-slate-600 group-hover:text-indigo-700 transition-colors">منطقة دفع جديدة</h3>
                    <p className="text-xs font-medium text-slate-400 text-center mt-2 max-w-[200px]">انشئ كروب جديد للمحافظات بأسعار مخصصة.</p>
                </button>
            </div>

            {/* Modal */}
            {isModalOpen && editingZone && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" dir="rtl">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 lg:p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h2 className="text-xl font-bold text-slate-800">تعديل منطقة الطلب</h2>
                            <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-400 shadow-sm border border-slate-100 hover:text-slate-800 transition-colors">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6 lg:p-8 overflow-y-auto custom-scrollbar flex-1 space-y-8">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 block">اسم الكروب/المنطقة</label>
                                    <input
                                        type="text"
                                        value={editingZone.name}
                                        onChange={(e) => setEditingZone({ ...editingZone, name: e.target.value })}
                                        className="w-full bg-[#FBFBFF] border border-slate-200 rounded-xl px-5 py-3.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all"
                                        placeholder="مثلاً: محافظات الجنوب"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 block">التكلفة الثابتة</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={editingZone.fee}
                                            onChange={(e) => setEditingZone({ ...editingZone, fee: Number(e.target.value) })}
                                            className="w-full bg-[#FBFBFF] border border-slate-200 rounded-xl px-5 py-3.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all text-left"
                                            placeholder="8000"
                                            dir="ltr"
                                        />
                                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">د.ع</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">المحافظات المشمولة بهذا الكروب</label>
                                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">{editingZone.cities.length} محددة</span>
                                </div>
                                <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl">
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                        {IRAQ_CITIES.map(city => {
                                            const isSelected = editingZone.cities.includes(city);

                                            // Is it in ANOTHER zone? (to warn user)
                                            const inOtherZone = zones.find(z => z.id !== editingZone.id && z.cities.includes(city));

                                            return (
                                                <button
                                                    key={city}
                                                    onClick={() => handleCityToggleInModal(city)}
                                                    className={`px-3 py-2.5 rounded-xl border flex flex-col items-center justify-center text-sm font-bold transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'}`}
                                                >
                                                    <span>{city}</span>
                                                    {inOtherZone && !isSelected && (
                                                        <span className="text-[9px] font-bold text-rose-400 mt-1 line-clamp-1 block w-full text-center opacity-70">
                                                            في: {inOtherZone.name}
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <p className="text-[10px] font-medium text-slate-400 mt-4 text-center">ملاحظة: اختيار محافظة موجودة في كروب آخر سيؤدي إلى سحبها منه لتجنب التكرار.</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-100 bg-white flex justify-end gap-3">
                            <button onClick={() => setIsModalOpen(false)} className="px-6 py-3 font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">غلق</button>
                            <button onClick={saveZoneModal} className="px-8 py-3 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-600/20 transition-all">موافق</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
