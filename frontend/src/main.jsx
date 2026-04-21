import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { Provider } from 'react-redux'
import { store, persistor } from './redux/store'
import { PersistGate } from 'redux-persist/integration/react'
import { SocketProvider } from './context/SocketContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-swiggy-orange text-white">
          <div className="text-4xl font-black italic tracking-tighter mb-4 animate-bounce">Swiggy</div>
          <div className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-80">Rehydrating for you...</div>
        </div>
      } persistor={persistor}>
        <SocketProvider>
          <App />
        </SocketProvider>
      </PersistGate>
    </Provider>
  </React.StrictMode>,
)
