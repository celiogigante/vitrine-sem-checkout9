import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import ScrollToTop from "./ScrollToTop";
import FloatingWhatsAppButton from "./FloatingWhatsAppButton";
import FloatingMapsButton from "./FloatingMapsButton";
import useScrollToTop from "@/hooks/useScrollToTop";

const Layout = () => {
  useScrollToTop();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1" style={{ backgroundColor: '#3A3A32' }}>
        <Outlet />
      </main>
      <Footer />
      <ScrollToTop />
      <FloatingWhatsAppButton />
      <FloatingMapsButton />
    </div>
  );
};

export default Layout;
