"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function RegistarEmprestimo() {
  const [livros, setLivros] = useState<any[]>([]);
  const [contatos, setContatos] = useState<any[]>([]);

  const [buscaLivro, setBuscaLivro] = useState("");
  const [livroSelecionado, setLivroSelecionado] = useState("");
  const [contatoSelecionado, setContatoSelecionado] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    const carregarDados = async () => {
      const { data: dataLivros } = await supabase.from('livros').select('*').order('titulo');
      if (dataLivros) setLivros(dataLivros);

      const { data: dataContatos } = await supabase.from('contatos').select('*').order('nome');
      if (dataContatos) setContatos(dataContatos);
    };
    carregarDados();
  }, []);

  const salvarEmprestimo = async () => {
    if (!livroSelecionado || !contatoSelecionado) {
      setErro("Por favor, selecione o livro e a pessoa para quem vai emprestar.");
      return;
    }

    setLoading(true);
    setErro("");
    setSucesso(false);

    try {
      const { error } = await supabase
        .from('emprestimos')
        .insert([{ livro_id: livroSelecionado, contato_id: contatoSelecionado }]);

      if (error) throw error;

      setSucesso(true);
      setLivroSelecionado("");
      setContatoSelecionado("");
      setBuscaLivro(""); 
      
    } catch (error: any) {
      setErro("Erro ao registrar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 A CORREÇÃO ESTÁ AQUI: Agora pesquisa pelo título OU pelo autor
  const livrosFiltrados = livros.filter(livro => 
    livro.titulo.toLowerCase().includes(buscaLivro.toLowerCase()) ||
    (livro.autor && livro.autor.toLowerCase().includes(buscaLivro.toLowerCase()))
  );

  return (
    <main className="min-h-screen bg-[#F2F2F7] p-6">
      <div className="max-w-md mx-auto space-y-6">
        
        <header className="pt-8">
          <Link href="/" className="text-[#007AFF] text-[15px] hover:underline mb-4 inline-block">
            ← Voltar à Estante
          </Link>
          <h1 className="text-2xl font-semibold text-black tracking-tight">Registrar Empréstimo</h1>
          <p className="text-[14px] text-zinc-500 mt-1">Nunca mais perca o controle dos seus livros.</p>
        </header>

        <form className="bg-white rounded-2xl p-5 shadow-sm border border-zinc-100 space-y-4">
          
          {sucesso && (
            <div className="bg-green-50 text-green-700 p-3 rounded-lg text-[13px] font-medium text-center border border-green-100 mb-2">
              📖 Empréstimo registado com sucesso!
            </div>
          )}

          {erro && <p className="text-[13px] text-red-500 text-center font-medium mb-2">{erro}</p>}

          <div className="space-y-2">
            <label className="text-[13px] font-medium text-zinc-500 ml-1">Qual livro vais emprestar?</label>
            
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-[12px]"></span>
              <input 
                type="text" 
                placeholder="Pesquisar livro ou autor..." 
                value={buscaLivro}
                onChange={(e) => setBuscaLivro(e.target.value)}
                className="w-full bg-white rounded-xl h-10 pl-4 pr-3 text-[13px] outline-none border border-zinc-200 focus:border-black transition-all mb-2 shadow-sm"
              />
            </div>

            <select 
              value={livroSelecionado}
              onChange={(e) => setLivroSelecionado(e.target.value)}
              className="w-full bg-[#F2F2F7] rounded-xl h-11 px-4 text-[14px] outline-none focus:ring-2 focus:ring-black/5 transition-all text-zinc-700"
            >
              <option value="">(Seleciona um livro da estante)</option>
              {livrosFiltrados.map((livro) => (
                <option key={livro.id} value={livro.id}>
                  {livro.titulo} {livro.autor ? `- ${livro.autor}` : ""}
                </option>
              ))}
            </select>
            {livrosFiltrados.length === 0 && (
              <p className="text-[12px] text-red-500 ml-1">Nenhum livro ou autor encontrado.</p>
            )}
          </div>

          <div className="space-y-1 mt-4">
            <label className="text-[13px] font-medium text-zinc-500 ml-1">Para quem?</label>
            <select 
              value={contatoSelecionado}
              onChange={(e) => setContatoSelecionado(e.target.value)}
              className="w-full bg-[#F2F2F7] rounded-xl h-11 px-4 text-[14px] outline-none focus:ring-2 focus:ring-black/5 transition-all text-zinc-700"
            >
              <option value="">(Seleciona o leitor)</option>
              {contatos.map((contato) => (
                <option key={contato.id} value={contato.id}>
                  {contato.nome}
                </option>
              ))}
            </select>
            
            <div className="text-right mt-1">
               <Link href="/contatos" className="text-[12px] text-[#007AFF] hover:underline">
                 + Adicionar novo leitor
               </Link>
            </div>
          </div>

          <button 
            type="button"
            onClick={salvarEmprestimo}
            disabled={loading}
            className="w-full bg-black text-white hover:bg-zinc-800 rounded-xl h-12 text-base font-medium transition-colors mt-6 shadow-md disabled:opacity-50"
          >
            {loading ? "A Registar..." : "Oficializar Empréstimo"}
          </button>
        </form>

      </div>
    </main>
  );
}