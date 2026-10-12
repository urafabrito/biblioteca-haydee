"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import imageCompression from "browser-image-compression";

export default function CadastrarLivro() {
  const [termoBusca, setTermoBusca] = useState(""); 
  const [resultadosBusca, setResultadosBusca] = useState<any[]>([]);
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
    if (!termoBusca) return;
    
    setLoadingBusca(true);
    setErro("");
    setSucesso(false);
    setResultadosBusca([]);

    // Puxa a chave de API das variáveis de ambiente
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY;

    // Deteção robusta para saber se é ISBN (só números e traços, 10 ou 13 caracteres)
    const termoLimpo = termoBusca.replace(/[-\s]/g, ""); 
    const eIsbn = /^(978|979)?\d{9}[\dX]$/i.test(termoLimpo);

    if (eIsbn) {
      // ==========================================
      // LÓGICA 1: BUSCA POR ISBN EM CASCATA
      // ==========================================
      const isbnLimpo = termoLimpo;
      let dadosEncontrados = { titulo: "", autor: "", capa_url: "", ano: "" };

      const faltamDados = () => {
          return !dadosEncontrados.titulo || !dadosEncontrados.autor || !dadosEncontrados.capa_url || !dadosEncontrados.ano;
      };

      try {
          try {
              const resBrasil = await fetch(`https://brasilapi.com.br/api/isbn/v1/${isbnLimpo}`);
              if (resBrasil.ok) {
                  const dataBrasil = await resBrasil.json();
                  dadosEncontrados.titulo = dataBrasil.title || "";
                  dadosEncontrados.autor = dataBrasil.authors ? dataBrasil.authors.join(", ") : "";
                  dadosEncontrados.capa_url = dataBrasil.cover_url || "";
                  dadosEncontrados.ano = dataBrasil.year ? dataBrasil.year.toString() : "";
              }
          } catch (e) { console.log("Falha na Brasil API..."); }

          if (faltamDados()) {
              try {
                  // 🔥 Adicionada a API KEY na URL do Google
                  const resGoogle = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbnLimpo}&key=${apiKey}`);
                  if (resGoogle.ok) {
                      const dataGoogle = await resGoogle.json();
                      if (dataGoogle.items && dataGoogle.items.length > 0) {
                          const info = dataGoogle.items[0].volumeInfo;
                          if (!dadosEncontrados.titulo) dadosEncontrados.titulo = info.title || "";
                          if (!dadosEncontrados.autor) dadosEncontrados.autor = info.authors ? info.authors.join(", ") : "";
                          if (!dadosEncontrados.capa_url && info.imageLinks) {
                              let url = info.imageLinks.thumbnail || info.imageLinks.smallThumbnail || "";
                              dadosEncontrados.capa_url = url.replace("http:", "https:");
                          }
                          if (!dadosEncontrados.ano && info.publishedDate) {
                              dadosEncontrados.ano = info.publishedDate.substring(0, 4);
                          }
                      }
                  }
              } catch (e) { console.log("Falha na Google Books..."); }
          }

          if (faltamDados()) {
              try {
                  const resOpen = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbnLimpo}&format=json&jscmd=data`);
                  if (resOpen.ok) {
                      const dataOpen = await resOpen.json();
                      const bookData = dataOpen[`ISBN:${isbnLimpo}`];
                      if (bookData) {
                          if (!dadosEncontrados.titulo) dadosEncontrados.titulo = bookData.title || "";
                          if (!dadosEncontrados.autor) dadosEncontrados.autor = bookData.authors ? bookData.authors.map((a:any) => a.name).join(", ") : "";
                          if (!dadosEncontrados.capa_url && bookData.cover) dadosEncontrados.capa_url = bookData.cover.large || bookData.cover.medium || "";
                          if (!dadosEncontrados.ano && bookData.publish_date) {
                              const anoMatch = bookData.publish_date.match(/\d{4}/);
                              if (anoMatch) dadosEncontrados.ano = anoMatch[0];
                          }
                      }
                  }
              } catch (e) { console.log("Falha na Open Library."); }
          }

          if ((!dadosEncontrados.capa_url || !dadosEncontrados.ano || !dadosEncontrados.autor) && dadosEncontrados.titulo) {
              try {
                  const queryTitulo = encodeURIComponent(dadosEncontrados.titulo);
                  let queryStr = `intitle:${queryTitulo}`;
                  if (dadosEncontrados.autor) {
                      queryStr += `+inauthor:${encodeURIComponent(dadosEncontrados.autor)}`;
                  }
                  // 🔥 Adicionada a API KEY na URL do Google
                  const resExtra = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${queryStr}&key=${apiKey}`);
                  if (resExtra.ok) {
                      const dataExtra = await resExtra.json();
                      if (dataExtra.items && dataExtra.items.length > 0) {
                          const info = dataExtra.items[0].volumeInfo;
                          if (!dadosEncontrados.autor && info.authors) dadosEncontrados.autor = info.authors.join(", ");
                          if (!dadosEncontrados.capa_url && info.imageLinks) {
                              let url = info.imageLinks.thumbnail || info.imageLinks.smallThumbnail || "";
                              dadosEncontrados.capa_url = url.replace("http:", "https:");
                          }
                          if (!dadosEncontrados.ano && info.publishedDate) dadosEncontrados.ano = info.publishedDate.substring(0, 4);
                      }
                  }
              } catch (e) { console.log("Falha na busca extra pelo Título."); }
          }

          if (dadosEncontrados.titulo) {
              setLivro(dadosEncontrados);
          } else {
              setErro("ISBN não encontrado em nenhuma base. Podes preencher manualmente.");
          }

      } catch (error) {
          setErro("Ocorreu um erro ao buscar o ISBN.");
      }
    } else {
      // ==========================================
      // LÓGICA 2: BUSCA POR NOME (Retorna Lista)
      // ==========================================
      try {
        const query = encodeURIComponent(termoBusca);
        // 🔥 Adicionada a API KEY na URL do Google
        const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=15&key=${apiKey}`);
        
        if (!res.ok) {
            setErro("Erro ao comunicar com a base de dados do Google.");
            setLoadingBusca(false);
            return;
        }

        const data = await res.json();
        
        if (data.items && data.items.length > 0) {
          const edicoesFormatadas = data.items.map((item: any) => {
            const info = item.volumeInfo;
            let capa = "";
            if (info.imageLinks) {
                capa = info.imageLinks.thumbnail || info.imageLinks.smallThumbnail || "";
                capa = capa.replace("http:", "https:");
            }
            return {
              id: item.id,
              titulo: info.title || "",
              autor: info.authors ? info.authors.join(", ") : "",
              capa_url: capa,
              ano: info.publishedDate ? info.publishedDate.substring(0, 4) : ""
            };
          });
          setResultadosBusca(edicoesFormatadas);
        } else {
          setErro("Nenhum livro encontrado com esse nome.");
        }
      } catch (error) {
        setErro("Erro ao buscar pelo nome. Tenta novamente.");
      }
    }
    
    setLoadingBusca(false);
  };

  const selecionarEdicao = (livroSelecionado: any) => {
    setLivro({
      titulo: livroSelecionado.titulo,
      autor: livroSelecionado.autor,
      capa_url: livroSelecionado.capa_url,
      ano: livroSelecionado.ano
    });
    setResultadosBusca([]); 
    setErro("");
  };

  const fazerUploadCapa = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const tamanhoEmMB = file.size / 1024 / 1024;
    if (tamanhoEmMB > 10) {
      setErro("A imagem é muito pesada (máx: 10MB). Tira uma foto normal ou escolhe outra mais leve.");
      e.target.value = ""; 
      return;
    }

    try {
      setUploadingFoto(true);
      setErro("");

      const options = {
        maxSizeMB: 0.2,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('capas')
        .upload(fileName, compressedFile);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('capas').getPublicUrl(fileName);

      setLivro({ ...livro, capa_url: data.publicUrl });

    } catch (error: any) {
      setErro("Erro no upload da foto: " + error.message);
    } finally {
      setUploadingFoto(false);
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

    const termoLimpo = termoBusca.replace(/[-\s]/g, "");
    const eIsbn = /^(978|979)?\d{9}[\dX]$/i.test(termoLimpo);
    const isbnFinal = eIsbn ? termoLimpo : ""; 

    try {
      const { error } = await supabase
        .from('livros')
        .insert([{ 
          isbn: isbnFinal, 
          titulo: livro.titulo, 
          autor: livro.autor, 
          capa_url: livro.capa_url,
          ano: livro.ano,
          localizacao_id: localizacaoEscolhida || null
        }]);

      if (error) throw error;

      setSucesso(true);
      setTermoBusca("");
      setLivro({ titulo: "", autor: "", capa_url: "", ano: "" });
      setLocalizacaoEscolhida(""); 
      
    } catch (error: any) {
      setErro("Erro ao salvar o livro: " + error.message);
    } finally {
      setLoadingSalvar(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F2F2F7] p-6 pb-20 select-none">
      <div className="max-w-md mx-auto space-y-6">
        
        <header className="pt-8">
          <Link href="/" className="text-[#007AFF] text-[15px] hover:underline mb-4 inline-block">
            ← Voltar
          </Link>
          <h1 className="text-2xl font-semibold text-black tracking-tight">Novo Livro</h1>
        </header>

        <form onSubmit={(e) => { e.preventDefault(); buscarLivro(); }} className="bg-white rounded-2xl p-5 shadow-sm border border-zinc-100 space-y-5">
          
          <div className="bg-[#F2F2F7] p-4 rounded-xl border border-zinc-200">
            <label className="text-[13px] font-semibold text-zinc-700 block mb-2">
              Buscar por Código (ISBN) ou Nome
            </label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={termoBusca} 
                onChange={(e) => setTermoBusca(e.target.value)} 
                className="w-full bg-white rounded-lg h-10 px-3 text-[14px] outline-none border border-zinc-200 focus:border-black transition-all" 
                placeholder="Ex: 97885805... ou 1984" 
              />
              <button 
                type="submit" 
                disabled={loadingBusca} 
                className="bg-black text-white px-4 rounded-lg text-[14px] font-medium hover:bg-zinc-800 transition-colors whitespace-nowrap disabled:opacity-50"
              >
                {loadingBusca ? "..." : "Buscar"}
              </button>
            </div>

            {resultadosBusca.length > 0 && (
              <div className="mt-4 pt-4 border-t border-zinc-200 space-y-2 max-h-[300px] overflow-y-auto">
                <p className="text-[12px] font-bold text-zinc-500 mb-2 uppercase tracking-wide">Escolha a Edição Correta:</p>
                {resultadosBusca.map((edicao, index) => (
                  <div 
                    key={`${edicao.id}-${index}`} 
                    onClick={() => selecionarEdicao(edicao)} 
                    className="flex gap-3 bg-white p-2 rounded-xl border border-zinc-200 cursor-pointer hover:border-blue-500 hover:shadow-md transition-all items-center"
                  >
                    {edicao.capa_url ? (
                      <img src={edicao.capa_url} alt="Capa" className="w-12 h-16 object-cover rounded shadow-sm border border-zinc-100 flex-shrink-0 pointer-events-none" />
                    ) : (
                      <div className="w-12 h-16 bg-zinc-100 rounded flex items-center justify-center text-[10px] text-zinc-400 text-center flex-shrink-0 border border-zinc-200">Sem Capa</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-black truncate">{edicao.titulo}</p>
                      <p className="text-[12px] text-zinc-500 truncate">{edicao.autor || "Autor Desconhecido"}</p>
                      <p className="text-[11px] text-zinc-400 mt-0.5 font-medium">{edicao.ano}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="h-px bg-zinc-100 my-4"></div>

          {sucesso && <div className="bg-green-50 text-green-700 p-3 rounded-lg text-[13px] font-medium text-center border border-green-100">🎉 Livro adicionado ao acervo com sucesso!</div>}
          {erro && <p className="text-[13px] text-red-500 text-center font-medium">{erro}</p>}

          <div className="space-y-4">
            {livro.capa_url && (
              <div className="flex justify-center mb-4">
                <img src={livro.capa_url} alt="Capa" className="h-40 rounded-xl shadow-sm object-cover border border-zinc-200 pointer-events-none" />
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
                  <option key={loc.id} value={loc.id}>{loc.comodo} • {loc.movel} ({loc.prateleira})</option>
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