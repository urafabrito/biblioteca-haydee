"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const fazerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro("");

    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: senha,
    });

    if (error) {
      setErro("Acesso negado. Verifique o e-mail e a senha.");
      setLoading(false);
    } else {
      router.push("/"); // Se a senha estiver certa, entra na estante!
    }
  };

  return (
    <main className="min-h-screen bg-[#F2F2F7] flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-black tracking-tight mb-1">Biblioteca Haydee</h1>
          <p className="text-[15px] text-zinc-500">Acesso Restrito</p>
        </div>

        <form onSubmit={fazerLogin} className="bg-white rounded-2xl p-6 shadow-sm border border-zinc-100 space-y-4">
          {erro && <p className="text-[13px] text-red-500 text-center font-medium bg-red-50 p-2 rounded-lg border border-red-100">{erro}</p>}

          <div className="space-y-1">
            <label className="text-[13px] font-medium text-zinc-500 ml-1">E-mail</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-[#F2F2F7] rounded-xl h-11 px-4 text-[15px] outline-none focus:ring-2 focus:ring-black/5" />
          </div>

          <div className="space-y-1">
            <label className="text-[13px] font-medium text-zinc-500 ml-1">Senha</label>
            <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required className="w-full bg-[#F2F2F7] rounded-xl h-11 px-4 text-[15px] outline-none focus:ring-2 focus:ring-black/5" />
          </div>

          <button type="submit" disabled={loading} className="w-full bg-black text-white hover:bg-zinc-800 rounded-xl h-12 text-base font-medium transition-colors mt-2 shadow-md disabled:opacity-50">
            {loading ? "Entrando" : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}