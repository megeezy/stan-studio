import React from 'react';
import { GitBranch, XCircle, AlertTriangle, Radio, Bell } from 'lucide-react';

const StatusBar = () => {
    return (
        <footer className="status-bar">
            <div className="status-left">
                <div className="status-item bg-accent">
                    <GitBranch size={12} style={{ marginRight: 4 }} />
                    <span>master*</span>
                </div>
                <div className="status-item">
                    <XCircle size={12} style={{ marginRight: 4 }} />
                    <span>0</span>
                    <AlertTriangle size={12} style={{ marginLeft: 8, marginRight: 4 }} />
                    <span>1</span>
                </div>
            </div>

            <div className="status-right">
                <div className="status-item">Ln 32, Col 48</div>
                <div className="status-item">Spaces: 2</div>
                <div className="status-item">UTF-8</div>
                <div className="status-item">JavaScript</div>
                <div className="status-item status-live-pulse"><Radio size={12} style={{ marginRight: 4 }} /> Go Live</div>
                <div className="status-item">Prettier</div>
                <div className="status-item"><Bell size={12} /></div>
            </div>
        </footer>
    );
};

export default StatusBar;
