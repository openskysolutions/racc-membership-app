import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { Outlet } from "react-router-dom";
import { isAndroid } from "@/lib/platform";

const PagesLayout = () => {
  const isAndroidDevice = isAndroid();
  
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main 
        className="flex flex-col flex-grow"
        style={isAndroidDevice ? { paddingBottom: 'var(--safe-area-inset-bottom, 0px)' } : undefined}
      >
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
 
export default PagesLayout;