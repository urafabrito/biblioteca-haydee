"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function Home() {
  const [livros, setLivros] = useState<any[]>([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const carregarLivros = async () => {
      const { data } = await supabase.from("livros").select("*").order("created_at", { ascending: false });
      if (data) setLivros(data);
      setLoading(false);
    };
    carregarLivros();
  }, []);

  const livrosFiltrados = livros.filter(livro => 
    livro.titulo.toLowerCase().includes(busca.toLowerCase()) || 
    (livro.autor && livro.autor.toLowerCase().includes(busca.toLowerCase()))
  );

  // NOVA FUNÇÃO: Fazer Logout
  const fazerLogout = async () => {
    if (confirm("Queres mesmo sair do sistema?")) {
      await supabase.auth.signOut();
      router.push("/login"); // Volta para a tela de login
    }
  };

  return (
    <main className="min-h-screen bg-[#F2F2F7] p-6 pb-20">
      <div className="max-w-md mx-auto space-y-6">
        
        {/* HEADER ATUALIZADO COM BOTÃO DE LOGOUT ALINHADO */}
        <header className="pt-8 flex items-start justify-between gap-2">
          {/* Título e Subtítulo - Com flex-1 para empurrar o botão para a direita */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-black tracking-tight mb-1">Biblioteca Haydee</h1>
            <p className="text-[15px] text-zinc-500">O Seu acervo na palma da mão.</p>
          </div>
          
          {/* Botão de Logout */}
          <button 
            onClick={fazerLogout}
            className="flex-shrink-0 bg-white border border-zinc-200 text-zinc-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 p-2 rounded-full shadow-sm transition-all"
            title="Sair do sistema"
          >
            <span className="text-sm font-medium leading-none px-2">Sair</span>
          </button>
        </header>

        {/* Botões de Ação */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <Link href="/cadastrar" className="col-span-1 bg-black text-white hover:bg-zinc-800 rounded-xl h-12 text-[14px] font-medium transition-colors flex items-center justify-center">
            + Novo Livro
          </Link>
          <Link href="/emprestimos" className="col-span-1 bg-white border border-zinc-200 text-black hover:bg-zinc-50 rounded-xl h-12 text-[14px] font-medium shadow-sm transition-colors flex items-center justify-center">
            Empréstimos
          </Link>
          <Link href="/localizacoes" className="bg-[#F2F2F7] hover:bg-zinc-200 text-zinc-700 rounded-xl h-10 text-[13px] font-medium transition-colors flex items-center justify-center gap-2">
            Estantes
          </Link>
          <Link href="/contatos" className="bg-[#F2F2F7] hover:bg-zinc-200 text-zinc-700 rounded-xl h-10 text-[13px] font-medium transition-colors flex items-center justify-center gap-2">
            Leitores
          </Link>
        </div>

        {/* Barra de Pesquisa */}
        <div className="relative pt-2">
          <input 
            type="text" 
            placeholder="Pesquisar por título ou autor..." 
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full bg-white rounded-xl h-12 px-4 text-[14px] outline-none shadow-sm border border-zinc-200 focus:border-black focus:ring-1 focus:ring-black transition-all"
          />
        </div>

        <div className="flex items-center justify-between mt-8 mb-4">
          <h2 className="text-[16px] font-semibold text-black">O Seu Acervo</h2>
          <span className="bg-zinc-200/50 text-zinc-500 px-2.5 py-1 rounded-full text-[12px] font-semibold">
            {livrosFiltrados.length} {livrosFiltrados.length === 1 ? 'livro' : 'livros'}
          </span>
        </div>

        {loading ? (
          <p className="text-center text-zinc-400 text-sm py-10">Carregando estante...</p>
        ) : livrosFiltrados.length === 0 ? (
          <div className="bg-white text-center rounded-2xl p-8 border border-zinc-100 shadow-sm">
            <p className="text-zinc-500 text-[14px] font-medium">Nenhum livro encontrado.</p>
            {busca === "" && <p className="text-zinc-400 text-[12px] mt-1">Clique em "Novo Livro" para começar.</p>}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {livrosFiltrados.map((livro) => (
              <Link href={`/livro/${livro.id}`} key={livro.id} className="flex flex-col gap-2 group cursor-pointer">
                <div className="aspect-[2/3] bg-white rounded-lg border border-zinc-200 overflow-hidden shadow-sm relative transition-transform group-hover:scale-[1.02]">
                  {livro.capa_url ? (
                    <img src={livro.capa_url} alt={livro.titulo} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-zinc-100 flex items-center justify-center p-2 text-center">
                      <span className="text-[10px] text-zinc-400 font-medium leading-tight">{livro.titulo}</span>
                    </div>
                  )}
                </div>
                <div className="px-1">
                  <p className="text-[12px] font-semibold text-black line-clamp-1 leading-tight" title={livro.titulo}>{livro.titulo}</p>
                  <p className="text-[10px] text-zinc-500 line-clamp-1 mt-0.5" title={livro.autor}>{livro.autor}</p>
                </div>
              </Link>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}