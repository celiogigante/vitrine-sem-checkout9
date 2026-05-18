import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Lock, Loader2, User, AlertCircle } from "lucide-react";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [supabsaseError, setSupabaseError] = useState<string | null>(null);

  useEffect(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      const missing = [];
      if (!supabaseUrl) missing.push("VITE_SUPABASE_URL");
      if (!supabaseAnonKey) missing.push("VITE_SUPABASE_ANON_KEY");

      const errorMsg = `Variáveis de ambiente faltando: ${missing.join(", ")}`;
      setSupabaseError(errorMsg);
      console.error(errorMsg);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({
        title: "Preencha email e senha",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setSupabaseError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        const errorMsg = error.message || "Erro desconhecido ao fazer login";
        console.error("Supabase login error:", error);
        setSupabaseError(errorMsg);
        toast({
          title: "Erro ao fazer login",
          description: errorMsg,
          variant: "destructive",
        });
        return;
      }

      if (data.user?.user_metadata?.is_admin) {
        navigate("/admin");
        toast({ title: "Login realizado com sucesso!" });
      } else {
        await supabase.auth.signOut();
        toast({
          title: "Acesso negado",
          description: "Você não tem permissão de admin",
          variant: "destructive",
        });
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Erro inesperado ao fazer login";
      console.error("Login error:", err);
      setSupabaseError(errorMsg);

      if (errorMsg.includes("Failed to fetch")) {
        toast({
          title: "Erro de conectividade",
          description: "Não foi possível conectar ao servidor. Verifique sua conexão com a internet e as variáveis de ambiente do Supabase.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro inesperado",
          description: errorMsg,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password || !passwordConfirm) {
      toast({
        title: "Preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    if (password !== passwordConfirm) {
      toast({
        title: "As senhas não correspondem",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Senha deve ter pelo menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            is_admin: false, // Novos usuários não são admin por padrão
          },
        },
      });

      if (error) {
        toast({
          title: "Erro ao criar conta",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Conta criada com sucesso!",
        description: "Você será redirecionado em instantes...",
      });

      // Limpar formulário e voltar para login
      setTimeout(() => {
        setEmail("");
        setPassword("");
        setPasswordConfirm("");
        setIsLogin(true);
      }, 2000);
    } catch (err) {
      console.error("Sign up error:", err);
      toast({
        title: "Erro inesperado",
        description: "Tente novamente mais tarde",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary/20 px-4">
      <div className="w-full max-w-sm space-y-6 p-8 rounded-2xl border bg-card shadow-lg">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <Lock className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Painel Admin</h1>
          <p className="text-sm text-muted-foreground">
            {isLogin ? "Faça login com suas credenciais" : "Criar uma nova conta"}
          </p>
        </div>

        {supabsaseError && (
          <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-3 space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-destructive text-sm">Erro de Configuração</h3>
                <p className="text-xs text-destructive/90 mt-1">{supabsaseError}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={isLogin ? handleLogin : handleSignUp} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Senha</label>
            <Input
              type="password"
              placeholder="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {!isLogin && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Confirmar Senha</label>
              <Input
                type="password"
                placeholder="Confirme sua senha"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                disabled={isLoading}
                onKeyDown={(e) => e.key === "Enter" && handleSignUp(e as any)}
              />
            </div>
          )}

          <Button type="submit" disabled={isLoading} size="lg" className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isLogin ? "Entrando..." : "Criando conta..."}
              </>
            ) : isLogin ? (
              "Entrar"
            ) : (
              <>
                <User className="mr-2 h-4 w-4" />
                Criar Conta
              </>
            )}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-muted"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-card text-muted-foreground">
              {isLogin ? "Não tem conta?" : "Já tem conta?"}
            </span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setIsLogin(!isLogin);
            setEmail("");
            setPassword("");
            setPasswordConfirm("");
          }}
          disabled={isLoading}
          className="w-full"
        >
          {isLogin ? "Criar conta" : "Fazer login"}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Apenas administradores podem acessar o painel completo
        </p>
      </div>
    </div>
  );
}
