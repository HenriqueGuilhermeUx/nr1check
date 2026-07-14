import type { ReactNode } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";
import { Toaster } from "react-hot-toast";

import Home from "./pages/Home";
import MobileApp from "./pages/MobileApp";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Pricing from "./pages/Pricing";
import PaymentSuccess from "./pages/PaymentSuccess";
import PixPayment from "./pages/PixPayment";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import EmployeeInvite from "./pages/EmployeeInvite";
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
import AssessmentFindings from "./pages/AssessmentFindings";
import DebugAuth from "./pages/DebugAuth";
import Logout from "./pages/Logout";
import TermsOfUse from "./pages/TermsOfUse";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import LegalDisclaimer from "./pages/LegalDisclaimer";
import { BillingGate } from "./components/BillingGate";

function ProtectedRoute({ children }: { children: ReactNode }) {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut><RedirectToSignIn /></SignedOut>
    </>
  );
}

function PaidRoute({ children, mode = "either" }: { children: ReactNode; mode?: "company" | "accountant" | "either" }) {
  return (
    <ProtectedRoute>
      <BillingGate mode={mode}>{children}</BillingGate>
    </ProtectedRoute>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/app" element={<MobileApp />} />
        <Route path="/login/*" element={<Login />} />
        <Route path="/cadastro/*" element={<Signup />} />
        <Route path="/sair" element={<Logout />} />
        <Route path="/trocar-conta" element={<Logout />} />
        <Route path="/precos" element={<Pricing />} />
        <Route path="/termos" element={<TermsOfUse />} />
        <Route path="/privacidade" element={<PrivacyPolicy />} />
        <Route path="/disclaimer" element={<LegalDisclaimer />} />
        <Route path="/pagamento/sucesso" element={<PaymentSuccess />} />
        <Route path="/pagamento/pix/:paymentId" element={<ProtectedRoute><PixPayment /></ProtectedRoute>} />
        <Route path="/acesso-funcionario" element={<EmployeeLogin />} />
        <Route path="/responder-avaliacao" element={<PublicPsychosocialResponse />} />

        <Route path="/debug-auth" element={<ProtectedRoute><DebugAuth /></ProtectedRoute>} />
        <Route path="/comecar" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />

        <Route path="/dashboard" element={<PaidRoute><Dashboard /></PaidRoute>} />
        <Route path="/clientes" element={<PaidRoute mode="accountant"><Clients /></PaidRoute>} />
        <Route path="/convite-funcionarios" element={<PaidRoute mode="company"><EmployeeInvite /></PaidRoute>} />
        <Route path="/obrigacoes-nr1" element={<PaidRoute><NR1Obligations /></PaidRoute>} />
        <Route path="/achados-psicossociais" element={<PaidRoute><AssessmentFindings /></PaidRoute>} />
        <Route path="/avaliacao-psicossocial" element={<PaidRoute><PsychosocialAssessment /></PaidRoute>} />
        <Route path="/inventario-riscos" element={<PaidRoute><RiskInventory /></PaidRoute>} />
        <Route path="/documentos-assinaturas" element={<PaidRoute><DocumentsSignatures /></PaidRoute>} />
        <Route path="/funcionarios" element={<PaidRoute><Employees /></PaidRoute>} />
        <Route path="/documentos" element={<PaidRoute><Documents /></PaidRoute>} />
        <Route path="/denuncias" element={<PaidRoute><Complaints /></PaidRoute>} />
        <Route path="/painel-defesa" element={<PaidRoute><DefensePanel /></PaidRoute>} />

        <Route path="/portal/*" element={<EmployeePortal />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
