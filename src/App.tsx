import { BrowserRouter } from "react-router-dom";
import { SpotlightBackground } from "@/components/ui";
import { AuthProvider } from "./context";
import { AppRoutes } from "./routes";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SpotlightBackground>
          <AppRoutes />
        </SpotlightBackground>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
