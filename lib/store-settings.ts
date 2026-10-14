import { prisma } from "@/lib/db";
export async function getStoreSettings(){
  return prisma.storeSettings.upsert({where:{id:"default"},update:{},create:{id:"default",pickupEnabled:true,pickupLabel:"Afhalen in Zele",deliveryEnabled:false,deliveryFee:"5.95",deliveryTaxPercentage:"21"}});
}
export function postalCodes(value:string|null){return (value||"").split(/[;,\s]+/).map(v=>v.trim()).filter(Boolean)}
