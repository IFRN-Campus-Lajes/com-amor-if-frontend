"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { FaBolt, FaCircleMinus, FaCirclePlus, FaCrown, FaLayerGroup, FaPen, FaPlus, FaPowerOff } from "react-icons/fa6";
import { useAuth } from "../../providers/AuthProvider";
import { deletePrivateData, fetchPrivateData, patchPrivateData, postPrivateData, putPrivateData } from "../../utils/api";
import { isFromCategory } from "../../utils/role";
import LoadingSpinner from "../components/LoadingSpinner";
import MessageBox from "../components/MessageBox";
import NotAuthorized from "../components/NotAuthorized";

const EMPTY_RULE = { descricao: "", grupo: "", categoria: "", operacao: "SUM", valorMinimo: 0, valorMaximo: 0, sensoId: "", tipoRegraId: "", roleIds: [], ativo: true };
const EMPTY_CATEGORY = { nome: "", descricao: "", ativo: true };
const FREQUENCIES = ["Anual", "Bimestral", "Avulsa"];
const SENSE_TAB_STYLES = {
  "Limpeza": { active: "border-[#18a08c] bg-[#e8f6f3] text-[#117968]", idle: "text-[#167e6d] hover:bg-[#e8f6f3]" },
  "Saúde": { active: "border-[#2fa98c] bg-[#e7f8f2] text-[#197e68]", idle: "text-[#237d6b] hover:bg-[#e7f8f2]" },
  "Utilização": { active: "border-[#d69b00] bg-[#fff7d9] text-[#8c6500]", idle: "text-[#896300] hover:bg-[#fff7d9]" },
  "Ordenação": { active: "border-[#ea8019] bg-[#fff0df] text-[#ad4d00]", idle: "text-[#ab5109] hover:bg-[#fff0df]" },
  "Autodisciplina": { active: "border-[#e56267] bg-[#fff0f1] text-[#a83743]", idle: "text-[#a83a44] hover:bg-[#fff0f1]" },
};

const errorText = (error) => error?.response?.data?.errors?.[0] || error?.response?.data?.message || "Não foi possível concluir a operação.";

export default function GodModePage() {
  const { user, getToken, isLoading } = useAuth();
  const token = getToken();
  const [rules, setRules] = useState([]);
  const [metadata, setMetadata] = useState({ sensos: [], tipos: [], roles: [], categorias: [] });
  const [tab, setTab] = useState("rules");
  const [sense, setSense] = useState("");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_RULE);
  const [categoryEditing, setCategoryEditing] = useState(null);
  const [categoryForm, setCategoryForm] = useState(EMPTY_CATEGORY);
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);

  const load = async () => {
    setBusy(true);
    try {
      const [ruleData, metaData] = await Promise.all([
        fetchPrivateData("admin/regras", token),
        fetchPrivateData("admin/regras/metadados", token),
      ]);
      setRules(ruleData);
      setMetadata(metaData);
      setSense((current) => current || metaData.sensos?.[0]?.descricao || "");
    } catch (error) { setMessage({ type: "error", text: errorText(error) }); }
    finally { setBusy(false); }
  };

  useEffect(() => { if (token && user && isFromCategory(user, "Admin")) load(); }, [token, user]);

  const visibleRules = useMemo(() => rules.filter((rule) => {
    const haystack = `${rule.descricao} ${rule.categoria || ""} ${rule.grupo || ""}`.toLocaleLowerCase();
    return (!sense || rule.senso === sense) &&
      (status === "all" || (status === "active" ? rule.ativo : !rule.ativo)) &&
      haystack.includes(search.toLocaleLowerCase());
  }), [rules, sense, status, search]);

  const grouped = useMemo(() => visibleRules.reduce((result, rule) => {
    const key = rule.categoria || "Outras regras";
    result[key] = [...(result[key] || []), rule];
    return result;
  }, {}), [visibleRules]);

  if (isLoading) return <LoadingSpinner />;
  if (!user || !isFromCategory(user, "Admin")) return <NotAuthorized />;

  const openRule = (rule = null) => {
    setEditing(rule);
    setForm(rule ? {
      descricao: rule.descricao, grupo: rule.grupo || "", categoria: rule.categoria || "",
      operacao: rule.operacao, valorMinimo: rule.valorMinimo, valorMaximo: rule.valorMaximo,
      sensoId: String(rule.sensoId), tipoRegraId: String(rule.tipoRegraId), roleIds: rule.roleIds,
      ativo: rule.ativo,
    } : { ...EMPTY_RULE, sensoId: metadata.sensos?.[0]?.id || "", tipoRegraId: metadata.tipos?.[0]?.id || "", categoria: metadata.categorias?.find((c) => c.ativo)?.nome || "" });
  };

  const saveRule = async (event) => {
    event.preventDefault();
    try {
      const selectedType = metadata.tipos.find((item) => String(item.id) === String(form.tipoRegraId));
      const minimo = Number(form.valorMinimo);
      const maximo = selectedType?.fixo ? minimo : Math.max(minimo, Number(form.valorMaximo));
      const payload = { ...form, sensoId: Number(form.sensoId), tipoRegraId: Number(form.tipoRegraId), valorMinimo: minimo, valorMaximo: maximo, roleIds: form.roleIds.map(Number) };
      if (editing) await putPrivateData(`admin/regras/${editing.id}`, payload, token);
      else await postPrivateData("admin/regras", payload, token);
      setMessage({ type: "success", text: editing ? "Regra atualizada com sucesso." : "Regra criada com sucesso." });
      setEditing(null); setForm(EMPTY_RULE); await load();
    } catch (error) { setMessage({ type: "error", text: errorText(error) }); }
  };

  const toggleRule = async (rule) => {
    try { await patchPrivateData(`admin/regras/${rule.id}/status/${!rule.ativo}`, {}, token); await load(); }
    catch (error) { setMessage({ type: "error", text: errorText(error) }); }
  };

  const saveCategory = async (event) => {
    event.preventDefault();
    try {
      if (categoryEditing) await putPrivateData(`admin/categorias-regras/${categoryEditing.id}`, categoryForm, token);
      else await postPrivateData("admin/categorias-regras", categoryForm, token);
      setCategoryEditing(null); setCategoryForm(EMPTY_CATEGORY); await load();
      setMessage({ type: "success", text: "Categoria salva com sucesso." });
    } catch (error) { setMessage({ type: "error", text: errorText(error) }); }
  };

  const removeCategory = async (category) => {
    try { await deletePrivateData(`admin/categorias-regras/${category.id}`, token); await load(); }
    catch (error) { setMessage({ type: "error", text: errorText(error) }); }
  };

  return <div className="min-h-full bg-slate-50 py-8">
    <div className="container mx-auto max-w-6xl px-4">
      {message && <MessageBox message={message.text} color={message.type === "error" ? "detail-minor" : "lime-400"} onClose={() => setMessage(null)} />}
      <header className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="flex items-center gap-3"><Image src="/mascots/modo-deus-wizard.png" alt="Mago do Modo Deus" width={80} height={80} priority className="wizard-mascot h-20 w-20 object-contain" /><div><h1 className="flex items-center gap-3 text-3xl font-black text-gray-900"><FaCrown className="text-accent" /> Modo Deus</h1><p className="mt-2 text-gray-600">Defina as regras que movimentam a Corrida das Turmas.</p></div></div>
        {tab === "rules" && <button onClick={() => openRule()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-bold text-white shadow-sm hover:bg-primary-dark"><FaPlus /> Nova regra</button>}
      </header>

      <div className="mb-6 flex border-b border-gray-200" role="tablist">
        <button onClick={() => setTab("rules")} className={`flex items-center gap-2 border-b-2 px-4 py-3 font-semibold ${tab === "rules" ? "border-primary text-primary" : "border-transparent text-gray-500"}`}><FaBolt /> Regras</button>
        <button onClick={() => setTab("categories")} className={`flex items-center gap-2 border-b-2 px-4 py-3 font-semibold ${tab === "categories" ? "border-primary text-primary" : "border-transparent text-gray-500"}`}><FaLayerGroup /> Categorias</button>
      </div>

      {busy ? <LoadingSpinner /> : tab === "rules" ? <>
        <section className="mb-5 grid gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_160px]">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por descrição, categoria ou grupo" className="min-h-11 rounded-lg border border-gray-300 px-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="min-h-11 rounded-lg border border-gray-300 bg-white px-3"><option value="all">Todas</option><option value="active">Ativas</option><option value="inactive">Inativas</option></select>
        </section>
        <div className="mb-6 flex gap-1 overflow-x-auto border-b border-gray-200">
          {metadata.sensos.map((item) => { const style = SENSE_TAB_STYLES[item.descricao] || { active: "border-primary bg-emerald-50 text-primary", idle: "text-gray-600 hover:bg-gray-100" }; return <button key={item.id} onClick={() => setSense(item.descricao)} className={`whitespace-nowrap rounded-t-lg border-b-2 px-4 py-3 text-sm font-semibold ${sense === item.descricao ? style.active : `border-transparent ${style.idle}`}`}>{item.descricao} <span className="ml-1 text-xs">{rules.filter((r) => r.senso === item.descricao).length}</span></button>; })}
        </div>
        {Object.keys(grouped).length === 0 && <p className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">Nenhuma regra encontrada.</p>}
        {Object.entries(grouped).map(([category, items]) => <section key={category} className="mb-7"><div className="mb-2 flex items-center gap-2"><h2 className="font-bold text-gray-900">{category}</h2><span className="text-xs text-gray-500">{items.length} {items.length === 1 ? "regra" : "regras"}</span></div><div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {items.map((rule) => <article key={rule.id} className={`grid items-center gap-3 border-b border-gray-100 p-4 last:border-0 sm:grid-cols-[34px_1fr_auto_auto] ${!rule.ativo ? "bg-gray-50 opacity-70" : ""}`}>
            <span className={`grid h-8 w-8 place-items-center rounded-full ${rule.operacao === "SUM" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>{rule.operacao === "SUM" ? <FaCirclePlus /> : <FaCircleMinus />}</span>
            <div><h3 className="font-semibold text-gray-900">{rule.descricao}</h3><p className="mt-1 text-xs text-gray-500">{rule.fixo ? `${rule.valorMinimo} pontos` : `${rule.valorMinimo}–${rule.valorMaximo} pontos`} · {rule.temAluno ? "por aluno" : rule.porTurno ? "por turno" : "por turma"} · {FREQUENCIES[rule.frequencia] || "Configurável"} · v{rule.versao || 1}</p></div>
            <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-bold ${rule.ativo ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-600"}`}>{rule.ativo ? "Ativa" : "Inativa"}</span>
            <div className="flex gap-2"><button onClick={() => openRule(rule)} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-gray-200 px-3 text-sm font-semibold hover:bg-gray-50"><FaPen /> Editar</button><button onClick={() => setPendingAction({ title: rule.ativo ? "Desativar regra" : "Ativar regra", description: `${rule.ativo ? "Desativar" : "Ativar"} “${rule.descricao}”? O histórico de pontuações será preservado.`, confirmLabel: rule.ativo ? "Desativar" : "Ativar", onConfirm: () => toggleRule(rule) })} aria-label={rule.ativo ? "Desativar" : "Ativar"} className="grid min-h-10 min-w-10 place-items-center rounded-lg border border-gray-200 hover:bg-gray-50"><FaPowerOff /></button></div>
          </article>)}
        </div></section>)}
      </> : <Categories categories={metadata.categorias} editing={categoryEditing} form={categoryForm} setEditing={setCategoryEditing} setForm={setCategoryForm} save={saveCategory} remove={(category) => setPendingAction({ title: "Excluir categoria", description: `Excluir a categoria “${category.nome}”? Esta ação não poderá ser desfeita.`, confirmLabel: "Excluir", destructive: true, onConfirm: () => removeCategory(category) })} />}
    </div>
    {(editing !== null || (editing === null && form !== EMPTY_RULE && form.sensoId)) && <RuleDialog editing={editing} form={form} setForm={setForm} metadata={metadata} save={saveRule} close={() => { setEditing(null); setForm(EMPTY_RULE); }} />}
    {pendingAction && <ConfirmationDialog {...pendingAction} close={() => setPendingAction(null)} />}
  </div>;
}

function Categories({ categories, editing, form, setEditing, setForm, save, remove }) {
  const edit = (item) => { setEditing(item); setForm({ nome: item.nome, descricao: item.descricao || "", ativo: item.ativo }); };
  return <div className="grid gap-6 lg:grid-cols-[1fr_360px]"><section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">{categories.length === 0 ? <p className="p-8 text-center text-gray-500">Crie a primeira categoria.</p> : categories.map((item) => <article key={item.id} className="flex items-center justify-between gap-4 border-b border-gray-100 p-4 last:border-0"><div><h2 className="font-bold text-gray-900">{item.nome}</h2><p className="mt-1 text-sm text-gray-500">{item.descricao || "Sem descrição"}</p></div><div className="flex items-center gap-2"><span className={`rounded-full px-2 py-1 text-xs font-bold ${item.ativo ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-600"}`}>{item.ativo ? "Ativa" : "Inativa"}</span><button onClick={() => edit(item)} className="rounded-lg border p-2" aria-label="Editar"><FaPen /></button><button onClick={() => remove(item)} className="rounded-lg border p-2 text-red-700" aria-label="Excluir">×</button></div></article>)}</section><form onSubmit={save} className="h-fit rounded-xl border border-gray-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-bold">{editing ? "Editar categoria" : "Nova categoria"}</h2><label className="mt-4 block text-sm font-semibold">Nome<input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className="mt-2 min-h-11 w-full rounded-lg border px-3" required /></label><label className="mt-4 block text-sm font-semibold">Descrição<textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} className="mt-2 min-h-24 w-full rounded-lg border px-3 py-2" /></label><label className="mt-4 flex items-center gap-2 text-sm"><input type="checkbox" checked={form.ativo} onChange={(e) => setForm({ ...form, ativo: e.target.checked })} /> Categoria ativa</label><div className="mt-5 flex justify-end gap-2">{editing && <button type="button" onClick={() => { setEditing(null); setForm(EMPTY_CATEGORY); }} className="rounded-lg border px-4 py-2">Cancelar</button>}<button className="rounded-lg bg-primary px-4 py-2 font-bold text-white">Salvar</button></div></form></div>;
}

function RuleDialog({ editing, form, setForm, metadata, save, close }) {
  const type = metadata.tipos.find((item) => String(item.id) === String(form.tipoRegraId));
  const set = (key, value) => setForm({ ...form, [key]: value });
  return <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:py-10"><form onSubmit={save} className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl"><header className="flex items-start justify-between border-b p-5"><div><p className="text-xs font-bold uppercase tracking-wider text-primary">Modo Deus</p><h2 className="text-xl font-black">{editing ? "Editar regra" : "Criar nova regra"}</h2>{editing && <p className="mt-1 text-sm text-gray-500">Se houver lançamentos, uma nova versão será criada automaticamente.</p>}</div><button type="button" onClick={close} className="text-2xl" aria-label="Fechar">×</button></header><div className="grid gap-5 p-5 sm:grid-cols-2">
    <label className="sm:col-span-2 text-sm font-semibold">Descrição<input value={form.descricao} onChange={(e) => set("descricao", e.target.value)} className="mt-2 min-h-11 w-full rounded-lg border px-3" required /></label>
    <label className="text-sm font-semibold">Senso<select value={form.sensoId} onChange={(e) => set("sensoId", e.target.value)} className="mt-2 min-h-11 w-full rounded-lg border bg-white px-3" required>{metadata.sensos.map((item) => <option key={item.id} value={item.id}>{item.descricao}</option>)}</select></label>
    <label className="text-sm font-semibold">Categoria<select value={form.categoria} onChange={(e) => set("categoria", e.target.value)} className="mt-2 min-h-11 w-full rounded-lg border bg-white px-3" required><option value="">Selecione</option>{metadata.categorias.filter((item) => item.ativo || item.nome === form.categoria).map((item) => <option key={item.id}>{item.nome}</option>)}</select></label>
    <label className="sm:col-span-2 text-sm font-semibold">Tipo de regra<select value={form.tipoRegraId} onChange={(e) => set("tipoRegraId", e.target.value)} className="mt-2 min-h-11 w-full rounded-lg border bg-white px-3" required>{metadata.tipos.map((item) => <option key={item.id} value={item.id}>{item.descricao}</option>)}</select></label>
    <label className="text-sm font-semibold">Operação<select value={form.operacao} onChange={(e) => set("operacao", e.target.value)} className="mt-2 min-h-11 w-full rounded-lg border bg-white px-3"><option value="SUM">Adicionar pontos</option><option value="SUB">Subtrair pontos</option></select></label>
    {editing && form.grupo && <label className="text-sm font-semibold">Grupo<input value={form.grupo} className="mt-2 min-h-11 w-full rounded-lg border bg-gray-50 px-3 text-gray-600" readOnly aria-readonly="true" /></label>}
    <label className="text-sm font-semibold">Valor {type?.fixo ? "fixo" : "mínimo"}<input type="number" min="0" value={form.valorMinimo} onChange={(e) => { const value = e.target.value; setForm({ ...form, valorMinimo: value, valorMaximo: !type?.fixo && Number(value) > Number(form.valorMaximo) ? value : form.valorMaximo }); }} className="mt-2 min-h-11 w-full rounded-lg border px-3" required /></label>
    {!type?.fixo && <label className="text-sm font-semibold">Valor máximo<input type="number" min={form.valorMinimo} value={form.valorMaximo} onChange={(e) => set("valorMaximo", e.target.value)} className="mt-2 min-h-11 w-full rounded-lg border px-3" required /></label>}
    <fieldset className="sm:col-span-2"><legend className="text-sm font-semibold">Perfis autorizados</legend><div className="mt-2 grid gap-2 rounded-lg border p-3 sm:grid-cols-2">{metadata.roles.map((role) => <label key={role.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.roleIds.includes(role.id)} onChange={(e) => set("roleIds", e.target.checked ? [...form.roleIds, role.id] : form.roleIds.filter((id) => id !== role.id))} /> {role.name.replace("ROLE_", "").replaceAll("_", " ")}</label>)}</div></fieldset>
    <div className="sm:col-span-2 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-950"><strong>Prévia:</strong> {form.operacao === "SUM" ? "+" : "−"} {form.valorMinimo || 0}{!type?.fixo ? ` a ${form.valorMaximo || 0}` : ""} pontos · {type?.temAluno ? "por aluno" : type?.porTurno ? "por turno" : "por turma"} · {FREQUENCIES[type?.frequencia] || "frequência configurada"}</div>
  </div><footer className="flex justify-end gap-3 border-t p-5"><button type="button" onClick={close} className="rounded-lg border px-5 py-2.5 font-semibold">Cancelar</button><button className="rounded-lg bg-primary px-5 py-2.5 font-bold text-white">{editing ? "Salvar versão" : "Criar regra"}</button></footer></form></div>;
}

function ConfirmationDialog({ title, description, confirmLabel, destructive, onConfirm, close }) {
  const confirm = async () => { await onConfirm(); close(); };
  return <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"><div role="dialog" aria-modal="true" aria-labelledby="confirmation-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><h2 id="confirmation-title" className="text-xl font-black text-gray-900">{title}</h2><p className="mt-3 text-sm leading-relaxed text-gray-600">{description}</p><div className="mt-6 flex justify-end gap-3"><button onClick={close} className="rounded-lg border px-4 py-2.5 font-semibold">Cancelar</button><button onClick={confirm} className={`rounded-lg px-4 py-2.5 font-bold text-white ${destructive ? "bg-red-600 hover:bg-red-700" : "bg-primary hover:bg-primary-dark"}`}>{confirmLabel}</button></div></div></div>;
}
