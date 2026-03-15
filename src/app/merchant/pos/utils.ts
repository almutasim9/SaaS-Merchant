import { Product, CartItem, POSOrder } from './types';

export const findCombination = (product: Product, selectedOpts: Record<string, string>) => {
    if (!product.attributes?.variantCombinations) return null;
    const sortedKeys = Object.keys(selectedOpts).sort();
    const comboId = sortedKeys.map(k => `${k}:${selectedOpts[k]}`).join('|');
    return product.attributes.variantCombinations.find(c => c.id === comboId);
};

export const calculateSubtotal = (cart: CartItem[]) => {
    return cart.reduce((sum, item) => sum + ((item.price || 0) * item.quantity), 0);
};

export const handlePrintReceipt = (order: POSOrder, currency: string = '', merchantName: string = 'Tajer Zone POS') => {
    const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
        <meta charset="utf-8">
        <title>Receipt</title>
        <style>
            @page { margin: 0; size: 80mm auto; }
            body { 
                font-family: Arial, sans-serif; 
                width: 72mm; margin: 0 auto; 
                padding: 4mm; font-size: 13px; color: #000;
            }
            .text-center { text-align: center; }
            .font-bold { font-weight: bold; }
            .mb-1 { margin-bottom: 6px; }
            .border-b { border-bottom: 1px dashed #000; padding-bottom: 8px; margin-bottom: 8px; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            th, td { padding: 4px; border-bottom: 1px solid #eee; text-align: right; }
            .total { display: flex; justify-content: space-between; font-weight: bold; border-top: 1px dashed #000; padding-top: 8px; font-size: 16px; }
            .selections { font-size: 10px; color: #666; display: block; }
        </style>
    </head>
    <body>
        <div class="text-center font-bold mb-1" style="font-size: 20px;">${merchantName}</div>
        <div class="text-center mb-1">تاريخ: ${new Date().toLocaleString('ar-EG')}</div>
        <div class="text-center mb-1 border-b">رقم الفاتورة: ${order.id.slice(0, 8).toUpperCase()}</div>
        
        <table>
            <thead>
                <tr>
                    <th>المنتج</th>
                    <th>الكمية</th>
                    <th>السعر</th>
                </tr>
            </thead>
            <tbody>
                ${order.items.map((item: any) => `
                    <tr>
                        <td>
                            ${item.name}
                            ${item.selections ? `<span class="selections">(${Object.values(item.selections).join(', ')})</span>` : ''}
                        </td>
                        <td>${item.quantity}</td>
                        <td>${item.price}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        ${order.discountAmount > 0 ? `
            <div style="display:flex; justify-content:space-between; font-size:12px;">
                <span>الخصم:</span>
                <span>-${order.discountAmount}</span>
            </div>
        ` : ''}

        ${(order.delivery_fee || 0) > 0 ? `
            <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom: 4px;">
                <span>رسوم التوصيل:</span>
                <span>${order.delivery_fee} ${currency}</span>
            </div>
        ` : ''}

        <div class="total">
            <span>الإجمالي:</span>
            <span>${order.total} ${currency}</span>
        </div>

        <div class="text-center" style="margin-top:20px; font-size:10px;">شكراً لزيارتكم!</div>
    </body>
    </html>`;

    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    iframe.contentDocument?.write(html);
    iframe.contentDocument?.close();
    
    setTimeout(() => {
        iframe.contentWindow?.print();
        setTimeout(() => {
            if (iframe.parentNode) document.body.removeChild(iframe);
        }, 1000);
    }, 500);
};
