"use client";
import { useState } from "react";

type Img = { id:string; url:string; altText:string|null };
export default function ProductGallery({ images, productName }:{images:Img[];productName:string}) {
  const [active,setActive]=useState(0);
  if(!images.length) return <div className="detail-image"><span>Productfoto volgt</span></div>;
  return <div className="product-gallery">
    <div className="detail-image"><img src={images[active].url} alt={images[active].altText??productName}/></div>
    {images.length>1&&<div className="gallery-thumbs">{images.map((img,i)=><button type="button" className={i===active?"active":""} onClick={()=>setActive(i)} key={img.id}><img src={img.url} alt={`${productName} foto ${i+1}`}/></button>)}</div>}
  </div>;
}
