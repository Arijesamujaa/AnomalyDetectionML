import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import FileUpload from './components/FileUpload';
import ResultsPage from './components/ResultsPage';
import AlgorithmSelection from './components/AlgorithmSelection';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<FileUpload />} />
        <Route path="/select-algorithm/:fileId" element={<AlgorithmSelection />} />
        <Route path="/results/:fileId" element={<ResultsPage />} />
      </Routes>
    </Router>
  );
}

export default App;
