import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// 1. ADICIONA ESTE IMPORT:
import ProvedorAutenticacao from "./ProvedorAutenticacao";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Biblioteca Haydee",
  description: "Gestão do acervo de livros",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt">
      <body className={inter.className}>
        {/* 2. ENVOLVE O CHILDREN AQUI: */}
        <ProvedorAutenticacao>
          {children}
        </ProvedorAutenticacao>
      </body>
    </html>
  );
}