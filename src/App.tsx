import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.tsx";
import { TimeregistreringApp } from "./pages/TimeRegistreringApp.tsx";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TimeregistreringApp />
      </AuthProvider>
    </BrowserRouter>
  );
}
