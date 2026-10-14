"use client";
export default function PrintReceiptButton() {
  return <button className="btn" type="button" onClick={() => window.print()}>Bon afdrukken</button>;
}
