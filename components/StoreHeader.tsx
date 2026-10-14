import { readCart } from "@/lib/cart";
import { getCustomerSession } from "@/lib/customer-auth";

export default async function StoreHeader() {
  const [cart, customer] = await Promise.all([readCart(), getCustomerSession()]);
  const count = cart?.items.reduce((n, item) => n + item.quantity, 0) ?? 0;

  return (
    <>
      <div className="store-announcement">Ontbijt & geschenkmanden met smaak · Afhalen in Zele</div>
      <header className="store-header">
        <a className="store-logo" href="/" aria-label="Baskets4areason home">
          <img src="/baskets4areason-logo.png" alt="Baskets4areason" />
        </a>
        <nav aria-label="Hoofdnavigatie">
          <a href="/">Home</a>
          <a href="/producten">Shop</a>
          <a href={customer ? "/account" : "/account/login"}>{customer ? "Mijn account" : "Inloggen"}</a>
          <a className="cart-link" href="/winkelmand">Winkelmand <span>{count}</span></a>
        </nav>
      </header>
    </>
  );
}
