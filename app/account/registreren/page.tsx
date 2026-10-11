import StoreHeader from "@/components/StoreHeader";
import CustomerRegisterForm from "@/components/CustomerRegisterForm";
export default async function Register({searchParams}:{searchParams:Promise<{next?:string}>}){const {next}=await searchParams;return <><StoreHeader/><main className="store-main auth-page"><div className="auth-card"><span className="eyebrow">Nieuw account</span><h1>Account aanmaken</h1><CustomerRegisterForm next={next||'/account'}/><p>Al klant? <a className="link" href={`/account/login${next?`?next=${encodeURIComponent(next)}`:''}`}>Log in</a>.</p></div></main></>}
