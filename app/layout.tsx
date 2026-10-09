import "./globals.css";

export const metadata = {
  title: "Baskets4areason",
  description: "Webshop, beheer en fysieke winkel",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="nl">
      <body>{children}</body>
    </html>
  );
}
