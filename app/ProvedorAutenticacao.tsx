"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, usePathname } from "next/navigation";

export default function ProvedorAutenticacao({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [verificando, setVerificando] = useState(true);

  useEffect(() => {
    const verificarSessao = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      // Se não tem sessão e não está na página de login, expulsa para o login!
      if (!session && pathname !== '/login') {
        router.push('/login');
      } 
      // Se já tem sessão e tenta ir para o login, redireciona para a estante!
      else if (session && pathname === '/login') {
        router.push('/');
      }
      setVerificando(false);
    };

    verificarSessao();

    // Fica a ouvir se a pessoa faz logout
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session && pathname !== '/login') {
        router.push('/login');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [pathname, router]);

  if (verificando) {
    return (
      <div className="min-h-screen bg-[#F2F2F7] flex items-center justify-center">
        <p className="text-zinc-500 font-medium animate-pulse">A verificar acesso...</p>
      </div>
    );
  }

  return <>{children}</>;
}