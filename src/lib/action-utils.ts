export type ActionResponse<T = any> = {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
};

/**
 * Standardizes server action execution with consistent error handling.
 */
export async function executeAction<T>(
    action: () => Promise<T>,
    errorMessage = 'حدث خطأ غير متوقع'
): Promise<ActionResponse<T>> {
    try {
        const data = await action();
        return { success: true, data };
    } catch (error: any) {
        console.error('[ActionError]:', error);
        return {
            success: false,
            error: error.message || errorMessage
        };
    }
}
