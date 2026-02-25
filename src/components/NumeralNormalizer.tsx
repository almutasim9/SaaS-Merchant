'use client';

import { useEffect } from 'react';

export default function NumeralNormalizer() {
    useEffect(() => {
        const handleInput = (e: Event) => {
            const target = e.target as HTMLInputElement | HTMLTextAreaElement;

            // Only procceed if target is an input or textarea
            if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {

                // If the value contains Eastern Arabic Numerals
                if (/[٠١٢٣٤٥٦٧٨٩]/.test(target.value)) {
                    // Check if it's a number/tel/price field specifically, or if the value is purely numbers
                    // The user said "any place in the system where you input a number"
                    // To be safe and comprehensive, let's just convert any Eastern Arabic number to English number globally.
                    const newValue = target.value.replace(/[٠-٩]/g, (d: string) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());

                    // React overrides native value setter, so we must call the native one to trigger a standard event
                    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(target), 'value')?.set;

                    if (nativeInputValueSetter) {
                        nativeInputValueSetter.call(target, newValue);
                        // Dispatch input event to force React's synthetic event to pick up the change
                        target.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                }
            }
        };

        // Use capture phase to intercept the event before React does
        document.addEventListener('input', handleInput, true);

        return () => {
            document.removeEventListener('input', handleInput, true);
        };
    }, []);

    return null;
}
