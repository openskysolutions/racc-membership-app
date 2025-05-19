import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import AppRoutes from "@/routes";

import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import "@/App.css";

function App() {
  return (
    <>
      <Navbar />
      <BrowserRouter>
        <ThemeProvider>
          <AppRoutes />
        </ThemeProvider>
      </BrowserRouter>
      <Footer />
    </>
  );
}

export default App;
