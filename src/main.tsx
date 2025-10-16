import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import App from "@/App.tsx";
import { ThemeProvider } from "@/providers/theme-provider";
import "@/index.css";
import { BrowserRouter } from "react-router-dom";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <StrictMode>
      <BrowserRouter>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </BrowserRouter>
  </StrictMode>
);
