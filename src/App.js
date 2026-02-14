// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Upload from './pages/Upload';
import Gallery from './pages/Gallery';
import RetrieveFile from './pages/RetrieveFile';
import Vault from './pages/Vault';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/retrieve" element={<RetrieveFile />} />
          <Route path="/vault" element={<Vault />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
