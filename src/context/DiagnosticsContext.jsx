import React, { createContext, useContext, useState } from 'react';

const DiagnosticsContext = createContext();

export const DiagnosticsProvider = ({ children }) => {
    // Structure: { 'file/path': [{ message, severity, startLineNumber, ... }] }
    const [diagnostics, setDiagnostics] = useState({});

    const updateDiagnostics = (fileId, markers) => {
        setDiagnostics(prev => {
            // Only update if changed to avoid renders
            if (JSON.stringify(prev[fileId]) === JSON.stringify(markers)) return prev;

            const newDiag = { ...prev };
            if (!markers || markers.length === 0) {
                delete newDiag[fileId];
            } else {
                newDiag[fileId] = markers;
            }
            return newDiag;
        });
    };

    const clearDiagnostics = (fileId) => {
        setDiagnostics(prev => {
            if (!prev[fileId]) return prev;
            const newDiag = { ...prev };
            delete newDiag[fileId];
            return newDiag;
        });
    };

    const getAllDiagnostics = () => {
        return Object.entries(diagnostics).flatMap(([file, markers]) =>
            markers.map(m => ({ ...m, file }))
        );
    };

    return (
        <DiagnosticsContext.Provider value={{ diagnostics, updateDiagnostics, clearDiagnostics, getAllDiagnostics }}>
            {children}
        </DiagnosticsContext.Provider>
    );
};

// Custom hook to use the diagnostics context
export function useDiagnostics() {
    const context = useContext(DiagnosticsContext);
    if (!context) {
        throw new Error('useDiagnostics must be used within a DiagnosticsProvider');
    }
    return context;
}
