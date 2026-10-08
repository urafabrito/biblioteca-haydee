import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ProvedorAutenticacao from "./ProvedorAutenticacao";
import { Suspense } from "react"; // 🔥 Importamos o Suspense do React

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
        {/* A bolha do Suspense protege a aplicação de erros de construção (build) */}
        <Suspense fallback={<div className="min-h-screen bg-[#F2F2F7] flex items-center justify-center text-zinc-500 font-medium animate-pulse">A carregar sistema...</div>}>
          <ProvedorAutenticacao>
            {children}
          </ProvedorAutenticacao>
        </Suspense>
      </body>
    </html>
  );
}