import { act, renderHook, waitFor } from "@testing-library/react";
import { useValidationPoints } from "../useValidationPoints";
import { fetchPrivateData, postPrivateData } from "../../../utils/api";

jest.mock("../../../utils/api", () => ({ fetchPrivateData: jest.fn(), postPrivateData: jest.fn() }));
const deferred = () => { let resolve; const promise = new Promise(ok => { resolve = ok; }); return { promise, resolve }; };
const initial = { endpoint: "pendentes", token: "token", enabled: true };
const action = { endpoint: "aplicar", data: { contador: 1 }, success: "Aplicada", errorPrefix: "Falha ao aplicar" };
beforeEach(() => { jest.clearAllMocks(); fetchPrivateData.mockResolvedValue([]); postPrivateData.mockResolvedValue({}); });

test("duas chamadas síncronas compartilham a trava de mutação", async () => {
  const save = deferred(); postPrivateData.mockReturnValue(save.promise);
  const { result } = renderHook(() => useValidationPoints(initial));
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  let first, second;
  act(() => { first = result.current.mutate(action); second = result.current.mutate(action); });
  expect(postPrivateData).toHaveBeenCalledTimes(1);
  await expect(second).resolves.toBe(false);
  await act(async () => { save.resolve({}); await first; });
  expect(fetchPrivateData).toHaveBeenCalledTimes(2);
});

test("troca de token descarta a listagem antiga", async () => {
  const old = deferred(), recent = deferred();
  fetchPrivateData.mockImplementation((_, token) => token === "token" ? old.promise : recent.promise);
  const { result, rerender } = renderHook(props => useValidationPoints(props), { initialProps: initial });
  rerender({ ...initial, token: "outro-token" });
  await act(async () => recent.resolve([{ contador: 2 }]));
  await act(async () => old.resolve([{ contador: 1 }]));
  expect(result.current.points).toEqual([{ contador: 2 }]);
});

test("troca de usuário durante POST não exibe mensagem nem refaz consulta da sessão antiga", async () => {
  const save = deferred(); postPrivateData.mockReturnValue(save.promise);
  const { result, rerender } = renderHook(props => useValidationPoints(props), { initialProps: initial });
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  let mutation;
  act(() => { mutation = result.current.mutate(action); });
  rerender({ ...initial, token: "outro-token" });
  await waitFor(() => expect(fetchPrivateData).toHaveBeenCalledTimes(2));
  await act(async () => { save.resolve({}); await mutation; });
  expect(result.current.messages.success).toBeUndefined();
  expect(fetchPrivateData).toHaveBeenCalledTimes(2);
});

test("sem ano aberto não envia alterações", async () => {
  const { result } = renderHook(() => useValidationPoints({ ...initial, enabled: false }));
  await act(async () => expect(await result.current.mutate(action)).toBe(false));
  expect(postPrivateData).not.toHaveBeenCalled(); expect(fetchPrivateData).not.toHaveBeenCalled();
});

test("sem token informa o erro e não faz requisições", async () => {
  const { result } = renderHook(() => useValidationPoints({ ...initial, token: undefined }));
  await act(async () => expect(await result.current.mutate(action)).toBe(false));
  expect(result.current.messages.error).toBe("Token de autenticação não encontrado");
  expect(postPrivateData).not.toHaveBeenCalled(); expect(fetchPrivateData).not.toHaveBeenCalled();
});

test("erro na atualização não transforma alteração salva em falha nem repete o POST", async () => {
  fetchPrivateData.mockResolvedValueOnce([]).mockRejectedValueOnce(new Error("Rede indisponível"));
  const { result } = renderHook(() => useValidationPoints(initial));
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  await act(async () => expect(await result.current.mutate(action)).toBe(true));
  expect(result.current.messages).toEqual({ success: "Aplicada", error: "Erro ao carregar dados: Rede indisponível" });
  expect(postPrivateData).toHaveBeenCalledTimes(1);
  expect(fetchPrivateData).toHaveBeenCalledTimes(2);
});
