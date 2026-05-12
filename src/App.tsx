import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import Header from './components/header/header';
import InfoSection from './components/infoSection/InfoSection';
import Footer from './components/footer/footer';
import Home from './pages/website/home/Home';
import ScrollToTop from './components/scrollToTop/ScrollToTop';
import './App.css';

function Layout(): React.JSX.Element {
  return (
    <>
      <Header />
      <Outlet />
      <InfoSection />
      <Footer />
    </>
  );
}

function App(): React.JSX.Element {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
