import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { AuthProvider } from "./contexts/AuthContext";
import { Elements } from "@stripe/react-stripe-js";
import { getStripe } from "./lib/stripe";
import { Analytics } from "@vercel/analytics/react";

const stripePromise = getStripe();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <Elements stripe={stripePromise}>
        <App />
        <Analytics />
      </Elements>
    </AuthProvider>
  </StrictMode>
);
