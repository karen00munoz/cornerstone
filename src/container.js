import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Cinetool from './components/Cinetool';

import React from 'react'

export default function container() {
  return (
    <Router>
        <Routes>
            <Route path="cinetool" element={<Cinetool />} />
        </Routes>
    </Router>
  )
}
