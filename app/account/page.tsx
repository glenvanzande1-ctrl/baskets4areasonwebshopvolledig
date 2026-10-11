import { redirect } from "next/navigation";
import StoreHeader from "@/components/StoreHeader";
import { getCustomerSession } from "@/lib/customer-auth";
import { prisma } from "@/lib/db";
export default async function Account(){const session=await getCustomerSession();if(!session)redirect('/account/login');const c=await prisma.customer.findUnique({where:{id:session.customerId}});if(!c)redirect('/account/login');return <><StoreHeader/><main className="store-main narrow"><span className="eyebrow">Mijn account</span><h1>Welkom, {c.firstName}</h1><div className="account-grid"><div className="tile"><strong>Mijn gegevens</strong><p>{c.firstName} {c.lastName}<br/>{c.email}{c.phone&&<><br/>{c.phone}</>}</p></div><div className="tile"><strong>Bestellingen</strong><p>Worden actief zodra Mollie in fase 5 gekoppeld is.</p></div></div><form action="/api/customer/logout" method="post"><button className="btn secondary">Uitloggen</button></form></main></>}
