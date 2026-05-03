import React, { useState } from 'react';
import { DiagnosticsContext } from './DiagnosticsContextCore';

export const DiagnosticsProvider = ({ children }) => {
    // Structure: { 'file/path': [{ message, severity, startLineNumber, ... }] }
    const [diagnostics, setDiagnostics] = useState({});

    const updateDiagnostics = (fileId, markers) => {
        setDiagnostics(prev => {
            const next = { ...prev };
            if (markers.length === 0) {
                delete next[fileId];
            } else {
                next[fileId] = markers;
            }
            return next;
        });
    };

    const clearDiagnostics = (fileId) => {
        setDiagnostics(prev => {
            const next = { ...prev };
            delete next[fileId];
            return next;
        });
    };

    const getAllDiagnostics = () => {
        const list = [];
        Object.entries(diagnostics).forEach(([file, markers]) => {
            markers.forEach(m => {
                list.push({ ...m, file });
            });
        });
        return list;
    };

    return (
        <DiagnosticsContext.Provider value={{ diagnostics, updateDiagnostics, clearDiagnostics, getAllDiagnostics }}>
            {children}
        </DiagnosticsContext.Provider>
    );
};
