import { CheckoutFlow } from './CheckoutFlow';

export default function CheckoutPage() {
  return (
    <main className="container">
      <h1>Checkout</h1>
      <p className="muted">
        Create a PIX cash-in, display QR / copia-e-cola, and poll status with TanStack Query.
      </p>
      <CheckoutFlow />
    </main>
  );
}
