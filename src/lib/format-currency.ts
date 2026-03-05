export type CurrencyPreference = 'IQD' | 'USD';

export function formatCurrency(amount: number, currency: CurrencyPreference = 'IQD'): string {
    if (currency === 'USD') {
        // Enforce 2 decimal places for USD, or use whole number if no cents
        return `$${amount.toLocaleString('en-US', { minimumFractionDigits: amount % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 })}`;
    }
    return `${amount.toLocaleString('en-US')} د.ع`;
}

export function getCurrencySymbol(currency: CurrencyPreference = 'IQD'): string {
    return currency === 'USD' ? '$' : 'د.ع';
}
