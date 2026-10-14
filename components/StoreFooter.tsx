export default function StoreFooter(){
  return <footer className="store-footer">
    <div className="footer-inner">
      <div className="footer-brand">
        <img src="/baskets4areason-logo.png" alt="Baskets4areason" />
        <p>Ontbijt- en geschenkmanden met smaak, samengesteld met aandacht.</p>
      </div>
      <div>
        <strong>Shop</strong>
        <a href="/producten">Alle producten</a>
        <a href="/winkelmand">Winkelmand</a>
        <a href="/account">Mijn account</a>
      </div>
      <div>
        <strong>Afhalen</strong>
        <p>Zandberg 10<br/>9240 Zele, België</p>
        <p className="footer-small">Afhalen op afspraak. Regionale levering wordt verder ingesteld.</p>
      </div>
    </div>
    <div className="footer-bottom">© {new Date().getFullYear()} Baskets4areason · EST 2017</div>
  </footer>
}
