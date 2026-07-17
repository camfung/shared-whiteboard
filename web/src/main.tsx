import { createRoot } from 'react-dom/client'
import App from './App'

// No StrictMode: its double-mount briefly opens two sync sessions per tab.
createRoot(document.getElementById('root')!).render(<App />)
