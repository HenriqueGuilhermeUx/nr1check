import React, { useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { trpc } from "./lib/trpc";
import superjson from "superjson";
import { App } from "./App";
import "./index.css";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("VITE_CLERK_PUBLISHABLE_KEY não configurada");
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

function TRPCProviderWithClerk() {
  const { getToken, isLoaded } = useAuth();

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 0,
          },
        },
      }),
  );

  const trpcClient = useMemo(() => {
    return trpc.createClient({
      links: [
        httpBatchLink({
          url: `${API_BASE_URL}/api/trpc`,
          transformer: superjson,
          fetch: async (url, options) => {
            const headers = new Headers(options?.headers);

            try {
              const token = await getToken();

              if (token) {
                headers.set("authorization", `Bearer ${token}`);
              }
            } catch (error) {
              console.error("Erro ao obter token Clerk para tRPC:", error);
            }

            return fetch(url, {
              ...options,
              headers,
            });
          },
        }),
      ],
    });
  }, [getToken]);

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto h-10 w-10 rounded-xl bg-brand-600" />
          <p className="mt-4 text-sm text-gray-500">Carregando sessão...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <App />
      </trpc.Provider>
    </QueryClientProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      afterSignInUrl="/app"
      afterSignUpUrl="/app"
      signInUrl="/login"
      signUpUrl="/cadastro"
      signInFallbackRedirectUrl="/app"
      signUpFallbackRedirectUrl="/app"
    >
      <TRPCProviderWithClerk />
    </ClerkProvider>
  </React.StrictMode>,
);

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.warn("Service worker NR1Check não registrado:", error);
    });
  });
}
