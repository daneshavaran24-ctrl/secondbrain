import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './components/ui/theme-provider'
import { PlatformManager } from './utils/platformUtils'
import { autoExecuteCleanupIfRequested } from './utils/finalCleanupExecutor'
import { autoExecuteCompleteCleanup } from './utils/completeDataCleanup'

// Initialize platform-specific configurations
PlatformManager.initialize().catch(console.warn);

// اجرای پاکسازی خودکار در صورت درخواست
autoExecuteCleanupIfRequested()
autoExecuteCompleteCleanup()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="brainforge-theme">
      <App />
    </ThemeProvider>
  </StrictMode>,
)
