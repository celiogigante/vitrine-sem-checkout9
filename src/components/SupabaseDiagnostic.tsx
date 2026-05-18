import { AlertCircle, CheckCircle, AlertTriangle } from "lucide-react";

export default function SupabaseDiagnostic() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const checks = [
    {
      name: "VITE_SUPABASE_URL",
      status: supabaseUrl ? "configured" : "missing",
      value: supabaseUrl || "not set",
    },
    {
      name: "VITE_SUPABASE_ANON_KEY",
      status: supabaseAnonKey ? "configured" : "missing",
      value: supabaseAnonKey ? "***" : "not set",
    },
  ];

  const isConfigured = supabaseUrl && supabaseAnonKey;

  return (
    <div className="space-y-3">
      {!isConfigured && (
        <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-4 space-y-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-destructive">Supabase não configurado</h3>
              <p className="text-sm text-destructive/90 mt-1">
                Crie um arquivo <code className="bg-destructive/20 px-2 py-1 rounded">.env.local</code> na raiz do projeto com as variáveis abaixo.
              </p>
            </div>
          </div>

          <div className="space-y-2 mt-4 ml-7">
            {checks.map((check) => (
              <div key={check.name} className="text-xs">
                <div className="flex items-center gap-2">
                  {check.status === "configured" ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  )}
                  <span className="font-mono">{check.name}</span>
                </div>
                {check.status === "missing" && (
                  <p className="text-destructive ml-6 mt-1">Status: {check.status}</p>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-black/50 rounded text-xs font-mono text-gray-300 space-y-1">
            <p># .env.local</p>
            <p className="text-yellow-400">VITE_SUPABASE_URL</p>
            <p>=https://your-project.supabase.co</p>
            <p className="text-yellow-400 mt-2">VITE_SUPABASE_ANON_KEY</p>
            <p>=your-anon-key-here</p>
          </div>

          <p className="text-xs text-destructive/80 mt-3">
            Obtenha esses valores em: <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="underline hover:text-destructive">supabase.com/dashboard</a>
          </p>
        </div>
      )}

      {isConfigured && (
        <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-3 flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-700">Supabase configurado corretamente</p>
        </div>
      )}
    </div>
  );
}
