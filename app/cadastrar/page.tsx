"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import imageCompression from "browser-image-compression";

export default function CadastrarLivro() {
  const [isbn, setIsbn] = useState("");
  const [loadingBusca, setLoadingBusca] = useState(false);
  const [loadingSalvar, setLoadingSalvar] = useState(false);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);
  
  const [listaLocalizacoes, setListaLocalizacoes] = useState<any[]>([]);
  const [localizacaoEscolhida, setLocalizacaoEscolhida] = useState("");

  const [livro, setLivro] = useState({
    titulo: "",
    autor: "",
    capa_url: "",
    ano: "", 
  });

  useEffect(() => {
    const carregarLocalizacoes = async () => {
      const { data } = await supabase.from('localizacoes').select('*');
      if (data) setListaLocalizacoes(data);
    };
    carregarLocalizacoes();
  }, []);

  const buscarLivro = async () => {
    if (!isbn) return;
    setLoadingBusca(true);
    setErro("");
    setSucesso(false);
    
    try {
      const cleanIsbn = isbn.replace(/-/g, "");
      const res = await fetch(`https://brasilapi.com.br/api/isbn/v1/${cleanIsbn}`);
      
      if (!res.ok) throw new Error("Não encontrado");
      
      const data = await res.json();

      setLivro({
        titulo: data.title || "",
        autor: data.authors ? data.authors.join(", ") : "",
        capa_url: data.cover_url || "", 
        ano: data.year ? data.year.toString() : "",
      });
    } catch (error) {
      setErro("Livro não encontrado. Pode preencher os dados (e a capa) manualmente.");
    } finally {
      setLoadingBusca(false);
    }
  };

  // 🔥 NOVA FUNÇÃO: Compressão e Upload da Imagem
  const fazerUploadCapa = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 🚨 TRAVA DE SEGURANÇA: Bloqueia ficheiros maiores que 10MB antes da compressão
    const tamanhoEmMB = file.size / 1024 / 1024;
    if (tamanhoEmMB > 10) {
      setErro("A imagem é muito pesada (máx: 10MB). Tira uma foto normal ou escolhe outra mais leve.");
      e.target.value = ""; // Limpa o seletor
      return;
    }

    try {
      setUploadingFoto(true);
      setErro("");

      // 1. Comprimir a imagem (Reduz para máximo 200KB e 800px de altura/largura)
      const options = {
        maxSizeMB: 0.2,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);

      // 2. Criar um nome único para o ficheiro para não haver sobreposições
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

      // 3. Enviar para o Supabase Storage (no bucket 'capas')
      const { error: uploadError } = await supabase.storage
        .from('capas')
        .upload(fileName, compressedFile);

      if (uploadError) throw uploadError;

      // 4. Obter o Link Público da imagem que acabou de ser guardada
      const { data } = supabase.storage.from('capas').getPublicUrl(fileName);

      // 5. Atualizar o formulário com a nova capa
      setLivro({ ...livro, capa_url: data.publicUrl });

    } catch (error: any) {
      setErro("Erro no upload da foto: " + error.message);
    } finally {
      setUploadingFoto(false);
      // Limpar o input para permitir selecionar a mesma imagem novamente se necessário
      e.target.value = "";
    }
  };

  const salvarLivro = async () => {
    if (!livro.titulo) {
      setErro("O título do livro é obrigatório.");
      return;
    }

    setLoadingSalvar(true);
    setErro("");
    setSucesso(false);

    try {
      const { error } = await supabase
        .from('livros')
        .insert([{ 
          isbn: isbn, 
          titulo: livro.titulo, 
          autor: livro.autor, 
          capa_url: livro.capa_url,
          ano: livro.ano,
          localizacao_id: localizacaoEscolhida || null
        }]);

      if (error) throw error;

      setSucesso(true);
      setIsbn("");
      setLivro({ titulo: "", autor: "", capa_url: "", ano: "" });
      setLocalizacaoEscolhida(""); 
      
    } catch (error: any) {
      setErro("Erro ao salvar o livro: " + error.message);
    } finally {
      setLoadingSalvar(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F2F2F7] p-6 pb-20">
      <div className="max-w-md mx-auto space-y-6">
        
        <header className="pt-8">
          <Link href="/" className="text-[#007AFF] text-[15px] hover:underline mb-4 inline-block">
            ← Voltar
          </Link>
          <h1 className="text-2xl font-semibold text-black tracking-tight">Novo Livro</h1>
        </header>

        <form className="bg-white rounded-2xl p-5 shadow-sm border border-zinc-100 space-y-5">
          
          <div className="bg-[#F2F2F7] p-4 rounded-xl border border-zinc-200">
            <label className="text-[13px] font-semibold text-zinc-700 block mb-2">
              Automação com Código de Barras (ISBN)
            </label>
            <div className="flex gap-2">
              <input type="text" value={isbn} onChange={(e) => setIsbn(e.target.value)} className="w-full bg-white rounded-lg h-10 px-3 text-[14px] outline-none border border-zinc-200 focus:border-black transition-all" placeholder="Ex: 9788580575392" />
              <button type="button" onClick={buscarLivro} disabled={loadingBusca} className="bg-black text-white px-4 rounded-lg text-[14px] font-medium hover:bg-zinc-800 transition-colors whitespace-nowrap disabled:opacity-50">
                {loadingBusca ? "..." : "Buscar"}
              </button>
            </div>
          </div>

          <div className="h-px bg-zinc-100 my-4"></div>

          {sucesso && <div className="bg-green-50 text-green-700 p-3 rounded-lg text-[13px] font-medium text-center border border-green-100">🎉 Livro adicionado ao acervo com sucesso!</div>}
          {erro && <p className="text-[13px] text-red-500 text-center font-medium">{erro}</p>}

          <div className="space-y-4">
            {livro.capa_url && (
              <div className="flex justify-center mb-4">
                <img src={livro.capa_url} alt="Capa" className="h-40 rounded-xl shadow-sm object-cover border border-zinc-200" />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[13px] font-medium text-zinc-500 ml-1">Título do Livro</label>
              <input type="text" value={livro.titulo} onChange={(e) => setLivro({...livro, titulo: e.target.value})} className="w-full bg-[#F2F2F7] rounded-xl h-11 px-4 text-[15px] outline-none focus:ring-2 focus:ring-black/5" />
            </div>

            <div className="space-y-1">
              <label className="text-[13px] font-medium text-zinc-500 ml-1">Autor</label>
              <input type="text" value={livro.autor} onChange={(e) => setLivro({...livro, autor: e.target.value})} className="w-full bg-[#F2F2F7] rounded-xl h-11 px-4 text-[15px] outline-none focus:ring-2 focus:ring-black/5" />
            </div>

            <div className="space-y-1">
              <label className="text-[13px] font-medium text-zinc-500 ml-1">Ano de Publicação</label>
              <input type="number" value={livro.ano} onChange={(e) => setLivro({...livro, ano: e.target.value})} className="w-full bg-[#F2F2F7] rounded-xl h-11 px-4 text-[15px] outline-none focus:ring-2 focus:ring-black/5" />
            </div>

            {/* SEÇÃO DA CAPA ATUALIZADA */}
            <div className="space-y-2 mt-2 pt-2 border-t border-zinc-100">
              <label className="text-[13px] font-bold text-zinc-700 block">Capa do Livro</label>
              
              <div className="relative">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={fazerUploadCapa} 
                  disabled={uploadingFoto}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10" 
                />
                <div className={`w-full flex items-center justify-center gap-2 rounded-xl h-12 text-[14px] font-semibold transition-colors border-2 border-dashed ${uploadingFoto ? 'bg-zinc-100 border-zinc-200 text-zinc-400' : 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100'}`}>
                   {uploadingFoto ? "A processar foto..." : "📸 Tirar Foto / Fazer Upload"}
                </div>
              </div>
              
              <p className="text-[11px] text-zinc-400 text-center uppercase tracking-wider font-semibold">Ou</p>

              <input 
                type="url" 
                value={livro.capa_url} 
                onChange={(e) => setLivro({...livro, capa_url: e.target.value})} 
                className="w-full bg-[#F2F2F7] rounded-xl h-10 px-4 text-[13px] outline-none focus:ring-2 focus:ring-black/5" 
                placeholder="Cola um link da internet aqui" 
              />
            </div>

            <div className="space-y-1">
              <label className="text-[13px] font-medium text-zinc-500 ml-1">Onde vai guardar?</label>
              <select value={localizacaoEscolhida} onChange={(e) => setLocalizacaoEscolhida(e.target.value)} className="w-full bg-[#F2F2F7] rounded-xl h-11 px-4 text-[14px] outline-none focus:ring-2 focus:ring-black/5 text-zinc-700">
                <option value="">(Sem localização definida)</option>
                {listaLocalizacoes.map((loc) => (
                  <option key={loc.id} value={loc.id}>{loc.comodo} - {loc.movel} ({loc.prateleira})</option>
                ))}
              </select>
            </div>
          </div>

          <button type="button" onClick={salvarLivro} disabled={loadingSalvar} className="w-full bg-black text-white hover:bg-zinc-800 rounded-xl h-12 text-base font-medium transition-colors mt-6 shadow-md disabled:opacity-50">
            {loadingSalvar ? "A Salvar..." : "Salvar Livro no Acervo"}
          </button>
        </form>

      </div>
    </main>
  );
}