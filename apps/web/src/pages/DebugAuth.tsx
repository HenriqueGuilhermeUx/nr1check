import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth, useUser } from "@clerk/clerk-react";
import { AlertTriangle, CheckCircle2, Copy, RefreshCcw, Shield } from "lucide-react";
import toast from "react-hot-toast";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

type DebugResult = {
  front: Record<string, unknown>;
  api?: Record<string, unknown>;
  error?: string;
};

export default function DebugAuth() {
  const { isLoaded, isSignedIn, getToken, userId, sessionId } = useAuth();
  const { user } = useUser();

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DebugResult | null>(null);

  async function runDebug() {
    setLoading(true);

    try {
      const token = await getToken();

      const front = {
        isLoaded,
        isSignedIn,
        userId,
        sessionId,
        email: user?.primaryEmailAddress?.emailAddress ?? null,
        apiBaseUrl: API_BASE_URL,
        hasToken: Boolean(token),
        tokenLength: token?.length ?? 0,
        tokenPreview: token ? `${token.slice(0, 12)}...${token.slice(-8)}` : null,
      };

      const response = await fetch(`${API_BASE_URL}/api/auth-debug`, {
        method: "GET",
        headers: token ? { authorization: `Bearer ${token}` } : {},
      });

      const api = await response.json();

      setResult({ front, api });
    } catch (error) {
      setResult({
        front: {
          isLoaded,
          isSignedIn,
          userId,
          sessionId,
          email: user?.primaryEmailAddress?.emailAddress ?? null,
          apiBaseUrl: API_BASE_URL,
        },
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  }

  async function copyResult() {
    await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    toast.success("Debug copiado.");
  }

  useEffect(() => {
    if (isLoaded) {
      runDebug();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn]);

  const apiVerified = Boolean(result?.api?.tokenVerified);
  const hasToken = Boolean(result?.front?.hasToken);
  const hasSecret = Boolean(result?.api?.hasClerkSecretKey);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-xl bg-brand-600 flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Debug de autenticação</h1>
                <p className="text-sm text-gray-500">Clerk front → token → API Render</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={runDebug} disabled={loading} className="btn-primary">
              <RefreshCcw className="h-4 w-4" />
              {loading ? "Testando..." : "Testar novamente"}
            </button>
            <button onClick={copyResult} className="btn-secondary">
              <Copy className="h-4 w-4" />
              Copiar debug
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <StatusCard
            title="Login no front"
            ok={Boolean(isSignedIn)}
            okText="Logado no Clerk"
            failText="Não logado"
          />
          <StatusCard
            title="Token no front"
            ok={hasToken}
            okText="Token gerado"
            failText="Token não gerado"
          />
          <StatusCard
            title="API reconheceu"
            ok={apiVerified}
            okText="Token validado"
            failText="API não validou"
          />
        </div>

        {result?.api && !apiVerified ? (
          <div className="mt-6 rounded-2xl border border-yellow-200 bg-yellow-50 p-5">
            <div className="flex gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-yellow-700" />
              <div>
                <h2 className="font-bold text-yellow-900">Diagnóstico provável</h2>
                <div className="mt-2 text-sm text-yellow-800">
                  {!hasSecret ? (
                    <p>
                      A API não encontrou <strong>CLERK_SECRET_KEY</strong>. Coloque essa variável no Render e faça redeploy da API.
                    </p>
                  ) : !hasToken ? (
                    <p>
                      O front não conseguiu gerar token. Faça logout/login novamente e rode o teste.
                    </p>
                  ) : (
                    <p>
                      A API recebeu token e secret, mas não conseguiu validar. Confira se o <strong>VITE_CLERK_PUBLISHABLE_KEY</strong> do Netlify
                      e o <strong>CLERK_SECRET_KEY</strong> do Render são do mesmo projeto Clerk.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Panel title="Front / Clerk">
            <pre className="overflow-auto rounded-xl bg-gray-900 p-4 text-xs text-white">
              {JSON.stringify(result?.front ?? {}, null, 2)}
            </pre>
          </Panel>

          <Panel title="API / Render">
            <pre className="overflow-auto rounded-xl bg-gray-900 p-4 text-xs text-white">
              {JSON.stringify(result?.api ?? { error: result?.error ?? "Sem resposta ainda" }, null, 2)}
            </pre>
          </Panel>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link to="/dashboard" className="btn-secondary">Voltar ao dashboard</Link>
          <Link to="/comecar" className="btn-secondary">Voltar ao onboarding</Link>
        </div>
      </div>
    </div>
  );
}

function StatusCard({
  title,
  ok,
  okText,
  failText,
}: {
  title: string;
  ok: boolean;
  okText: string;
  failText: string;
}) {
  return (
    <div className={`rounded-2xl border p-4 ${ok ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
      <div className="flex items-center gap-2">
        {ok ? <CheckCircle2 className="h-5 w-5 text-green-700" /> : <AlertTriangle className="h-5 w-5 text-red-700" />}
        <p className={`font-semibold ${ok ? "text-green-900" : "text-red-900"}`}>{title}</p>
      </div>
      <p className={`mt-2 text-sm ${ok ? "text-green-800" : "text-red-800"}`}>
        {ok ? okText : failText}
      </p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}
