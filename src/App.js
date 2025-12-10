import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import './App.css';
import MainLayout from './mainlayout/MainLayout';
import Home from './pages/Home';
import { useEffect } from 'react';
import Live from './pages/Live';
import Matches from './pages/Matches';
import BlogFull from './pages/BlogFull';


function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function App() {
  return (
    <div className="min-h-screen">
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="/score" element={<Live />} />
            <Route path="/matches" element={<Matches />} />
            {/* <Route path="/blog" element={<BlogFull />} /> */}
            <Route path="/blog/:id" element={<BlogFull />} />
            <Route path="*" element={<div>404  - Page Not Found</div>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
