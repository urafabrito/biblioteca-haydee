"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function CadastrarLocalizacao() {
  const [comodo, setComodo] = useState("");
  const [movel, setMovel] = useState("");
  const [prateleira, setPrateleira] = useState("");
  
  const [locaisAtuais, setLocaisAtuais] = useState<any[]>([]);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const carregarLocais = async () => {
    const { data } = await supabase.from('localizacoes').select('*').order('comodo');
    if (data) setLocaisAtuais(data);
  };

  useEffect(() => {
    carregarLocais();
  }, []);

  const salvarLocalizacao = async () => {
    if (!comodo || !movel || !prateleira) {
      setErro("Por favor, preenche todos os campos.");
      return;
    }

    setLoading(true);
    setErro("");
    setSucesso("");

    try {
      if (editandoId) {
        // Modo Edição
        const { error } = await supabase
          .from('localizacoes')
          .update({ comodo, movel, prateleira })
          .eq('id', editandoId);
        if (error) throw error;
        setSucesso("Estante atualizada com sucesso!");
      } else {
        // Modo Criação
        const { error } = await supabase
          .from('localizacoes')
          .insert([{ comodo, movel, prateleira }]);
        if (error) throw error;
        setSucesso("Nova estante adicionada com sucesso!");
      }

      setComodo("");
      setMovel("");
      setPrateleira("");
      setEditandoId(null);
      carregarLocais();
      
    } catch (error: any) {
      setErro("Erro ao salvar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const prepararEdicao = (local: any) => {
    setComodo(local.comodo);
    setMovel(local.movel);
    setPrateleira(local.prateleira);
    setEditandoId(local.id);
    setSucesso("");
    setErro("");
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Sobe a página para o formulário
  };

  const cancelarEdicao = () => {
    setComodo("");
    setMovel("");
    setPrateleira("");
    setEditandoId(null);
    setErro("");
    setSucesso("");
  };

  const apagarLocalizacao = async (id: string) => {
    if (!confirm("Tens a certeza que queres apagar esta estante?")) return;
    
    setErro("");
    setSucesso("");
    
    try {
      // 🔒 TRAVA DE SEGURANÇA: Verificar se há livros nesta estante
      const { data: livros } = await supabase
        .from('livros')
        .select('id')
        .eq('localizacao_id', id)
        .limit(1);

      if (livros && livros.length > 0) {
        setErro("❌ Bloqueado: Existem livros guardados nesta estante. Altere a localização deles primeiro.");
        return; // Para a execução aqui
      }

      // Se passou pela trava, pode apagar
      const { error } = await supabase.from('localizacoes').delete().eq('id', id);
      if (error) throw error;
      
      setSucesso("Estante apagada com sucesso!");
      carregarLocais();
    } catch (error: any) {
      setErro("Erro ao apagar: " + error.message);
    }
  };

  return (
    <main className="min-h-screen bg-[#F2F2F7] p-6">
      <div className="max-w-md mx-auto space-y-6">
        
        <header className="pt-8">
          <Link href="/" className="text-[#007AFF] text-[15px] hover:underline mb-4 inline-block">
            ← Voltar à Estante
          </Link>
          <h1 className="text-2xl font-semibold text-black tracking-tight">Gestão de Estantes</h1>
        </header>

        {/* Formulário Inteligente (Criação/Edição) */}
        <form className={`bg-white rounded-2xl p-5 shadow-sm border ${editandoId ? 'border-blue-400 shadow-blue-100' : 'border-zinc-100'} space-y-4 transition-all`}>
          <h2 className="text-[14px] font-bold text-zinc-800 mb-2 border-b border-zinc-100 pb-2">
            {editandoId ? "✏️ A Editar Estante" : "Adicionar Novo Local"}
          </h2>

          {sucesso && <div className="bg-green-50 text-green-700 p-3 rounded-lg text-[13px] font-medium text-center border border-green-100">{sucesso}</div>}
          {erro && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-[13px] font-medium text-center border border-red-100">{erro}</div>}

          <div className="space-y-1">
            <label className="text-[13px] font-medium text-zinc-500 ml-1">Cômodo</label>
            <input type="text" value={comodo} onChange={(e) => setComodo(e.target.value)} className="w-full bg-[#F2F2F7] rounded-xl h-11 px-4 text-[15px] outline-none focus:ring-2 focus:ring-black/5" />
          </div>

          <div className="space-y-1">
            <label className="text-[13px] font-medium text-zinc-500 ml-1">Móvel</label>
            <input type="text" value={movel} onChange={(e) => setMovel(e.target.value)} className="w-full bg-[#F2F2F7] rounded-xl h-11 px-4 text-[15px] outline-none focus:ring-2 focus:ring-black/5" />
          </div>

          <div className="space-y-1">
            <label className="text-[13px] font-medium text-zinc-500 ml-1">Prateleira/Nível</label>
            <input type="text" value={prateleira} onChange={(e) => setPrateleira(e.target.value)} className="w-full bg-[#F2F2F7] rounded-xl h-11 px-4 text-[15px] outline-none focus:ring-2 focus:ring-black/5" />
          </div>

          <div className="flex gap-2 mt-4">
            {editandoId && (
              <button type="button" onClick={cancelarEdicao} className="flex-1 bg-zinc-200 text-zinc-700 hover:bg-zinc-300 rounded-xl h-12 text-[14px] font-medium transition-colors">
                Cancelar
              </button>
            )}
            <button type="button" onClick={salvarLocalizacao} disabled={loading} className={`flex-[2] text-white rounded-xl h-12 text-[14px] font-medium transition-colors shadow-md disabled:opacity-50 ${editandoId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-black hover:bg-zinc-800'}`}>
              {loading ? "A Guardar..." : editandoId ? "Atualizar Estante" : "Adicionar Estante"}
            </button>
          </div>
        </form>

        {/* Lista com botões de ação */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-zinc-100">
          <h2 className="text-[14px] font-bold text-zinc-800 mb-4 border-b border-zinc-100 pb-2">Estantes Mapeadas</h2>
          {locaisAtuais.length === 0 ? (
            <p className="text-[13px] text-zinc-400 text-center py-4">Nenhuma estante registada.</p>
          ) : (
            <ul className="space-y-3">
              {locaisAtuais.map((local) => (
                <li key={local.id} className="bg-[#F2F2F7] p-3 rounded-xl flex items-center justify-between gap-3 group">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">📍</span>
                    <div>
                      <p className="text-[14px] font-bold text-black leading-tight">{local.comodo}</p>
                      <p className="text-[12px] text-zinc-500 mt-0.5">{local.movel} • {local.prateleira}</p>
                    </div>
                  </div>
                  {/* Botões de Ação */}
                  <div className="flex gap-1">
                    <button onClick={() => prepararEdicao(local)} className="p-2 text-zinc-400 hover:text-blue-600 bg-white rounded-lg shadow-sm border border-zinc-200 transition-colors" title="Editar">
                      ✏️Editar
                    </button>
                    <button onClick={() => apagarLocalizacao(local.id)} className="p-2 text-zinc-400 hover:text-red-600 bg-white rounded-lg shadow-sm border border-zinc-200 transition-colors" title="Apagar">
                      🗑️Apagar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>
    </main>
  );
}