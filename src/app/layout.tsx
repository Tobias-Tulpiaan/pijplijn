import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tulpiaan Pijplijn",
  description: "Intern dashboard voor recruitment pijplijn",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
