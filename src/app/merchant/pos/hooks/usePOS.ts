import { useReducer, useCallback, useMemo } from 'react';
import { CartItem, POSAction, POSState } from '../types';
import { calculateSubtotal } from '../utils';

const initialState: POSState = {
    cart: [],
    discount: { type: 'fixed', value: 0 },
    customerInfo: null,
    deliveryFee: 0,
    orderId: null,
    isSubmitting: false,
};

function posReducer(state: POSState, action: POSAction): POSState {
    switch (action.type) {
        case 'ADD_ITEM': {
            const existingItemIndex = state.cart.findIndex(item => 
                item.id === action.item.id && 
                JSON.stringify(item.selections) === JSON.stringify(action.item.selections)
            );

            if (existingItemIndex > -1) {
                const newCart = [...state.cart];
                newCart[existingItemIndex] = {
                    ...newCart[existingItemIndex],
                    quantity: newCart[existingItemIndex].quantity + (action.item.quantity || 1)
                };
                return { ...state, cart: newCart };
            }

            return { ...state, cart: [...state.cart, action.item] };
        }

        case 'REMOVE_ITEM':
            return {
                ...state,
                cart: state.cart.filter(item => 
                    !(item.id === action.itemId && JSON.stringify(item.selections) === JSON.stringify(action.selections))
                )
            };

        case 'UPDATE_QUANTITY':
            return {
                ...state,
                cart: state.cart.map(item => 
                    (item.id === action.itemId && JSON.stringify(item.selections) === JSON.stringify(action.selections))
                        ? { ...item, quantity: Math.max(1, action.quantity) }
                        : item
                )
            };

        case 'SET_DISCOUNT':
            return { ...state, discount: action.discount };

        case 'SET_CUSTOMER':
            return { ...state, customerInfo: action.info };

        case 'SET_DELIVERY_FEE':
            return { ...state, deliveryFee: action.fee };

        case 'HYDRATE_ORDER':
            return {
                ...state,
                orderId: action.order.id,
                cart: action.order.items || [],
                customerInfo: action.order.customer_info || null,
                deliveryFee: action.order.delivery_fee || 0,
                // If the order has a discount saved, we might need to parse it back or just reset it
                // For now, let's assume we reset discount on hydration unless we store it explicitly
            };

        case 'CLEAR_CART':
            return { ...initialState };

        case 'SET_SUBMITTING':
            return { ...state, isSubmitting: action.isSubmitting };

        default:
            return state;
    }
}

export function usePOS() {
    const [state, dispatch] = useReducer(posReducer, initialState);

    const subtotal = useMemo(() => calculateSubtotal(state.cart), [state.cart]);

    const discountAmount = useMemo(() => {
        if (state.discount.type === 'percent') {
            return (subtotal * state.discount.value) / 100;
        }
        return state.discount.value;
    }, [subtotal, state.discount]);

    const total = useMemo(() => {
        return Math.max(0, subtotal - discountAmount);
    }, [subtotal, discountAmount]);

    const addToCart = useCallback((item: CartItem) => {
        dispatch({ type: 'ADD_ITEM', item });
    }, []);

    const removeFromCart = useCallback((itemId: string, selections?: Record<string, string>) => {
        dispatch({ type: 'REMOVE_ITEM', itemId, selections });
    }, []);

    const updateQuantity = useCallback((itemId: string, quantity: number, selections?: Record<string, string>) => {
        dispatch({ type: 'UPDATE_QUANTITY', itemId, quantity, selections });
    }, []);

    const setDiscount = useCallback((discount: { type: 'fixed' | 'percent', value: number }) => {
        dispatch({ type: 'SET_DISCOUNT', discount });
    }, []);

    const setCustomer = useCallback((info: any) => {
        dispatch({ type: 'SET_CUSTOMER', info });
    }, []);

    const setDeliveryFee = useCallback((fee: number) => {
        dispatch({ type: 'SET_DELIVERY_FEE', fee });
    }, []);

    const hydrateOrder = useCallback((order: any) => {
        dispatch({ type: 'HYDRATE_ORDER', order });
    }, []);

    const clearCart = useCallback(() => {
        dispatch({ type: 'CLEAR_CART' });
    }, []);

    const setSubmitting = useCallback((isSubmitting: boolean) => {
        dispatch({ type: 'SET_SUBMITTING', isSubmitting });
    }, []);

    return {
        state,
        subtotal,
        discountAmount,
        total,
        addToCart,
        removeFromCart,
        updateQuantity,
        setDiscount,
        setCustomer,
        setDeliveryFee,
        hydrateOrder,
        clearCart,
        setSubmitting,
    };
}
