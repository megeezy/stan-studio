import { useContext } from 'react';
import { DiagnosticsContext } from '../context/DiagnosticsContextCore';

export function useDiagnostics() {
    const context = useContext(DiagnosticsContext);
    if (!context) {
        throw new Error('useDiagnostics must be used within a DiagnosticsProvider');
    }
    return context;
}
