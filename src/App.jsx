// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Category from './pages/Category'; 
import PuzzleMontar from './pages/PuzzleMontar';
import SearchResults from './pages/SearchResults';
import Login from './pages/Login';
import Upload from './pages/Upload'; 

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/categoria/:slug" element={<Category />} />
        <Route path="/puzzle/:id" element={<PuzzleMontar />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/login" element={<Login/>} />
        <Route path="/subir" element={<Upload />} />
      </Routes>
    </Router>
  );
}

export default App;
