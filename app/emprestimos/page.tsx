"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation"; // Importante para atualizar a página sem erros

export default function PainelEmprestimos() {
  const router = useRouter(); // Inicializar o router

  const [emprestimos, setEmprestimos] = useState<any[]>([]);
  const [localizacoes, setLocalizacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [devolvendoId, setDevolvendoId] = useState<string | null>(null);
  const [novaLocalizacao, setNovaLocalizacao] = useState("");
  const [processando, setProcessando] = useState(false);

  const carregarDados = async () => {
    // Para contornar a cache agressiva, forçamos o cliente a buscar os dados sempre
    const { data: dataEmp } = await supabase
      .from("emprestimos")
      .select("*, livros(*), contatos(*)");
    
    if (dataEmp) {
       // Ordenar para garantir que vemos as mudanças
       const ordenados = [...dataEmp].sort((a, b) => a.id.localeCompare(b.id));
       setEmprestimos(ordenados);
    }

    const { data: dataLoc } = await supabase.from("localizacoes").select("*");
    if (dataLoc) setLocalizacoes(dataLoc);

    setLoading(false);
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const confirmarDevolucao = async (emprestimoId: string, livroId: string) => {
    setProcessando(true);

    try {
      // 1. Atualizar o livro
      await supabase
        .from("livros")
        .update({ localizacao_id: novaLocalizacao || null })
        .eq("id", livroId);

      // 2. Apagar o empréstimo
      await supabase.from("emprestimos").delete().eq("id", emprestimoId);

      // Limpar os estados
      setDevolvendoId(null);
      setNovaLocalizacao("");
      
      // Recarregar os dados localmente
      await carregarDados();
      
      // Forçar o Next.js a atualizar a rota
      router.refresh();

    } catch (error) {
      console.error("Erro na devolução:", error);
    } finally {
      setProcessando(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F2F2F7] p-6">
      <div className="max-w-md mx-auto space-y-6">
        
        <header className="pt-8">
          <Link href="/" className="text-[#007AFF] text-[15px] hover:underline mb-4 inline-block">
            ← Voltar à Estante
          </Link>
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-2xl font-semibold text-black tracking-tight">Livros Emprestados</h1>
              <p className="text-[14px] text-zinc-500 mt-1">Gere as devoluções do teu acervo.</p>
            </div>
            <Link href="/emprestar" className="bg-[#007AFF] text-white px-4 py-2 rounded-xl text-[13px] font-medium shadow-sm hover:bg-blue-600 transition-colors">
              + Novo
            </Link>
          </div>
        </header>

        {loading ? (
          <p className="text-center text-zinc-400 text-sm mt-10">A carregar registos...</p>
        ) : emprestimos.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-zinc-100 text-center shadow-sm">
            <p className="text-[14px] text-zinc-500 font-medium mb-1">Nenhum livro emprestado.</p>
            <p className="text-[12px] text-zinc-400">O teu acervo está todo em casa!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {emprestimos.map((emp) => (
              <div key={emp.id} className="bg-white rounded-2xl p-4 shadow-sm border border-orange-100 relative overflow-hidden transition-all">
                <div className="absolute top-0 left-0 w-1 h-full bg-orange-400"></div>
                <div className="pl-2">
                  <h3 className="text-[15px] font-bold text-black leading-tight">
                    {emp.livros?.titulo}
                  </h3>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="bg-orange-50 text-orange-700 text-[12px] font-semibold px-2 py-1 rounded-md">
                      👤 {emp.contatos?.nome}
                    </span>
                  </div>

                  {devolvendoId === emp.id ? (
                    <div className="mt-4 pt-4 border-t border-orange-100/50 space-y-3">
                      <label className="text-[13px] font-medium text-zinc-600 block">
                        Onde vais guardar o livro agora?
                      </label>
                      <select 
                        value={novaLocalizacao}
                        onChange={(e) => setNovaLocalizacao(e.target.value)}
                        className="w-full bg-[#F2F2F7] rounded-xl h-11 px-3 text-[13px] outline-none border border-transparent focus:border-orange-300 transition-all text-zinc-700"
                      >
                        <option value="">(Sem localização definida)</option>
                        {localizacoes.map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            {loc.comodo} - {loc.movel} ({loc.prateleira})
                          </option>
                        ))}
                      </select>
                      
                      <div className="flex gap-2 pt-1">
                        <button 
                          onClick={() => setDevolvendoId(null)}
                          disabled={processando}
                          className="flex-1 bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50 rounded-xl h-10 text-[13px] font-semibold transition-colors"
                        >
                          Cancelar
                        </button>
                        <button 
                          onClick={() => confirmarDevolucao(emp.id, emp.livro_id)}
                          disabled={processando}
                          className="flex-1 bg-orange-500 text-white hover:bg-orange-600 rounded-xl h-10 text-[13px] font-semibold transition-colors disabled:opacity-50"
                        >
                          {processando ? "A Guardar..." : "Confirmar Devolução"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setDevolvendoId(emp.id)}
                      className="mt-4 w-full bg-[#F2F2F7] text-black hover:bg-zinc-200 rounded-xl h-10 text-[13px] font-semibold transition-colors"
                    >
                      Marcar como Devolvido
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}