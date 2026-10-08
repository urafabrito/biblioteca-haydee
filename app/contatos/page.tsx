"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function CadastrarContato() {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  
  const [leitoresAtuais, setLeitoresAtuais] = useState<any[]>([]);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const carregarLeitores = async () => {
    const { data } = await supabase.from('contatos').select('*').order('nome');
    if (data) setLeitoresAtuais(data);
  };

  useEffect(() => {
    carregarLeitores();
  }, []);

  const salvarContato = async () => {
    if (!nome) {
      setErro("O nome da pessoa é obrigatório.");
      return;
    }

    setLoading(true);
    setErro("");
    setSucesso("");

    try {
      if (editandoId) {
        // Edição
        const { error } = await supabase
          .from('contatos')
          .update({ nome, telefone })
          .eq('id', editandoId);
        if (error) throw error;
        setSucesso("Leitor atualizado com sucesso!");
      } else {
        // Criação
        const { error } = await supabase
          .from('contatos')
          .insert([{ nome, telefone }]);
        if (error) throw error;
        setSucesso("Novo leitor adicionado com sucesso!");
      }

      setNome("");
      setTelefone("");
      setEditandoId(null);
      carregarLeitores();
      
    } catch (error: any) {
      setErro("Erro ao salvar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const prepararEdicao = (leitor: any) => {
    setNome(leitor.nome);
    setTelefone(leitor.telefone || "");
    setEditandoId(leitor.id);
    setSucesso("");
    setErro("");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelarEdicao = () => {
    setNome("");
    setTelefone("");
    setEditandoId(null);
    setErro("");
    setSucesso("");
  };

  const apagarLeitor = async (id: string) => {
    if (!confirm("Tens a certeza que queres apagar este leitor?")) return;
    
    setErro("");
    setSucesso("");
    
    try {
      // 🔒 TRAVA DE SEGURANÇA: Verificar se o leitor tem empréstimos ativos
      const { data: emprestimos } = await supabase
        .from('emprestimos')
        .select('id')
        .eq('contato_id', id)
        .limit(1);

      if (emprestimos && emprestimos.length > 0) {
        setErro("❌ Bloqueado: Este leitor ainda não devolveu os livros emprestados! Cobre a devolução primeiro.");
        return; // Para a execução aqui
      }

      // Se passou pela trava, pode apagar
      const { error } = await supabase.from('contatos').delete().eq('id', id);
      if (error) throw error;
      
      setSucesso("Leitor apagado com sucesso!");
      carregarLeitores();
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
          <h1 className="text-2xl font-semibold text-black tracking-tight">Gestão de Leitores</h1>
        </header>

        <form className={`bg-white rounded-2xl p-5 shadow-sm border ${editandoId ? 'border-blue-400 shadow-blue-100' : 'border-zinc-100'} space-y-4 transition-all`}>
          <h2 className="text-[14px] font-bold text-zinc-800 mb-2 border-b border-zinc-100 pb-2">
            {editandoId ? "✏️ A Editar Leitor" : "Adicionar Novo Leitor"}
          </h2>

          {sucesso && <div className="bg-green-50 text-green-700 p-3 rounded-lg text-[13px] font-medium text-center border border-green-100">{sucesso}</div>}
          {erro && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-[13px] font-medium text-center border border-red-100">{erro}</div>}

          <div className="space-y-1">
            <label className="text-[13px] font-medium text-zinc-500 ml-1">Nome Completo</label>
            <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} className="w-full bg-[#F2F2F7] rounded-xl h-11 px-4 text-[15px] outline-none focus:ring-2 focus:ring-black/5" />
          </div>

          <div className="space-y-1">
            <label className="text-[13px] font-medium text-zinc-500 ml-1">WhatsApp / Telefone</label>
            <input type="text" value={telefone} onChange={(e) => setTelefone(e.target.value)} className="w-full bg-[#F2F2F7] rounded-xl h-11 px-4 text-[15px] outline-none focus:ring-2 focus:ring-black/5" />
          </div>

          <div className="flex gap-2 mt-4">
            {editandoId && (
              <button type="button" onClick={cancelarEdicao} className="flex-1 bg-zinc-200 text-zinc-700 hover:bg-zinc-300 rounded-xl h-12 text-[14px] font-medium transition-colors">
                Cancelar
              </button>
            )}
            <button type="button" onClick={salvarContato} disabled={loading} className={`flex-[2] text-white rounded-xl h-12 text-[14px] font-medium transition-colors shadow-md disabled:opacity-50 ${editandoId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-black hover:bg-zinc-800'}`}>
              {loading ? "A Guardar..." : editandoId ? "Atualizar Leitor" : "Adicionar Leitor"}
            </button>
          </div>
        </form>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-zinc-100">
          <h2 className="text-[14px] font-bold text-zinc-800 mb-4 border-b border-zinc-100 pb-2">Leitores Registados</h2>
          {leitoresAtuais.length === 0 ? (
            <p className="text-[13px] text-zinc-400 text-center py-4">Nenhum leitor registado.</p>
          ) : (
            <ul className="space-y-3">
              {leitoresAtuais.map((leitor) => (
                <li key={leitor.id} className="bg-[#F2F2F7] p-3 rounded-xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-white w-10 h-10 rounded-full flex items-center justify-center shadow-sm border border-zinc-200">
                      <span className="text-lg">👤</span>
                    </div>
                    <div>
                      <p className="text-[14px] font-bold text-black leading-tight">{leitor.nome}</p>
                      <p className="text-[12px] text-zinc-500 mt-0.5">{leitor.telefone || "Sem telefone"}</p>
                    </div>
                  </div>
                  {/* Botões de Ação */}
                  <div className="flex gap-1">
                    <button onClick={() => prepararEdicao(leitor)} className="p-2 text-zinc-400 hover:text-blue-600 bg-white rounded-lg shadow-sm border border-zinc-200 transition-colors" title="Editar">
                      ✏️Editar
                    </button>
                    <button onClick={() => apagarLeitor(leitor.id)} className="p-2 text-zinc-400 hover:text-red-600 bg-white rounded-lg shadow-sm border border-zinc-200 transition-colors" title="Apagar">
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