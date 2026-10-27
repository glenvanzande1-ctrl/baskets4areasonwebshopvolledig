type ProductCardProps = {
  slug: string;
  name: string;
  category?: string | null;
  image?: string | null;
  imageAlt?: string | null;
  price?: string | null;
  badge?: string | null;
};

export default function StoreProductCard({
  slug,
  name,
  category,
  image,
  imageAlt,
  price,
  badge,
}: ProductCardProps) {
  return (
    <a className="shop-product-card" href={`/product/${slug}`}>
      <div className="shop-product-media">
        {image ? (
          <img src={image} alt={imageAlt || name} loading="lazy" />
        ) : (
          <div className="shop-product-placeholder">Baskets4areason</div>
        )}
        {badge && <span className="shop-product-badge">{badge}</span>}
        <span className="shop-favorite" aria-hidden="true">♡</span>
      </div>
      <div className="shop-product-body">
        {category && <span className="shop-product-category">{category}</span>}
        <h3>{name}</h3>
        <div className="shop-product-bottom">
          <div>
            <div className="shop-stars" aria-hidden="true">★★★★★</div>
            <strong>{price ? `€ ${price}` : "Prijs op aanvraag"}</strong>
          </div>
          <span className="shop-cart-icon" aria-hidden="true">🛍</span>
        </div>
      </div>
    </a>
  );
}
