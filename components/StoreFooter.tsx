export default function StoreFooter() {
  return (
    <footer className="shop-footer">
      <div className="shop-footer-inner">
        <div className="shop-footer-brand">
          <img src="/baskets4areason-logo.png" alt="Baskets4areason" />
          <p>Ontbijt- en geschenkmanden met smaak. Met zorg samengesteld in Zele sinds 2017.</p>
        </div>
        <div>
          <strong>Shop</strong>
          <a href="/producten">Alle producten</a>
          <a href="/winkelmand">Winkelmand</a>
          <a href="/account">Mijn account</a>
        </div>
        <div>
          <strong>Service</strong>
          <p>Zandberg 10<br />9240 Zele, België</p>
          <p>Afhalen op afspraak · Regionale levering volgens beschikbaarheid.</p>
        </div>
        <div>
          <strong>Waarom Baskets4areason</strong>
          <p>Persoonlijke service</p>
          <p>Veilig betalen via Mollie</p>
          <p>Realtime voorraad</p>
        </div>
      </div>
      <div className="shop-footer-bottom">© {new Date().getFullYear()} Baskets4areason · EST 2017</div>
    </footer>
  );
}
