import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@nr1check/api/routers";

export const trpc = createTRPCReact<AppRouter>();
