"use client";
import { useEffect, useState } from "react";

type C = { id:string; name:string; slug:string; active:boolean; productCount:number };
export default function CategoriesPage() {
  const [items,setItems]=useState<C[]>([]); const [name,setName]=useState(""); const [error,setError]=useState("");
  async function load(){ const r=await fetch("/api/admin/categories",{cache:"no-store"}); if(r.ok) setItems(await r.json()); }
  useEffect(()=>{load()},[]);
  async function add(e:React.FormEvent){e.preventDefault(); setError(""); const r=await fetch("/api/admin/categories",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({name})}); const d=await r.json(); if(!r.ok){setError(d.error||"Mislukt");return;} setName(""); load();}
  async function remove(id:string){if(!confirm("Categorie verwijderen? Producten blijven bestaan zonder categorie."))return; await fetch(`/api/admin/categories?id=${id}`,{method:"DELETE"}); load();}
  return <main className="admin-shell"><section className="admin-card"><a className="back" href="/admin">← Beheer</a><h1>Categorieën</h1><form className="inline-form" onSubmit={add}><input className="input" value={name} onChange={e=>setName(e.target.value)} required placeholder="bv. Ontbijtmanden"/><button className="btn">Toevoegen</button></form>{error&&<p className="error">{error}</p>}<div className="category-list">{items.map(c=><div className="category-row" key={c.id}><div><strong>{c.name}</strong><div className="small muted">{c.productCount} product(en) · {c.slug}</div></div><button className="text-btn danger" onClick={()=>remove(c.id)}>Verwijderen</button></div>)}</div></section></main>;
}
