"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";

export default function DetalhesLivro() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [livro, setLivro] = useState<any>(null);
  const [localizacoes, setLocalizacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para o Modo de Edição
  const [editando, setEditando] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [autor, setAutor] = useState("");
  const [ano, setAno] = useState("");
  const [capaUrl, setCapaUrl] = useState("");
  const [localizacaoId, setLocalizacaoId] = useState("");
  const [salvando, setSalvando] = useState(false);

  const carregarDados = async () => {
    // 1. Busca os dados do Livro com os relacionamentos
    const { data: dataLivro } = await supabase
      .from("livros")
      .select("*, localizacoes(*), emprestimos(*, contatos(*))")
      .eq("id", id)
      .single();

    if (dataLivro) {
      setLivro(dataLivro);
      // Prepara os estados do formulário caso ela queira editar
      setTitulo(dataLivro.titulo || "");
      setAutor(dataLivro.autor || "");
      setAno(dataLivro.ano?.toString() || "");
      setCapaUrl(dataLivro.capa_url || "");
      setLocalizacaoId(dataLivro.localizacao_id || "");
    }

    // 2. Busca as localizações para o menu dropdown da edição
    const { data: dataLoc } = await supabase.from("localizacoes").select("*");
    if (dataLoc) setLocalizacoes(dataLoc);

    setLoading(false);
  };

  useEffect(() => {
    carregarDados();
  }, [id]);

  const salvarEdicao = async () => {
    setSalvando(true);
    try {
      const { error } = await supabase
        .from('livros')
        .update({
          titulo,
          autor,
          ano,
          capa_url: capaUrl,
          localizacao_id: localizacaoId || null
        })
        .eq('id', id);

      if (error) throw error;
      
      setEditando(false);
      carregarDados(); // Recarrega para mostrar os dados novos
    } catch (error: any) {
      alert("Erro ao atualizar o livro: " + error.message);
    } finally {
      setSalvando(false);
    }
  };

  const apagarLivro = async () => {
    if (!confirm("🚨 Tens a certeza que queres APAGAR este livro do acervo definitivamente?")) return;

    // 🔒 TRAVA DE SEGURANÇA: Verificar se está emprestado
    if (livro.emprestimos && livro.emprestimos.length > 0) {
      alert("❌ Bloqueado: Este livro está emprestado! Regista a devolução antes de o apagar do acervo.");
      return;
    }

    try {
      // 🔥 NOVO: Eliminar a imagem do Storage (se for uma imagem de upload)
      // Verificamos se o URL contém a estrutura do nosso bucket do Supabase
      if (livro.capa_url && livro.capa_url.includes('/storage/v1/object/public/capas/')) {
        // Extrai apenas o nome do ficheiro (tudo o que está depois da última barra '/')
        const nomeFicheiro = livro.capa_url.split('/').pop();
        
        if (nomeFicheiro) {
          const { error: erroStorage } = await supabase.storage
            .from('capas')
            .remove([nomeFicheiro]);
            
          if (erroStorage) {
            console.error("Aviso: A imagem não foi apagada do Storage:", erroStorage.message);
            // Optamos por não bloquear a exclusão do livro se a imagem falhar, 
            // mas registamos no ecrã de desenvolvedor.
          }
        }
      }

      // Após limpar a imagem, apaga o livro da base de dados
      const { error } = await supabase.from('livros').delete().eq('id', id);
      if (error) throw error;
      
      // Se apagou com sucesso, redireciona de volta para a estante
      router.push("/");
    } catch (error: any) {
      alert("Erro ao apagar: " + error.message);
    }
  };

  if (loading) {
    return <main className="min-h-screen bg-[#F2F2F7] flex items-center justify-center text-zinc-500">A carregar detalhes...</main>;
  }

  if (!livro) {
    return (
      <main className="min-h-screen bg-[#F2F2F7] p-6 flex flex-col items-center justify-center">
        <p className="text-zinc-500 text-center mb-4">Ups, não conseguimos encontrar este livro.</p>
        <Link href="/" className="text-[#007AFF] bg-white px-4 py-2 rounded-lg shadow-sm">← Voltar à Estante</Link>
      </main>
    );
  }

  const emprestimoAtivo = livro.emprestimos && livro.emprestimos.length > 0 ? livro.emprestimos[0] : null;

  return (
    <main className="min-h-screen bg-[#F2F2F7] p-6 pb-20">
      <div className="max-w-md mx-auto space-y-6">
        
        <header className="pt-8 flex justify-between items-center">
          <Link href="/" className="text-[#007AFF] text-[15px] hover:underline inline-block">
            ← Voltar à Estante
          </Link>
          
          {/* Botões de Ação de Topo */}
          {!editando && (
            <div className="flex gap-2">
              <button onClick={() => setEditando(true)} className="bg-white text-zinc-600 px-3 py-1.5 rounded-lg text-[13px] font-medium shadow-sm border border-zinc-200 hover:bg-zinc-50 transition-colors">
                ✏️ Editar
              </button>
              <button onClick={apagarLivro} className="bg-white text-red-600 px-3 py-1.5 rounded-lg text-[13px] font-medium shadow-sm border border-zinc-200 hover:bg-red-50 transition-colors">
                🗑️ Apagar
              </button>
            </div>
          )}
        </header>

        <article className={`bg-white rounded-3xl p-6 shadow-sm border ${editando ? 'border-blue-300' : 'border-zinc-100'} flex flex-col items-center transition-all`}>
          
          {/* MODO DE EDIÇÃO */}
          {editando ? (
            <div className="w-full space-y-4">
              <h2 className="text-lg font-bold text-black border-b border-zinc-100 pb-2 mb-4 text-center">Editar Livro</h2>
              
              <div className="space-y-1">
                <label className="text-[13px] font-medium text-zinc-500">Título</label>
                <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} className="w-full bg-[#F2F2F7] rounded-xl h-11 px-4 text-[14px] outline-none focus:ring-2 focus:ring-black/5" />
              </div>
              <div className="space-y-1">
                <label className="text-[13px] font-medium text-zinc-500">Autor</label>
                <input type="text" value={autor} onChange={(e) => setAutor(e.target.value)} className="w-full bg-[#F2F2F7] rounded-xl h-11 px-4 text-[14px] outline-none focus:ring-2 focus:ring-black/5" />
              </div>
              <div className="space-y-1">
                <label className="text-[13px] font-medium text-zinc-500">Ano de Publicação</label>
                <input type="number" value={ano} onChange={(e) => setAno(e.target.value)} className="w-full bg-[#F2F2F7] rounded-xl h-11 px-4 text-[14px] outline-none focus:ring-2 focus:ring-black/5" />
              </div>
              <div className="space-y-1">
                <label className="text-[13px] font-medium text-zinc-500">Link da Capa</label>
                <input type="url" value={capaUrl} onChange={(e) => setCapaUrl(e.target.value)} className="w-full bg-[#F2F2F7] rounded-xl h-11 px-4 text-[14px] outline-none focus:ring-2 focus:ring-black/5" />
              </div>
              
              <div className="space-y-1">
                <label className="text-[13px] font-medium text-zinc-500">Localização (Estante)</label>
                <select value={localizacaoId} onChange={(e) => setLocalizacaoId(e.target.value)} className="w-full bg-[#F2F2F7] rounded-xl h-11 px-4 text-[14px] outline-none focus:ring-2 focus:ring-black/5">
                  <option value="">(Sem localização definida)</option>
                  {localizacoes.map((loc) => (
                    <option key={loc.id} value={loc.id}>{loc.comodo} - {loc.movel} ({loc.prateleira})</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-4">
                <button onClick={() => setEditando(false)} className="flex-1 bg-zinc-200 text-zinc-700 hover:bg-zinc-300 rounded-xl h-11 text-[13px] font-medium transition-colors">
                  Cancelar
                </button>
                <button onClick={salvarEdicao} disabled={salvando} className="flex-[2] bg-blue-600 text-white hover:bg-blue-700 rounded-xl h-11 text-[13px] font-medium transition-colors disabled:opacity-50">
                  {salvando ? "A Salvar..." : "Salvar Alterações"}
                </button>
              </div>
            </div>
          ) : (
            
            /* MODO DE VISUALIZAÇÃO (O que já tínhamos) */
            <>
              {livro.capa_url ? (
                <img src={livro.capa_url} alt={livro.titulo} className="w-40 object-cover rounded-xl shadow-lg mb-6 border border-zinc-100" />
              ) : (
                <div className="w-40 h-60 bg-zinc-100 rounded-xl shadow-inner mb-6 flex items-center justify-center p-4 border border-zinc-200">
                  <span className="text-[14px] text-zinc-400 font-medium text-center">Capa Indisponível</span>
                </div>
              )}
              
              <h1 className="text-2xl font-bold text-black tracking-tight leading-tight mb-2 text-center">{livro.titulo}</h1>
              <p className="text-[16px] text-zinc-500 font-medium mb-5 text-center">
                {livro.autor} {livro.ano ? `• ${livro.ano}` : ""}
              </p>

              {livro.isbn && (
                <div className="bg-[#F2F2F7] px-4 py-2 rounded-lg mb-8">
                  <p className="text-[13px] text-zinc-500 font-mono tracking-wider">ISBN: {livro.isbn}</p>
                </div>
              )}

              <div className="w-full h-px bg-zinc-100 mb-6"></div>

              <div className="w-full text-left space-y-3">
                <h2 className="text-[12px] font-bold text-zinc-400 uppercase tracking-widest pl-1">
                  Status do Livro
                </h2>
                
                {emprestimoAtivo ? (
                  <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xl leading-none">⚠️</span>
                      <p className="text-[15px] font-bold text-orange-900 leading-tight">Emprestado</p>
                    </div>
                    <p className="text-[14px] text-orange-800/80 mt-1 ml-8">
                      Este livro está atualmente com <strong className="text-orange-900">{emprestimoAtivo.contatos.nome}</strong>.
                    </p>
                    <Link href="/emprestimos" className="mt-4 ml-8 inline-block text-[13px] font-semibold text-orange-700 bg-orange-200/50 px-3 py-1.5 rounded-lg hover:bg-orange-200 transition-colors">
                      Gerir Devolução →
                    </Link>
                  </div>
                ) : livro.localizacoes ? (
                  <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 flex items-start gap-4">
                    <div className="bg-white p-2.5 rounded-full shadow-sm border border-blue-50">
                      <span className="text-xl leading-none block">📍</span>
                    </div>
                    <div className="pt-0.5">
                      <p className="text-[16px] font-semibold text-blue-950 leading-tight">{livro.localizacoes.comodo}</p>
                      <p className="text-[14px] text-blue-800/80 mt-1">{livro.localizacoes.movel}</p>
                      <div className="mt-2 inline-block bg-blue-100/60 text-blue-800 text-[12px] font-semibold px-2.5 py-1 rounded-md">
                        {livro.localizacoes.prateleira}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#F2F2F7] rounded-2xl p-5 text-center border border-zinc-100">
                    <p className="text-[14px] text-zinc-500 font-medium">Na Estante (Sem localização definida).</p>
                  </div>
                )}
              </div>
            </>
          )}

        </article>

      </div>
    </main>
  );
}