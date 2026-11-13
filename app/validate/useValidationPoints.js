"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchPrivateData, postPrivateData } from "../../utils/api";

const errorMessage = (error) => error?.response?.data?.errors?.[0]
  || error?.response?.data?.message || error?.message || "Tente novamente.";

export function useValidationPoints({ endpoint, token, enabled }) {
  const [snapshot, setSnapshot] = useState(null);
  const [messages, setMessages] = useState({});
  const [isMutating, setIsMutating] = useState(false);
  const requestId = useRef(0);
  const mutationPending = useRef(false);
  const mounted = useRef(true);
  const scope = useRef(null);
  scope.current = { endpoint, token, enabled };

  const load = useCallback(async () => {
    const current = () => mounted.current && scope.current.token === token
      && scope.current.endpoint === endpoint && scope.current.enabled === enabled;
    if (!current()) return;
    const id = ++requestId.current;
    if (!enabled || !token) {
      setSnapshot(null);
      return;
    }
    setSnapshot({ endpoint, token, points: [], loading: true });
    setMessages(previous => ({ ...previous, error: null }));
    try {
      const points = await fetchPrivateData(endpoint, token);
      if (current() && id === requestId.current) {
        setSnapshot({ endpoint, token, points, loading: false });
      }
    } catch (error) {
      if (current() && id === requestId.current) {
        setSnapshot({ endpoint, token, points: [], loading: false });
        setMessages(previous => ({ ...previous, error: `Erro ao carregar dados: ${errorMessage(error)}` }));
      }
    }
  }, [endpoint, token, enabled]);
  const latestLoad = useRef(load);
  latestLoad.current = load;

  useEffect(() => {
    mounted.current = true;
    load();
    return () => {
      mounted.current = false;
      requestId.current += 1;
    };
  }, [load]);

  const mutate = useCallback(async ({ endpoint: actionEndpoint, data, success, errorPrefix }) => {
    if (!token) {
      setMessages({ error: "Token de autenticação não encontrado" });
      return false;
    }
    if (!scope.current.enabled || mutationPending.current) return false;
    mutationPending.current = true;
    setIsMutating(true);
    setMessages({});
    // Uma listagem iniciada antes da alteração não pode sobrescrever seu resultado.
    requestId.current += 1;
    const current = () => mounted.current && scope.current.token === token && scope.current.enabled;
    try {
      await postPrivateData(actionEndpoint, data, token);
      if (!current()) return false;
      setMessages({ success });
      // Recarrega uma única vez a aba atual, mesmo que ela tenha mudado durante o POST.
      await latestLoad.current();
      return true;
    } catch (error) {
      if (current()) setMessages({ error: `${errorPrefix}: ${errorMessage(error)}` });
      return false;
    } finally {
      mutationPending.current = false;
      if (mounted.current) setIsMutating(false);
    }
  }, [token]);

  const visible = enabled && token && snapshot?.endpoint === endpoint && snapshot?.token === token;
  return {
    points: visible ? snapshot.points : [],
    isLoading: Boolean(enabled && token && (!visible || snapshot.loading)),
    isMutating,
    messages,
    dismissMessage: type => setMessages(previous => ({ ...previous, [type]: null })),
    mutate,
  };
}
