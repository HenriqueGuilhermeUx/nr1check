import { DashboardLayout } from "../components/DashboardLayout";
import { trpc } from "../lib/trpc";
import { useState } from "react";
import toast from "react-hot-toast";

export default function Employees() {
  const { data: companies } = trpc.company.my.useQuery();
  const companyId = companies?.[0]?.id;
  const { data: employees, refetch } = trpc.employee.list.useQuery(
    { companyId: companyId! },
    { enabled: !!companyId },
  );
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", cpf: "", phone: "", role: "" });
  const create = trpc.employee.create.useMutation({
    onSuccess: () => {
      toast.success("Funcionário cadastrado!");
      setShowForm(false);
      setForm({ name: "", cpf: "", phone: "", role: "" });
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Funcionários</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? "Cancelar" : "+ Adicionar"}
        </button>
      </div>

      {showForm && (
        <div className="card mb-6">
          <h2 className="font-semibold mb-4">Novo funcionário</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              companyId && create.mutate({ ...form, companyId, cpf: form.cpf, phone: form.phone });
            }}
            className="grid md:grid-cols-2 gap-3"
          >
            <input className="input" placeholder="Nome completo" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="input" placeholder="CPF" required value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} />
            <input className="input" placeholder="WhatsApp" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <input className="input" placeholder="Cargo" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
            <button type="submit" disabled={create.isPending} className="btn-primary md:col-span-2">
              {create.isPending ? "Salvando..." : "Cadastrar"}
            </button>
          </form>
        </div>
      )}

      <div className="card">
        <table className="w-full text-sm">
          <thead className="text-left text-gray-500 border-b">
            <tr>
              <th className="py-2">Nome</th>
              <th>CPF</th>
              <th>Cargo</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {employees?.map((emp) => (
              <tr key={emp.id} className="border-b last:border-0">
                <td className="py-3 font-medium">{emp.name}</td>
                <td>{emp.cpf}</td>
                <td>{emp.role ?? "—"}</td>
                <td>
                  <span className={`badge ${emp.status === "ativo" ? "badge-green" : "badge-yellow"}`}>
                    {emp.status}
                  </span>
                </td>
              </tr>
            ))}
            {!employees?.length && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-gray-500">Nenhum funcionário cadastrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
