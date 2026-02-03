import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext'
import { SettingsProvider } from './context/SettingsContext'
import { DiagnosticsProvider } from './context/DiagnosticsContext'
import ErrorBoundary from './components/ErrorBoundary'

console.log("[Main] Rendering application...");
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <SettingsProvider>
          <DiagnosticsProvider>
            <App />
          </DiagnosticsProvider>
        </SettingsProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
)
