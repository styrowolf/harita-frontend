import React from 'react'
import ReactDOM from 'react-dom/client'
import Index from './pages/index';

// radix
import "@radix-ui/themes/styles.css"
import { Theme } from '@radix-ui/themes'

// maplibre
import 'maplibre-gl/dist/maplibre-gl.css';
import { BrowserRouter, Route, Routes } from 'react-router'
import Dashboard from './pages/dashboard';
import NewMap from './pages/newMap';
import ViewMap from './pages/viewMap';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Theme accentColor="green">
      <BrowserRouter>
        <Routes>
          <Route index element={<Index />} />
          <Route path='/dashboard' element={<Dashboard />}></Route>
          <Route path='/newMap' element={<NewMap />}></Route>
          <Route path='/viewMap/:id' element={<ViewMap />}></Route>
        </Routes>
      </BrowserRouter>
    </Theme>
  </React.StrictMode>,
)
