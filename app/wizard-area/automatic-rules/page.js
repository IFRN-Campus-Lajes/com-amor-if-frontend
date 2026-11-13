"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "../../../providers/AuthProvider";
import { isFromCategory } from "../../../utils/role";
import { fetchPrivateData, postPrivateData } from "../../../utils/api";
import NotAuthorized from "../../components/NotAuthorized";
import LoadingSpinner from "../../components/LoadingSpinner";

const labels = { EM_EXECUCAO: "Em execução", SUCESSO: "Concluída", FALHA: "Falha", IGNORADA: "Ignorada" };
const colors = { SUCESSO: "bg-emerald-100 text-emerald-800", FALHA: "bg-red-100 text-red-800", EM_EXECUCAO: "bg-amber-100 text-amber-900", IGNORADA: "bg-gray-100 text-gray-700" };
const date = value => value ? new Date(value).toLocaleString("pt-BR", { timeZone: "America/Fortaleza" }) : "—";
function ExecutionCard({ item }) {
  return <li className="min-w-0 space-y-3 border-t p-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <span className="text-sm font-semibold text-amber-950">{item.origem === "MENSAL" ? "Mensal" : "Administrativa"}</span>
      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${colors[item.status] || ""}`}>{labels[item.status] || item.status}</span>
    </div>
    <dl className="space-y-2 text-sm">
      <div><dt className="text-xs text-gray-500">Solicitante</dt><dd className="break-all">{item.solicitante}</dd></div>
      <div><dt className="text-xs text-gray-500">Ano / período</dt><dd>{item.ano ?? "—"} · {item.bimestre == null ? "Todos os bimestres" : `${item.bimestre + 1}º bimestre`}</dd></div>
      <div><dt className="text-xs text-gray-500">Início</dt><dd>{date(item.inicio)}</dd></div>
      <div><dt className="text-xs text-gray-500">Fim</dt><dd>{date(item.fim)}</dd></div>
    </dl>
    <dl className="grid grid-cols-3 gap-2 rounded-lg bg-amber-50 p-3 text-center">
      {[ ["Criados", item.criados], ["Já existentes", item.existentes], ["Sem direito", item.inelegiveis] ].map(([label, value]) =>
        <div key={label}><dt className="text-xs text-gray-600">{label}</dt><dd className="mt-1 font-bold text-amber-950">{value}</dd></div>)}
    </dl>
    {item.erro && <p className="break-words text-sm text-red-700">{item.erro}</p>}
    <p className="break-all text-xs text-gray-400">{item.id}</p>
  </li>;
}

export default function AutomaticRulesPage() {
  const { user, getToken, isLoading } = useAuth();
  const token = getToken();
  const allowed = !!user && isFromCategory(user, "Admin");
  const [data, setData] = useState({ content: [], totalPages: 0 });
  const [page, setPage] = useState(0);
  const [period, setPeriod] = useState("");
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await fetchPrivateData(`admin/regras-automaticas/execucoes?page=${page}&size=20`, token)); }
    catch { setError("Não foi possível carregar as execuções. Tente atualizar."); }
    finally { setLoading(false); }
  }, [page, token]);
  useEffect(() => { if (allowed && token) load(); }, [allowed, token, load]);
  async function reprocess() {
    setRunning(true); setError(""); setMessage("");
    try {
      const result = await postPrivateData("admin/regras-automaticas/reprocessar", { bimestre: period === "" ? null : Number(period) }, token);
      setMessage(`Execução ${labels[result.status] || result.status}: ${result.criados} bônus criados.`);
    } catch (err) { setError(err?.response?.data?.errors?.[0] || err?.response?.data?.message || "Não foi possível concluir. Consulte o histórico antes de tentar novamente."); }
    finally { setRunning(false); await load(); }
  }
  if (isLoading) return <LoadingSpinner />;
  if (!allowed) return <NotAuthorized />;
  return <main className="mx-auto max-w-7xl space-y-6 px-4 py-10">
    <header className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-4 shadow-sm sm:p-6">
      <Link href="/wizard-area" className="text-sm font-semibold text-amber-800 hover:text-amber-950">← Área do Mago</Link>
      <h1 className="mt-3 text-2xl font-bold text-amber-950 sm:text-3xl">Regras automáticas</h1>
    </header>
    <section className="rounded-2xl border border-amber-200 bg-white p-4 shadow-sm sm:p-6">
      <h2 className="text-xl font-bold text-amber-950">Reprocessar bônus</h2>
      <p className="my-3 text-sm text-gray-600">Os bônus de limpeza e ordenação são processados automaticamente uma vez por mês. Use o reprocessamento apenas para consolidar manualmente esses dois bônus como administrador.</p>
      <div className="flex flex-wrap items-end gap-3">
        <label className="w-full text-sm font-medium text-gray-700 sm:w-auto">Período<select className="mt-1 block min-h-11 w-full rounded-lg border p-2" value={period} onChange={e => setPeriod(e.target.value)} disabled={running}><option value="">Todos os bimestres</option>{[0,1,2,3].map(n => <option key={n} value={n}>{n+1}º bimestre</option>)}</select></label>
        <button onClick={reprocess} disabled={running} className="min-h-11 w-full rounded-lg bg-amber-900 px-4 py-2 sm:w-auto font-semibold text-white hover:bg-amber-800 disabled:opacity-50">{running ? "Processando…" : "Reprocessar"}</button>
      </div>
      {message && <p role="status" className="mt-4 text-emerald-800">{message}</p>}
      {error && <p role="alert" className="mt-4 text-red-700">{error}</p>}
    </section>
    <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5"><h2 className="text-xl font-bold text-amber-950">Histórico de execuções</h2><button onClick={load} disabled={loading || running} className="min-h-11 rounded-lg border px-3 py-2 text-sm disabled:opacity-50">Atualizar</button></div>
      <p className="px-5 pb-3 text-xs text-gray-500">Contagens por turma, regra e bimestre.</p>
      <ul aria-label="Execuções em telas pequenas" className="md:hidden">
        {!data.content.length && <li className="border-t p-6 text-center text-sm text-gray-500">{loading ? "Carregando…" : "Nenhuma execução registrada."}</li>}
        {data.content.map(item => <ExecutionCard key={item.id} item={item} />)}
      </ul>
      <div className="hidden overflow-x-auto md:block"><table className="w-full text-left text-sm"><thead className="bg-amber-50 text-amber-950"><tr>{["Início / fim", "Origem / solicitante", "Ano / período", "Situação", "Criados", "Já existentes", "Sem direito"].map(t => <th key={t} className="whitespace-nowrap p-4">{t}</th>)}</tr></thead><tbody>
      {!data.content.length && <tr><td colSpan={7} className="p-6 text-center text-gray-500">{loading ? "Carregando…" : "Nenhuma execução registrada."}</td></tr>}
      {data.content.map(item => <tr key={item.id} className="border-t align-top"><td className="p-4 whitespace-nowrap">{date(item.inicio)}<br/><span className="text-xs text-gray-500">{date(item.fim)}</span></td><td className="p-4">{item.origem === "MENSAL" ? "Mensal" : "Administrativa"}<div className="text-xs text-gray-500">{item.solicitante}</div></td><td className="p-4">{item.ano ?? "—"}<div className="whitespace-nowrap text-xs text-gray-500">{item.bimestre == null ? "Todos os bimestres" : `${item.bimestre+1}º bimestre`}</div></td><td className="p-4"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${colors[item.status] || ""}`}>{labels[item.status] || item.status}</span><p className="mt-2 max-w-xs text-xs text-gray-600">{item.erro}</p><div className="mt-2 break-all text-xs text-gray-400">{item.id}</div></td><td className="p-4">{item.criados}</td><td className="p-4">{item.existentes}</td><td className="p-4">{item.inelegiveis}</td></tr>)}
      </tbody></table></div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t p-4 text-sm sm:justify-end sm:gap-4"><button disabled={page === 0 || loading} onClick={() => setPage(page-1)} className="min-h-11 px-2 disabled:opacity-40">Anterior</button><span>Página {page+1} de {Math.max(1,data.totalPages)}</span><button disabled={page+1 >= data.totalPages || loading} onClick={() => setPage(page+1)} className="min-h-11 px-2 disabled:opacity-40">Próxima</button></div>
    </section>
  </main>;
}
