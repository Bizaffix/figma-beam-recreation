import { loadStripe, Stripe } from '@stripe/stripe-js';

// Get Stripe publishable key from environment variables
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';

if (!stripePublishableKey) {
  console.warn('Stripe publishable key is not set. Please set VITE_STRIPE_PUBLISHABLE_KEY in your .env file.');
}

// Initialize Stripe
let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(stripePublishableKey);
  }
  return stripePromise;
};

