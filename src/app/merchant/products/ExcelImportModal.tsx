'use client';

import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase';

interface Section {
    id: string;
    name: string;
}

interface ParsedProduct {
    name: string;
    price: number;
    sectionName: string;
    sectionId?: string;
    description?: string;
    valid: boolean;
    errors: string[];
}

interface ExcelImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    storeId: string;
    sections: Section[];
}

export default function ExcelImportModal({ isOpen, onClose, onSuccess, storeId, sections }: ExcelImportModalProps) {
    const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'done'>('upload');
    const [parsedProducts, setParsedProducts] = useState<ParsedProduct[]>([]);
    const [importProgress, setImportProgress] = useState(0);
    const [importErrors, setImportErrors] = useState<string[]>([]);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    // --- Template Download ---
    const downloadTemplate = () => {
        const templateData = [
            // Header row (Arabic)
            ['اسم المنتج *', 'السعر (د.ع) *', 'القسم *', 'الوصف (اختياري)'],
            // Example row
            ['قميص قطني أبيض', '15000', 'ملابس', 'قميص قطني عالي الجودة'],
            ['حذاء رياضي', '25000', 'أحذية', ''],
        ];

        const ws = XLSX.utils.aoa_to_sheet(templateData);

        // Set column widths
        ws['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 30 }];

        // Style header row
        const headerRange = XLSX.utils.decode_range('A1:D1');
        for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
            const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
            if (!ws[cellRef]) continue;
            ws[cellRef].s = {
                font: { bold: true },
                fill: { fgColor: { rgb: '4F46E5' } },
                alignment: { horizontal: 'center' }
            };
        }

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'المنتجات');

        // Add sections reference sheet
        const sectionsData = [
            ['اسماء الأقسام المتاحة - استخدمها في عمود القسم'],
            ...sections.map(s => [s.name])
        ];
        const ws2 = XLSX.utils.aoa_to_sheet(sectionsData);
        ws2['!cols'] = [{ wch: 40 }];
        XLSX.utils.book_append_sheet(wb, ws2, 'الأقسام المتاحة');

        XLSX.writeFile(wb, 'قالب_استيراد_المنتجات.xlsx');
    };

    // --- Parse Uploaded File ---
    const parseFile = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const wb = XLSX.read(data, { type: 'array' });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

                if (rows.length < 2) {
                    alert('الملف فارغ أو لا يحتوي على بيانات كافية.');
                    return;
                }

                // Skip header row (row 0)
                const dataRows = rows.slice(1).filter(row => row.some(cell => cell !== ''));

                const parsed: ParsedProduct[] = dataRows.map((row, idx) => {
                    const errors: string[] = [];
                    const name = String(row[0] || '').trim();
                    const priceRaw = String(row[1] || '').replace(/[,،]/g, '').trim();
                    const sectionName = String(row[2] || '').trim();
                    const description = String(row[3] || '').trim();

                    if (!name) errors.push('اسم المنتج مطلوب');
                    const price = parseFloat(priceRaw);
                    if (!priceRaw || isNaN(price) || price <= 0) errors.push('السعر غير صالح');
                    if (!sectionName) errors.push('القسم مطلوب');

                    const matchedSection = sections.find(s =>
                        s.name.trim().toLowerCase() === sectionName.toLowerCase()
                    );
                    if (sectionName && !matchedSection) errors.push(`القسم "${sectionName}" غير موجود`);

                    return {
                        name,
                        price: isNaN(price) ? 0 : price,
                        sectionName,
                        sectionId: matchedSection?.id,
                        description: description || undefined,
                        valid: errors.length === 0,
                        errors
                    };
                });

                setParsedProducts(parsed);
                setStep('preview');
            } catch (err) {
                alert('فشل قراءة الملف. تأكد أنه ملف Excel صحيح (.xlsx)');
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) parseFile(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) parseFile(file);
    };

    // --- Import Valid Products ---
    const handleImport = async () => {
        const validProducts = parsedProducts.filter(p => p.valid);
        if (validProducts.length === 0) return;

        setStep('importing');
        setImportProgress(0);
        const errors: string[] = [];

        for (let i = 0; i < validProducts.length; i++) {
            const p = validProducts[i];
            try {
                const { error } = await supabase.from('products').insert({
                    store_id: storeId,
                    name: p.name,
                    price: p.price,
                    section_id: p.sectionId,
                    description: p.description || null,

                    stock_quantity: 999,
                    attributes: { isAvailable: true, hasVariants: false, variantOptions: [], variantCombinations: [] }
                });

                if (error) errors.push(`${p.name}: ${error.message}`);
            } catch (err: any) {
                errors.push(`${p.name}: ${err.message}`);
            }

            setImportProgress(Math.round(((i + 1) / validProducts.length) * 100));
        }

        setImportErrors(errors);
        setStep('done');
        if (errors.length === 0) onSuccess();
    };

    // --- Reset ---
    const handleClose = () => {
        setStep('upload');
        setParsedProducts([]);
        setImportProgress(0);
        setImportErrors([]);
        onClose();
    };

    const validCount = parsedProducts.filter(p => p.valid).length;
    const invalidCount = parsedProducts.filter(p => !p.valid).length;

    return (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center" dir="rtl">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />
            <div className="relative w-full md:max-w-2xl bg-white rounded-t-3xl md:rounded-3xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden z-10">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-black">استيراد منتجات من Excel</h2>
                            <p className="text-xs text-black mt-0.5">
                                {step === 'upload' && 'ارفع ملف Excel يحتوي على بيانات المنتجات'}
                                {step === 'preview' && `${parsedProducts.length} منتج في الملف — ${validCount} صالح`}
                                {step === 'importing' && 'جاري الاستيراد...'}
                                {step === 'done' && 'اكتمل الاستيراد'}
                            </p>
                        </div>
                    </div>
                    <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors text-black">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">

                    {/* STEP: Upload */}
                    {step === 'upload' && (
                        <>
                            {/* Download Template */}
                            <div className="bg-indigo-50 rounded-2xl p-4 flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-sm font-bold text-indigo-800">📥 حمّل القالب أولاً</p>
                                    <p className="text-xs text-indigo-500 mt-0.5">قالب Excel جاهز بالأعمدة الصحيحة + أسماء الأقسام</p>
                                </div>
                                <button
                                    onClick={downloadTemplate}
                                    className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    تحميل القالب
                                </button>
                            </div>

                            {/* Upload zone */}
                            <div
                                className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${dragOver ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 hover:border-emerald-300 hover:bg-slate-50'}`}
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={handleDrop}
                            >
                                <div className="w-14 h-14 bg-emerald-100 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                                    </svg>
                                </div>
                                <p className="text-sm font-bold text-black">اسحب ملف Excel هنا أو اضغط للاختيار</p>
                                <p className="text-xs text-black mt-1">ملفات .xlsx فقط</p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".xlsx,.xls"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                            </div>

                            {/* Column guide */}
                            <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
                                <p className="text-xs font-bold text-black uppercase tracking-wider mb-3">أعمدة القالب</p>
                                {[
                                    { col: 'A', label: 'اسم المنتج', required: true },
                                    { col: 'B', label: 'السعر (د.ع)', required: true },
                                    { col: 'C', label: 'القسم', required: true },
                                    { col: 'D', label: 'الوصف', required: false },
                                ].map(c => (
                                    <div key={c.col} className="flex items-center gap-3">
                                        <span className="w-7 h-7 bg-white border border-slate-200 rounded-lg text-xs font-black text-black flex items-center justify-center">{c.col}</span>
                                        <span className="text-sm font-medium text-black">{c.label}</span>
                                        {c.required
                                            ? <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full">مطلوب</span>
                                            : <span className="text-[10px] font-bold text-black bg-slate-100 px-2 py-0.5 rounded-full">اختياري</span>
                                        }
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {/* STEP: Preview */}
                    {step === 'preview' && (
                        <>
                            {/* Summary */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-slate-50 rounded-2xl p-4 text-center">
                                    <div className="text-2xl font-black text-black">{parsedProducts.length}</div>
                                    <div className="text-xs text-black font-medium mt-0.5">إجمالي الصفوف</div>
                                </div>
                                <div className="bg-emerald-50 rounded-2xl p-4 text-center">
                                    <div className="text-2xl font-black text-emerald-600">{validCount}</div>
                                    <div className="text-xs text-emerald-500 font-medium mt-0.5">جاهز للاستيراد</div>
                                </div>
                                <div className={`rounded-2xl p-4 text-center ${invalidCount > 0 ? 'bg-rose-50' : 'bg-slate-50'}`}>
                                    <div className={`text-2xl font-black ${invalidCount > 0 ? 'text-rose-500' : 'text-slate-900'}`}>{invalidCount}</div>
                                    <div className={`text-xs font-medium mt-0.5 ${invalidCount > 0 ? 'text-rose-400' : 'text-black'}`}>يحتوي أخطاء</div>
                                </div>
                            </div>

                            {/* Product list */}
                            <div className="space-y-2 max-h-80 overflow-y-auto">
                                {parsedProducts.map((p, i) => (
                                    <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${p.valid ? 'bg-white border-slate-100' : 'bg-rose-50 border-rose-100'}`}>
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${p.valid ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-500'}`}>
                                            {p.valid
                                                ? <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                                : <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                            }
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-black truncate">{p.name || `صف ${i + 2}`}</p>
                                            {p.valid
                                                ? <p className="text-xs text-black">{p.price.toLocaleString()} د.ع · {p.sectionName}</p>
                                                : <p className="text-xs text-rose-500">{p.errors.join(' · ')}</p>
                                            }
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {invalidCount > 0 && (
                                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-xs text-amber-700 font-medium">
                                    ⚠️ الصفوف التي تحتوي على أخطاء لن يتم استيرادها. يمكنك المتابعة وسيُستورد الصالح منها فقط ({validCount} منتج).
                                </div>
                            )}

                            <button
                                onClick={() => { setStep('upload'); setParsedProducts([]); }}
                                className="text-xs text-black hover:text-black transition-colors"
                            >
                                ← رفع ملف مختلف
                            </button>
                        </>
                    )}

                    {/* STEP: Importing */}
                    {step === 'importing' && (
                        <div className="text-center py-10 space-y-6">
                            <div className="w-16 h-16 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin mx-auto" />
                            <div>
                                <p className="text-base font-bold text-black">جارٍ استيراد المنتجات...</p>
                                <p className="text-sm text-black mt-1">{importProgress}% مكتمل</p>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2 mx-auto max-w-sm">
                                <div
                                    className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${importProgress}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* STEP: Done */}
                    {step === 'done' && (
                        <div className="text-center py-8 space-y-4">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${importErrors.length === 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-lg font-black text-black">
                                    {importErrors.length === 0 ? 'تم الاستيراد بنجاح! 🎉' : 'اكتمل الاستيراد مع بعض الأخطاء'}
                                </p>
                                <p className="text-sm text-black mt-1">
                                    تمت إضافة {validCount - importErrors.length} منتج بنجاح
                                </p>
                            </div>
                            {importErrors.length > 0 && (
                                <div className="bg-rose-50 rounded-2xl p-4 text-xs text-rose-600 space-y-1 text-right max-h-40 overflow-y-auto">
                                    {importErrors.map((e, i) => <div key={i}>• {e}</div>)}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Buttons */}
                <div className="px-6 pb-6 pt-3 border-t border-slate-50 flex gap-3">
                    {step === 'upload' && (
                        <button onClick={handleClose} className="flex-1 py-3 bg-slate-100 text-black rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors">
                            إلغاء
                        </button>
                    )}
                    {step === 'preview' && (
                        <>
                            <button onClick={handleClose} className="flex-1 py-3 bg-slate-100 text-black rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors">
                                إلغاء
                            </button>
                            <button
                                onClick={handleImport}
                                disabled={validCount === 0}
                                className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                </svg>
                                استيراد {validCount} منتج
                            </button>
                        </>
                    )}
                    {step === 'done' && (
                        <button onClick={handleClose} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors">
                            تم ✓
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
