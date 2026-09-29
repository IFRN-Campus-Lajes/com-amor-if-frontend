"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Button from "../components/Button";
import LoadingSpinner from "../components/LoadingSpinner";
import MessageBox from "../components/MessageBox";
import Modal from "../components/Modal";
import NotAuthorized from "../components/NotAuthorized";
import { useAuth } from "../../providers/AuthProvider";
import {
  deletePrivateData,
  fetchPrivateData,
  postPrivateData,
  putPrivateData,
} from "../../utils/api";
import { canManageOlympiads } from "../../utils/role";

export default function OlympiadsPage() {
  const { user, isLoading, isLoggingOut, getToken } = useAuth();
  const token = getToken();
  const [olympiads, setOlympiads] = useState([]);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [message, setMessage] = useState({ error: null, success: null });

  const loadOlympiads = useCallback(async () => {
    try {
      setIsFetching(true);
      setOlympiads(await fetchPrivateData("olimpiadas", token));
    } catch (error) {
      setMessage({ error: error?.response?.data?.errors?.[0] || "Não foi possível carregar as olimpíadas." });
    } finally {
      setIsFetching(false);
    }
  }, [token]);

  useEffect(() => {
    if (user && canManageOlympiads(user)) loadOlympiads();
  }, [user, loadOlympiads]);

  const filteredOlympiads = useMemo(
    () => olympiads.filter((item) => item.nome.toLowerCase().includes(search.trim().toLowerCase())),
    [olympiads, search]
  );

  const openCreate = () => {
    setEditing({ id: null });
    setName("");
  };

  const openEdit = (olympiad) => {
    setEditing(olympiad);
    setName(olympiad.nome);
  };

  const save = async () => {
    const normalizedName = name.trim();
    if (!normalizedName) {
      setMessage({ error: "Informe o nome da olimpíada." });
      return;
    }
    try {
      setIsSaving(true);
      if (editing.id) {
        await putPrivateData(`olimpiadas/${editing.id}`, { nome: normalizedName }, token);
      } else {
        await postPrivateData("olimpiadas", { nome: normalizedName }, token);
      }
      setEditing(null);
      setMessage({ success: `Olimpíada ${editing.id ? "atualizada" : "cadastrada"} com sucesso.` });
      await loadOlympiads();
    } catch (error) {
      setMessage({ error: error?.response?.data?.errors?.[0] || "Não foi possível salvar a olimpíada." });
    } finally {
      setIsSaving(false);
    }
  };

  const remove = async () => {
    try {
      setIsSaving(true);
      await deletePrivateData(`olimpiadas/${deleting.id}`, token);
      setDeleting(null);
      setMessage({ success: "Olimpíada excluída com sucesso." });
      await loadOlympiads();
    } catch (error) {
      setMessage({ error: error?.response?.data?.errors?.[0] || "Não foi possível excluir a olimpíada." });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || isLoggingOut) return <LoadingSpinner />;
  if (!user || !canManageOlympiads(user)) return <NotAuthorized />;

  return (
    <main className="container mx-auto px-4 py-6 sm:px-6">
      {message.error && (
        <MessageBox message={message.error} color="detail-minor" onClose={() => setMessage({ error: null })} />
      )}
      {message.success && (
        <MessageBox message={message.success} color="lime-400" onClose={() => setMessage({ success: null })} />
      )}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Olimpíadas</h1>
          <p className="mt-1 text-sm text-gray-600">Cadastre as olimpíadas disponíveis para os lançamentos de pontos.</p>
        </div>
        <Button label="Adicionar olimpíada" onClick={openCreate} className="w-full sm:w-auto" />
      </div>

      <label htmlFor="search-olympiad" className="sr-only">Buscar olimpíada</label>
      <input
        id="search-olympiad"
        type="search"
        placeholder="Buscar olimpíada..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="mb-4 min-h-11 w-full rounded-md border border-gray-300 px-4 py-2 shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      />

      {isFetching ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {filteredOlympiads.map((olympiad) => (
              <article key={olympiad.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <p className="break-words font-semibold text-gray-900">{olympiad.nome}</p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button label="Editar" onClick={() => openEdit(olympiad)} color="bg-yellow-500" className="w-full" />
                  <Button label="Excluir" onClick={() => setDeleting(olympiad)} color="bg-red-600" className="w-full" />
                </div>
              </article>
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-lg border border-gray-200 md:block">
            <table className="w-full border-collapse bg-white">
              <thead className="bg-gray-100 text-left text-sm text-gray-600">
                <tr><th className="px-4 py-3 font-semibold">Nome</th><th className="px-4 py-3 font-semibold">Ações</th></tr>
              </thead>
              <tbody>
                {filteredOlympiads.map((olympiad) => (
                  <tr key={olympiad.id} className="border-t border-gray-200">
                    <td className="px-4 py-3 text-sm text-gray-800">{olympiad.nome}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button label="Editar" onClick={() => openEdit(olympiad)} color="bg-yellow-500" />
                        <Button label="Excluir" onClick={() => setDeleting(olympiad)} color="bg-red-600" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredOlympiads.length === 0 && (
            <p className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-600">
              Nenhuma olimpíada encontrada.
            </p>
          )}
        </>
      )}

      <Modal
        title={editing?.id ? "Editar olimpíada" : "Adicionar olimpíada"}
        isOpen={Boolean(editing)}
        onClose={() => setEditing(null)}
        onSave={save}
      >
        <label htmlFor="olympiad-name" className="block text-sm font-medium text-gray-700">Nome</label>
        <input
          id="olympiad-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={150}
          disabled={isSaving}
          className="mt-2 min-h-11 w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          autoFocus
        />
      </Modal>

      <Modal title="Excluir olimpíada" isOpen={Boolean(deleting)} onClose={() => setDeleting(null)} onSave={remove}>
        <p className="text-sm text-gray-700">
          Confirma a exclusão de <strong>{deleting?.nome}</strong>? Olimpíadas já usadas em pontuações não podem ser excluídas.
        </p>
      </Modal>
    </main>
  );
}
