import StoreHeader from "@/components/StoreHeader";
import CustomerLoginForm from "@/components/CustomerLoginForm";
export default async function Login({searchParams}:{searchParams:Promise<{next?:string}>}){const {next}=await searchParams;return <><StoreHeader/><main className="store-main auth-page"><div className="auth-card"><span className="eyebrow">Mijn account</span><h1>Inloggen</h1><CustomerLoginForm next={next||'/account'}/><p>Nog geen account? <a className="link" href={`/account/registreren${next?`?next=${encodeURIComponent(next)}`:''}`}>Maak er één aan</a>.</p></div></main></>}
