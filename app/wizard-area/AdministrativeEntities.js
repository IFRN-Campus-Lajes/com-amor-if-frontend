"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaChevronDown,
  FaPen,
  FaPlus,
  FaPowerOff,
} from "react-icons/fa6";
import {
  fetchPrivateData,
  patchPrivateData,
  postPrivateData,
  putPrivateData,
} from "../../utils/api";
import LoadingSpinner from "../components/LoadingSpinner";

const TURN_NAMES = { 0: "Matutino", 1: "Vespertino" };
const EMPTY_CLASS = { nome: "", descricao: "", ano_letivo_id: "", turno: "" };

const errorText = (error) =>
  error?.response?.data?.errors?.[0] || "Não foi possível concluir a operação.";

export const sortSchoolYears = (years = []) =>
  [...years].sort((a, b) => Number(b.ano_letivo) - Number(a.ano_letivo));

export const initialExpandedYears = (years = []) =>
  Object.fromEntries(years.map((year) => [year.id, year.status === "Aberto"]));

export const groupClassesBySchoolYear = (years = [], classes = []) =>
  sortSchoolYears(years).map((year) => ({
    year,
    classes: classes
      .filter((schoolClass) => String(schoolClass.anoLetivo?.id) === String(year.id))
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" })),
  }));

export function SenseManagement({ token, notify }) {
  const [senses, setSenses] = useState([]);
  const [busy, setBusy] = useState(true);
  const [editing, setEditing] = useState(null);
  const [description, setDescription] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pending, setPending] = useState(null);

  const load = useCallback(async () => {
    setBusy(true);
    try {
      setSenses(await fetchPrivateData("admin/sensos", token));
    } catch (error) {
      notify("error", errorText(error));
    } finally {
      setBusy(false);
    }
  }, [notify, token]);

  useEffect(() => { load(); }, [load]);

  const save = async (event) => {
    event.preventDefault();
    try {
      if (editing) {
        await putPrivateData(`admin/sensos/${editing.id}`, { descricao: description }, token);
      } else {
        await postPrivateData("admin/sensos", { descricao: description }, token);
      }
      setEditing(null);
      setDescription("");
      setDialogOpen(false);
      notify("success", editing ? "Senso atualizado com sucesso." : "Senso criado com sucesso.");
      await load();
    } catch (error) {
      notify("error", errorText(error));
    }
  };

  const toggle = async (sense) => {
    try {
      await patchPrivateData(`admin/sensos/${sense.id}/status/${!sense.ativo}`, {}, token);
      notify("success", sense.ativo ? "Senso desativado com sucesso." : "Senso ativado com sucesso.");
      await load();
    } catch (error) {
      notify("error", errorText(error));
    }
  };

  if (busy) return <LoadingSpinner />;

  return <div>
    <SectionHeader title="Sensos" description="Gerencie os pilares usados para organizar regras e pontuações.">
      <PrimaryButton onClick={() => { setEditing(null); setDescription(""); setDialogOpen(true); }}>
        <FaPlus /> Novo senso
      </PrimaryButton>
    </SectionHeader>
    {senses.length === 0 ? <EmptyState text="Nenhum senso cadastrado." /> :
      <section className="grid gap-4 md:grid-cols-2">
        {senses.map((sense) => <article key={sense.id} className={`flex items-center justify-between gap-4 rounded-xl border bg-white p-4 shadow-sm ${!sense.ativo ? "border-gray-200 bg-gray-50" : "border-gray-200"}`}>
          <div className="min-w-0">
            <h2 className="break-words font-bold text-gray-900">{sense.descricao}</h2>
            <StatusBadge active={sense.ativo} activeText="Ativo" inactiveText="Inativo" />
          </div>
          <div className="flex gap-2">
            <IconButton label={`Editar ${sense.descricao}`} onClick={() => { setEditing(sense); setDescription(sense.descricao); setDialogOpen(true); }}><FaPen /></IconButton>
            <IconButton label={sense.ativo ? `Desativar ${sense.descricao}` : `Ativar ${sense.descricao}`} onClick={() => setPending(sense)}><FaPowerOff /></IconButton>
          </div>
        </article>)}
      </section>}
    {dialogOpen && <SimpleDialog title={editing ? "Editar senso" : "Novo senso"} close={() => { setEditing(null); setDescription(""); setDialogOpen(false); }} save={save}>
      <Field label="Descrição"><input autoFocus value={description} onChange={(event) => setDescription(event.target.value)} className={inputClass} required /></Field>
    </SimpleDialog>}
    {pending && <Confirmation title={pending.ativo ? "Desativar senso" : "Ativar senso"} description={pending.ativo ? `Desativar “${pending.descricao}”? Sensos com qualquer referência permanecerão ativos.` : `Ativar “${pending.descricao}”?`} confirmLabel={pending.ativo ? "Desativar" : "Ativar"} close={() => setPending(null)} confirm={async () => { const sense = pending; setPending(null); await toggle(sense); }} />}
  </div>;
}

export function ClassesManagement({ token, notify }) {
  const [years, setYears] = useState([]);
  const [classes, setClasses] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [busy, setBusy] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_CLASS);

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const [yearData, classData] = await Promise.all([
        fetchPrivateData("anoletivo/anos", token),
        fetchPrivateData("turma/turmas", token),
      ]);
      setYears(yearData);
      setClasses(classData);
      setExpanded((current) => Object.keys(current).length ? current : initialExpandedYears(yearData));
    } catch (error) {
      notify("error", errorText(error));
    } finally {
      setBusy(false);
    }
  }, [notify, token]);

  useEffect(() => { load(); }, [load]);

  const filteredClasses = useMemo(() => classes.filter((schoolClass) =>
    `${schoolClass.nome} ${schoolClass.descricao || ""}`.toLocaleLowerCase()
      .includes(search.toLocaleLowerCase())), [classes, search]);
  const groups = useMemo(() => groupClassesBySchoolYear(years, filteredClasses), [years, filteredClasses]);
  const openYears = years.filter((year) => year.status === "Aberto");

  const openForm = (schoolClass = null, yearId = "") => {
    setEditing(schoolClass);
    setForm(schoolClass ? {
      nome: schoolClass.nome,
      descricao: schoolClass.descricao || "",
      ano_letivo_id: String(schoolClass.anoLetivo?.id || ""),
      turno: String(schoolClass.turno ?? ""),
    } : { ...EMPTY_CLASS, ano_letivo_id: String(yearId) });
  };

  const save = async (event) => {
    event.preventDefault();
    try {
      await postPrivateData("turma/turma", {
        id: editing?.id || null,
        nome: form.nome,
        descricao: form.descricao,
        ano_letivo_id: Number(form.ano_letivo_id),
        turno: Number(form.turno),
      }, token);
      notify("success", editing ? "Turma atualizada com sucesso." : "Turma criada com sucesso.");
      setEditing(null);
      setForm(EMPTY_CLASS);
      await load();
    } catch (error) {
      notify("error", errorText(error));
    }
  };

  if (busy) return <LoadingSpinner />;

  return <div>
    <SectionHeader title="Turmas" description="As turmas estão organizadas por ano letivo, do mais recente para o mais antigo.">
      <PrimaryButton disabled={!openYears.length} onClick={() => openForm(null, openYears[0]?.id)}><FaPlus /> Nova turma</PrimaryButton>
    </SectionHeader>
    <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar turma por nome ou descrição" aria-label="Buscar turmas" className={`${inputClass} mb-5`} />
    <section className="space-y-4">
      {groups.map(({ year, classes: yearClasses }) => {
        const isOpen = Boolean(expanded[year.id]);
        const activeYear = year.status === "Aberto";
        return <article key={year.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <header className="flex items-center gap-2 bg-gray-50 p-3 sm:p-4">
            <button type="button" aria-expanded={isOpen} onClick={() => setExpanded((current) => ({ ...current, [year.id]: !current[year.id] }))} className="flex min-w-0 flex-1 items-center gap-3 text-left">
              <FaChevronDown className={`shrink-0 text-gray-500 transition-transform ${isOpen ? "" : "-rotate-90"}`} />
              <span className="font-black text-gray-900">{year.ano_letivo}</span>
              <StatusBadge active={activeYear} activeText="Aberto" inactiveText="Fechado" />
              <span className="ml-auto text-xs text-gray-500">{yearClasses.length} {yearClasses.length === 1 ? "turma" : "turmas"}</span>
            </button>
            {activeYear && <IconButton label={`Adicionar turma em ${year.ano_letivo}`} onClick={() => openForm(null, year.id)}><FaPlus /></IconButton>}
          </header>
          {isOpen && <div>
            {yearClasses.length === 0 ? <p className="p-5 text-sm text-gray-500">Nenhuma turma neste ano letivo.</p> :
              yearClasses.map((schoolClass) => <div key={schoolClass.id} className="flex flex-col justify-between gap-3 border-t border-gray-100 p-4 sm:flex-row sm:items-center">
                <div><h3 className="font-semibold text-gray-900">{schoolClass.nome}</h3><p className="mt-1 text-sm text-gray-500">{schoolClass.descricao || "Sem descrição"} · {TURN_NAMES[schoolClass.turno] || "Turno não informado"}</p></div>
                {activeYear && <IconButton label={`Editar ${schoolClass.nome}`} onClick={() => openForm(schoolClass)}><FaPen /></IconButton>}
              </div>)}
          </div>}
        </article>;
      })}
    </section>
    {(editing !== null || form !== EMPTY_CLASS) && <SimpleDialog title={editing ? "Editar turma" : "Nova turma"} close={() => { setEditing(null); setForm(EMPTY_CLASS); }} save={save}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome"><input autoFocus value={form.nome} onChange={(event) => setForm({ ...form, nome: event.target.value })} className={inputClass} required /></Field>
        <Field label="Descrição"><input value={form.descricao} onChange={(event) => setForm({ ...form, descricao: event.target.value })} className={inputClass} required /></Field>
        <Field label="Turno"><select value={form.turno} onChange={(event) => setForm({ ...form, turno: event.target.value })} className={inputClass} required><option value="">Selecione</option><option value="0">Matutino</option><option value="1">Vespertino</option></select></Field>
        <Field label="Ano letivo"><select value={form.ano_letivo_id} onChange={(event) => setForm({ ...form, ano_letivo_id: event.target.value })} className={inputClass} required><option value="">Selecione</option>{openYears.map((year) => <option key={year.id} value={year.id}>{year.ano_letivo}</option>)}</select></Field>
      </div>
    </SimpleDialog>}
  </div>;
}

export function SchoolYearsManagement({ token, notify }) {
  const [years, setYears] = useState([]);
  const [busy, setBusy] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ano_letivo: "", aberto: false });
  const [dialogOpen, setDialogOpen] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    try { setYears(sortSchoolYears(await fetchPrivateData("anoletivo/anos", token))); }
    catch (error) { notify("error", errorText(error)); }
    finally { setBusy(false); }
  }, [notify, token]);
  useEffect(() => { load(); }, [load]);

  const openForm = (year = null) => {
    setEditing(year);
    setForm(year ? { ano_letivo: year.ano_letivo, aberto: year.status === "Aberto" } : { ano_letivo: "", aberto: false });
    setDialogOpen(true);
  };

  const save = async (event) => {
    event.preventDefault();
    try {
      await postPrivateData("anoletivo/ano", { id: editing?.id || null, ano_letivo: Number(form.ano_letivo), aberto: form.aberto }, token);
      notify("success", editing ? "Ano letivo atualizado com sucesso." : "Ano letivo criado com sucesso.");
      setEditing(null);
      setDialogOpen(false);
      await load();
    } catch (error) { notify("error", errorText(error)); }
  };

  if (busy) return <LoadingSpinner />;

  return <div>
    <SectionHeader title="Anos letivos" description="Gerencie os períodos usados para organizar turmas e pontuações.">
      <PrimaryButton onClick={() => openForm()}><FaPlus /> Novo ano letivo</PrimaryButton>
    </SectionHeader>
    {years.length === 0 ? <EmptyState text="Nenhum ano letivo cadastrado." /> :
      <section className="grid gap-4 md:grid-cols-2">
        {years.map((year) => <article key={year.id} className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div><h2 className="text-xl font-black text-gray-900">{year.ano_letivo}</h2><StatusBadge active={year.status === "Aberto"} activeText="Aberto" inactiveText="Fechado" /></div>
          <IconButton label={`Editar ano letivo ${year.ano_letivo}`} onClick={() => openForm(year)}><FaPen /></IconButton>
        </article>)}
      </section>}
    {dialogOpen && <SimpleDialog title={editing ? "Editar ano letivo" : "Novo ano letivo"} close={() => { setEditing(null); setForm({ ano_letivo: "", aberto: false }); setDialogOpen(false); }} save={save}>
      <Field label="Ano"><input autoFocus type="number" min="2000" max="9999" value={form.ano_letivo} onChange={(event) => setForm({ ...form, ano_letivo: event.target.value })} className={inputClass} required /></Field>
      <label className="mt-4 flex min-h-11 items-center gap-3 text-sm font-semibold"><input type="checkbox" checked={form.aberto} onChange={(event) => setForm({ ...form, aberto: event.target.checked })} className="h-5 w-5" /> Ano letivo aberto</label>
    </SimpleDialog>}
  </div>;
}

const inputClass = "mt-2 min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

function SectionHeader({ title, description, children }) {
  return <header className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><h2 className="text-2xl font-black text-gray-900">{title}</h2><p className="mt-1 text-sm text-gray-600">{description}</p></div>{children}</header>;
}
function PrimaryButton({ children, ...props }) {
  return <button type="button" {...props} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50">{children}</button>;
}
function IconButton({ label, children, ...props }) {
  return <button type="button" aria-label={label} {...props} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-gray-200 text-gray-700 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">{children}</button>;
}
function StatusBadge({ active, activeText, inactiveText }) {
  return <span className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${active ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-600"}`}>{active ? activeText : inactiveText}</span>;
}
function EmptyState({ text }) {
  return <p className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">{text}</p>;
}
function Field({ label, children }) {
  return <label className="block text-sm font-semibold text-gray-800">{label}{children}</label>;
}
function SimpleDialog({ title, close, save, children }) {
  return <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-black/50 p-3"><form role="dialog" aria-modal="true" aria-label={title} onSubmit={save} className="w-full max-w-xl rounded-2xl bg-white shadow-2xl"><header className="flex items-center justify-between border-b p-4 sm:p-5"><h2 className="text-xl font-black">{title}</h2><button type="button" onClick={close} className="grid h-10 w-10 place-items-center rounded-lg text-2xl hover:bg-gray-100" aria-label="Fechar">×</button></header><div className="p-4 sm:p-5">{children}</div><footer className="flex flex-col-reverse gap-3 border-t p-4 sm:flex-row sm:justify-end"><button type="button" onClick={close} className="min-h-11 rounded-lg border px-5 font-semibold">Cancelar</button><button className="min-h-11 rounded-lg bg-primary px-5 font-bold text-white">Salvar</button></footer></form></div>;
}
function Confirmation({ title, description, confirmLabel, close, confirm }) {
  return <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-3"><div role="dialog" aria-modal="true" aria-label={title} className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"><h2 className="text-xl font-black">{title}</h2><p className="mt-3 text-sm text-gray-600">{description}</p><div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={close} className="min-h-11 rounded-lg border px-4 font-semibold">Cancelar</button><button type="button" onClick={confirm} className="min-h-11 rounded-lg bg-primary px-4 font-bold text-white">{confirmLabel}</button></div></div></div>;
}
