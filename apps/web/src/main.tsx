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

            if (isLoaded) {
              try {
                const token = await getToken();

                if (token) {
                  headers.set("authorization", `Bearer ${token}`);
                }
              } catch (error) {
                console.error("Erro ao obter token Clerk para tRPC:", error);
              }
            }

            return fetch(url, {
              ...options,
              headers,
            });
          },
        }),
      ],
    });
  }, [getToken, isLoaded]);

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
      afterSignInUrl="/dashboard"
      afterSignUpUrl="/comecar"
      signInUrl="/login"
      signUpUrl="/cadastro"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/comecar"
    >
      <TRPCProviderWithClerk />
    </ClerkProvider>
  </React.StrictMode>,
);
