import { BrowserRouter, Route, Routes } from "react-router-dom";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";
import { Toaster } from "react-hot-toast";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Pricing from "./pages/Pricing";
import PaymentSuccess from "./pages/PaymentSuccess";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import NR1Obligations from "./pages/NR1Obligations";
import PsychosocialAssessment from "./pages/PsychosocialAssessment";
import PublicPsychosocialResponse from "./pages/PublicPsychosocialResponse";
import RiskInventory from "./pages/RiskInventory";
import DocumentsSignatures from "./pages/DocumentsSignatures";
import Employees from "./pages/Employees";
import Documents from "./pages/Documents";
import Complaints from "./pages/Complaints";
import DefensePanel from "./pages/DefensePanel";
import EmployeeLogin from "./pages/EmployeeLogin";
import EmployeePortal from "./pages/EmployeePortal";
import NotFound from "./pages/NotFound";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Home />} />

        {/* Clerk precisa de /* para callbacks do Google, verificação e etapas internas */}
        <Route path="/login/*" element={<Login />} />
        <Route path="/cadastro/*" element={<Signup />} />

        <Route path="/precos" element={<Pricing />} />
        <Route path="/pagamento/sucesso" element={<PaymentSuccess />} />
        <Route path="/acesso-funcionario" element={<EmployeeLogin />} />

        {/* Resposta pública por link direto, sem depender de WhatsApp ou sessão do funcionário */}
        <Route path="/responder-avaliacao" element={<PublicPsychosocialResponse />} />

        {/* App protegida do gestor */}
        <Route
          path="/comecar"
          element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/obrigacoes-nr1"
          element={
            <ProtectedRoute>
              <NR1Obligations />
            </ProtectedRoute>
          }
        />

        <Route
          path="/avaliacao-psicossocial"
          element={
            <ProtectedRoute>
              <PsychosocialAssessment />
            </ProtectedRoute>
          }
        />

        <Route
          path="/inventario-riscos"
          element={
            <ProtectedRoute>
              <RiskInventory />
            </ProtectedRoute>
          }
        />

        <Route
          path="/documentos-assinaturas"
          element={
            <ProtectedRoute>
              <DocumentsSignatures />
            </ProtectedRoute>
          }
        />

        <Route
          path="/funcionarios"
          element={
            <ProtectedRoute>
              <Employees />
            </ProtectedRoute>
          }
        />

        <Route
          path="/documentos"
          element={
            <ProtectedRoute>
              <Documents />
            </ProtectedRoute>
          }
        />

        <Route
          path="/denuncias"
          element={
            <ProtectedRoute>
              <Complaints />
            </ProtectedRoute>
          }
        />

        <Route
          path="/painel-defesa"
          element={
            <ProtectedRoute>
              <DefensePanel />
            </ProtectedRoute>
          }
        />

        {/* Portal do funcionário */}
        <Route path="/portal/*" element={<EmployeePortal />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
