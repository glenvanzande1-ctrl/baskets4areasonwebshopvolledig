import { redirect } from "next/navigation";
import StoreHeader from "@/components/StoreHeader";
import CustomerLoginForm from "@/components/CustomerLoginForm";
import CustomerRegisterForm from "@/components/CustomerRegisterForm";
import CheckoutOptions from "@/components/CheckoutOptions";
import { getCustomerSession } from "@/lib/customer-auth";
import { readCart, variantLabel } from "@/lib/cart";
import { prisma } from "@/lib/db";
import { getStoreSettings, postalCodes } from "@/lib/store-settings";
export default async function Checkout(){
 const cart=await readCart();if(!cart||cart.items.length===0)redirect('/winkelmand');const session=await getCustomerSession();
 if(!session)return <><StoreHeader/><main className="store-main"><span className="eyebrow">Afrekenen</span><h1>Maak je account aan of log in</h1><p className="muted">Een klantenaccount is vereist om een bestelling te plaatsen. Je winkelmand blijft bewaard.</p><div className="checkout-auth"><div className="auth-card"><h2>Bestaande klant</h2><CustomerLoginForm next="/afrekenen"/></div><div className="auth-card"><h2>Nieuwe klant</h2><CustomerRegisterForm next="/afrekenen"/></div></div></main></>;
 const [customer,settings]=await Promise.all([prisma.customer.findUnique({where:{id:session.customerId}}),getStoreSettings()]); const total=cart.items.reduce((n,i)=>n+Number(i.variant.price)*i.quantity,0);
 return <><StoreHeader/><main className="store-main checkout-layout"><section><span className="eyebrow">Afrekenen</span><h1>Levering & betaling</h1><div className="checkout-step"><h2>1. Klant</h2><p>{customer?.firstName} {customer?.lastName}<br/>{customer?.email}</p></div><CheckoutOptions subtotal={total} pickupEnabled={settings.pickupEnabled} pickupLabel={settings.pickupLabel} deliveryEnabled={settings.deliveryEnabled} deliveryFee={Number(settings.deliveryFee)} freeDeliveryFrom={settings.freeDeliveryFrom?Number(settings.freeDeliveryFrom):null} minimumOrderAmount={settings.minimumOrderAmount?Number(settings.minimumOrderAmount):null} postalCodes={postalCodes(settings.deliveryPostalCodes)}/></section><aside className="order-summary"><h2>Overzicht</h2>{cart.items.map(i=><div className="summary-line" key={i.id}><span>{i.quantity}× {i.variant.product.name}<small>{variantLabel(i.variant)}</small></span><strong>€ {(Number(i.variant.price)*i.quantity).toFixed(2).replace('.',',')}</strong></div>)}<div className="cart-total"><span>Subtotaal incl. btw</span><strong>€ {total.toFixed(2).replace('.',',')}</strong></div><p className="muted small">Korting en eventuele leverkosten worden toegepast vóór je naar Mollie gaat.</p></aside></main></>
}
