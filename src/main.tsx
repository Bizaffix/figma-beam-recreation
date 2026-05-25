import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { Elements } from "@stripe/react-stripe-js";
import { getStripe } from "./lib/stripe";
import { Provider } from "react-redux";
import { store } from "./app/store";

const stripePromise = getStripe();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <Elements stripe={stripePromise}>
        <App />
      </Elements>
    </Provider>
  </StrictMode>
);
