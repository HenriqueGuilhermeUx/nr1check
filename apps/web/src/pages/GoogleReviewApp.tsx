import type { ReactNode } from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  ClipboardCheck,
  FileCheck,
  MessageSquare,
  Send,
  Shield,
  Users,
} from "lucide-react";

type DemoTab = "inicio" | "funcionarios" | "convite" | "avaliacao" | "documentos" | "relatos";

const TAB_CONTENT: Record<DemoTab, { title: string; description: string; items: string[] }> = {
  inicio: {
    title: "Resumo da empresa",
    description: "Ambiente demonstrativo liberado para revisão do Google Play.",
    items: ["Empresa demo ativa", "2 funcionários cadastrados", "Avaliação psicossocial disponível", "Documentos e relatos demonstrativos"],
  },
  funcionarios: {
    title: "Funcionários",
    description: "Exemplo de rotina para equipe cadastrada.",
    items: ["Ana Souza — Administrativo", "Carlos Lima — Operacional", "CPF e telefone controlados", "Acesso por link da empresa"],
  },
  convite: {
    title: "Enviar link",
    description: "Exemplo de convite para funcionários acessarem o app.",
    items: ["Link da empresa disponível", "Envio por WhatsApp ou e-mail", "Funcionário entra com CPF", "Código de acesso protege a entrada"],
  },
  avaliacao: {
    title: "Avaliação psicossocial",
    description: "Exemplo de acompanhamento da avaliação.",
    items: ["Ciclo de avaliação demonstrativo", "Convite aos trabalhadores", "Participação acompanhada", "Achados agregados por dimensão"],
  },
  documentos: {
    title: "Documentos",
    description: "Exemplo de organização de evidências e ciência.",
    items: ["Comunicado interno", "Plano de ação", "Ciência de documentos", "Dossiê de evidências"],
  },
  relatos: {
    title: "Relatos",
    description: "Exemplo de canal de ocorrências e relatos.",
    items: ["Canal disponível", "Status de tratativa", "Histórico de ocorrência", "Ações internas"],
  },
};

export default function GoogleReviewApp() {
  const [tab, setTab] = useState<DemoTab>("inicio");
  const selected = TAB_CONTENT[tab];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-950">
      <main className="mx-auto flex min-h-screen max-w-md flex-col px-4 py-5">
        <header className="flex items-center justify-between">
          <Link to="/app" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-600 shadow-sm">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-lg font-extrabold leading-none text-gray-950">NR1Check</p>
              <p className="mt-1 text-[11px] font-medium text-gray-500">Revisão Google Play</p>
            </div>
          </Link>
        </header>

        <section className="mt-7 rounded-[2rem] bg-brand-600 p-6 text-white shadow-xl shadow-brand-600/20">
          <p className="text-xs font-bold uppercase tracking-wide text-brand-100">Ambiente demo</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight">Painel rápido</h1>
          <p className="mt-3 text-sm leading-6 text-brand-50">
            Esta área é pública apenas para revisão do Google Play e usa dados demonstrativos, sem login e sem dados reais.
          </p>
          <p className="mt-3 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white">
            Acesso sem código por e-mail
          </p>
        </section>

        <div className="mt-5 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Empresa ativa</p>
          <h2 className="mt-2 text-xl font-black text-gray-950">Empresa Demonstração Google Play</h2>
          <p className="mt-1 text-sm text-gray-500">CNPJ 90.000.000/0001-01</p>
          <p className="mt-3 rounded-full bg-green-50 px-3 py-2 text-xs font-bold text-green-700">
            Liberada para revisão
          </p>
        </div>

        <section className="mt-5 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black text-gray-950">{selected.title}</h2>
          <p className="mt-2 text-sm leading-6 text-gray-600">{selected.description}</p>
          <div className="mt-4 space-y-2">
            {selected.items.map((item) => (
              <div key={item} className="rounded-2xl bg-gray-50 px-3 py-3 text-sm font-medium text-gray-700">
                {item}
              </div>
            ))}
          </div>
        </section>

        <nav className="mt-5 grid grid-cols-2 gap-3">
          <TabButton active={tab === "inicio"} icon={<Building2 className="h-5 w-5" />} title="Início" onClick={() => setTab("inicio")} />
          <TabButton active={tab === "funcionarios"} icon={<Users className="h-5 w-5" />} title="Funcionários" onClick={() => setTab("funcionarios")} />
          <TabButton active={tab === "convite"} icon={<Send className="h-5 w-5" />} title="Enviar link" onClick={() => setTab("convite")} />
          <TabButton active={tab === "avaliacao"} icon={<ClipboardCheck className="h-5 w-5" />} title="Avaliação" onClick={() => setTab("avaliacao")} />
          <TabButton active={tab === "documentos"} icon={<FileCheck className="h-5 w-5" />} title="Documentos" onClick={() => setTab("documentos")} />
          <TabButton active={tab === "relatos"} icon={<MessageSquare className="h-5 w-5" />} title="Relatos" onClick={() => setTab("relatos")} />
        </nav>

        <footer className="mt-auto pt-8 pb-4 text-center">
          <div className="flex justify-center gap-4 text-[11px] text-gray-400">
            <Link to="/privacidade" className="hover:text-gray-900">Privacidade</Link>
            <Link to="/excluir-conta" className="hover:text-gray-900">Excluir dados</Link>
            <Link to="/suporte" className="hover:text-gray-900">Suporte</Link>
          </div>
        </footer>
      </main>
    </div>
  );
}

function TabButton({ active, icon, title, onClick }: { active: boolean; icon: ReactNode; title: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-3xl border p-4 text-left shadow-sm transition ${
        active ? "border-brand-500 bg-brand-50 ring-2 ring-brand-500" : "border-gray-200 bg-white"
      }`}
    >
      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${active ? "bg-brand-600 text-white" : "bg-brand-50 text-brand-700"}`}>
        {icon}
      </div>
      <p className="mt-3 text-sm font-extrabold text-gray-950">{title}</p>
    </button>
  );
}
