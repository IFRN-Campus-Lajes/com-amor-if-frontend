import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import Page from "../page";
import { fetchPrivateData, postPrivateData } from "../../../utils/api";
import { useAuth } from "../../../providers/AuthProvider";
import { useOpenSchoolYear } from "../../hooks/useOpenSchoolYear";

jest.mock("../../../utils/api", () => ({ fetchPrivateData: jest.fn(), postPrivateData: jest.fn() }));
jest.mock("../../../providers/AuthProvider", () => ({ useAuth: jest.fn() }));
jest.mock("../../hooks/useOpenSchoolYear", () => ({ useOpenSchoolYear: jest.fn() }));
const pending = "pontuacao/pontosDoAnoCorrenteParaValidar";
const applied = "pontuacao/pontosDoAnoCorrenteAplicados";
const point = (id = 1, overrides = {}) => ({
  contador: id, turma: { id, nome: `Turma ${id}` }, bimestre: 0,
  regra: { descricao: `Regra ${id}` }, descricao: "Avaliação", operacao: "SUM", pontos: 10,
  aplicado: false, anulado: false, createdAt: "2026-11-13T12:00:00Z",
  criadoPor: { username: "Professor" }, ...overrides,
});
const deferred = () => { let resolve, reject; const promise = new Promise((ok, fail) => { resolve = ok; reject = fail; }); return { promise, resolve, reject }; };

beforeEach(() => {
  jest.clearAllMocks();
  useAuth.mockReturnValue({ user: { username: "Admin" }, getToken: () => "token", isLoading: false, isLoggingOut: false });
  useOpenSchoolYear.mockReturnValue({ hasOpenSchoolYear: true, isLoading: false, error: null });
  fetchPrivateData.mockResolvedValue([point()]);
  postPrivateData.mockResolvedValue({});
});

async function loaded() { await screen.findByText("Regra 1"); }

test("carrega cada aba uma vez e preserva as ações de cada estado", async () => {
  fetchPrivateData.mockImplementation(path => Promise.resolve([point(1, {
    aplicado: path === applied, anulado: path.endsWith("Anulados"),
  })]));
  render(<Page />); await loaded();
  expect(fetchPrivateData).toHaveBeenCalledTimes(1);
  for (const [tab, endpoint, allowed, forbidden] of [
    ["Aplicados", applied, "Anular", "Aplicar"],
    ["Anulados", "pontuacao/pontosDoAnoCorrenteAnulados", "Aplicar", "Anular"],
    ["Todos os Pontos", "pontuacao/pontosDoAnoCorrente", null, "Anular"],
  ]) {
    fireEvent.click(screen.getByRole("button", { name: tab, exact: true }));
    await loaded();
    expect(fetchPrivateData).toHaveBeenLastCalledWith(endpoint, "token");
    if (allowed) expect(screen.getByRole("button", { name: allowed, exact: true })).toBeEnabled();
    expect(screen.queryByRole("button", { name: forbidden, exact: true })).not.toBeInTheDocument();
  }
  expect(fetchPrivateData).toHaveBeenCalledTimes(4);
  fireEvent.click(screen.getByRole("button", { name: "Todos os Pontos", exact: true }));
  expect(fetchPrivateData).toHaveBeenCalledTimes(4);
});

test.each([
  ["Aplicar", "manager/aprovar", "Pontuação aplicada com sucesso"],
  ["Anular", "manager/cancelar", "Pontuação anulada com sucesso"],
  ["Deletar", "pontuacao/deletarPontuacao", "Pontuação deletada com sucesso"],
])("%s compartilha envio e faz só uma atualização após sucesso", async (label, endpoint, success) => {
  render(<Page />); await loaded();
  fireEvent.click(screen.getByRole("button", { name: label, exact: true }));
  if (label === "Deletar") {
    expect(postPrivateData).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));
  }
  await screen.findByText(success);
  expect(postPrivateData).toHaveBeenCalledTimes(1);
  expect(postPrivateData).toHaveBeenCalledWith(endpoint, { id_turma: 1, contador: 1 }, "token");
  await waitFor(() => expect(fetchPrivateData).toHaveBeenCalledTimes(2));
  expect(fetchPrivateData).toHaveBeenLastCalledWith(pending, "token");
  expect(screen.queryByRole("button", { name: "Confirmar" })).not.toBeInTheDocument();
});

test("cancelar exclusão não faz requisição", async () => {
  render(<Page />); await loaded();
  fireEvent.click(screen.getByRole("button", { name: "Deletar" }));
  fireEvent.click(screen.getByRole("button", { name: "Cancelar", exact: true }));
  expect(postPrivateData).not.toHaveBeenCalled();
  expect(fetchPrivateData).toHaveBeenCalledTimes(1);
});

test.each(["Aplicar", "Anular", "Deletar"])("falha ao %s mantém dados e não faz refetch", async label => {
  postPrivateData.mockRejectedValue(new Error("Sem conexão"));
  render(<Page />); await loaded();
  fireEvent.click(screen.getByRole("button", { name: label, exact: true }));
  if (label === "Deletar") fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));
  await screen.findByText(/Sem conexão/);
  expect(screen.getByText("Regra 1")).toBeInTheDocument();
  expect(fetchPrivateData).toHaveBeenCalledTimes(1);
  if (label === "Deletar") expect(screen.getByRole("button", { name: "Confirmar" })).toBeEnabled();
});

test("lote usa todos os pendentes e um representante por lançamento coletivo", async () => {
  const points = Array.from({ length: 11 }, (_, index) => point(index + 1));
  points.push(point(12, { grupoLancamentoId: "grupo" }), point(13, { grupoLancamentoId: "grupo" }));
  fetchPrivateData.mockResolvedValue(points);
  render(<Page />); await loaded();
  fireEvent.change(screen.getByPlaceholderText("Buscar pelo nome da turma..."), { target: { value: "Turma 1" } });
  fireEvent.click(screen.getByRole("button", { name: "Aplicar todos os pontos pendentes" }));
  await screen.findByText("Pontuações aplicadas com sucesso");
  expect(postPrivateData).toHaveBeenCalledWith("manager/aprovarTodas",
    Array.from({ length: 12 }, (_, index) => ({ id_turma: index + 1, contador: index + 1 })), "token");
  expect(fetchPrivateData).toHaveBeenCalledTimes(2);
});

test("lote com erro preserva a listagem e exibe o erro da API", async () => {
  postPrivateData.mockRejectedValue({ response: { data: { errors: ["Ano fechado"] } } });
  render(<Page />); await loaded();
  fireEvent.click(screen.getByRole("button", { name: "Aplicar todos os pontos pendentes" }));
  await screen.findByText("Erro ao aplicar pontuação: Ano fechado");
  expect(fetchPrivateData).toHaveBeenCalledTimes(1);
});

test("duplo clique enquanto salva não duplica mutação ou atualização", async () => {
  const save = deferred(); postPrivateData.mockReturnValue(save.promise);
  render(<Page />); await loaded();
  const apply = screen.getByRole("button", { name: "Aplicar", exact: true });
  fireEvent.click(apply); fireEvent.click(apply);
  expect(apply).toBeDisabled(); expect(postPrivateData).toHaveBeenCalledTimes(1);
  await act(async () => save.resolve({}));
  await screen.findByText("Pontuação aplicada com sucesso");
  expect(fetchPrivateData).toHaveBeenCalledTimes(2);
});

test("resposta antiga de outra aba não substitui os dados atuais", async () => {
  const old = deferred(), recent = deferred();
  fetchPrivateData.mockImplementation(path => path === pending ? old.promise : recent.promise);
  render(<Page />);
  expect(screen.getByRole("status")).toHaveTextContent("Carregando pontuações");
  fireEvent.click(screen.getByRole("button", { name: "Aplicados", exact: true }));
  await act(async () => recent.resolve([point(2, { aplicado: true })]));
  expect(screen.getByText("Regra 2")).toBeInTheDocument();
  await act(async () => old.resolve([point()]));
  expect(screen.queryByText("Regra 1")).not.toBeInTheDocument();
  expect(screen.getByText("Regra 2")).toBeInTheDocument();
});

test("mutação concluída após troca de aba atualiza somente a aba atual", async () => {
  const save = deferred(); postPrivateData.mockReturnValue(save.promise);
  render(<Page />); await loaded();
  fireEvent.click(screen.getByRole("button", { name: "Aplicar", exact: true }));
  fireEvent.click(screen.getByRole("button", { name: "Aplicados", exact: true }));
  await waitFor(() => expect(fetchPrivateData).toHaveBeenCalledTimes(2));
  await act(async () => save.resolve({}));
  await waitFor(() => expect(fetchPrivateData).toHaveBeenCalledTimes(3));
  expect(fetchPrivateData).toHaveBeenLastCalledWith(applied, "token");
  expect(fetchPrivateData.mock.calls.filter(([path]) => path === pending)).toHaveLength(1);
});

test("a atualização após excluir a última linha retorna a uma página válida", async () => {
  fetchPrivateData.mockResolvedValueOnce(Array.from({ length: 11 }, (_, index) => point(index + 1)))
    .mockResolvedValueOnce(Array.from({ length: 10 }, (_, index) => point(index + 1)));
  render(<Page />); await loaded();
  fireEvent.click(screen.getByRole("button", { name: "Próxima" }));
  expect(screen.getByText("Regra 11")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Deletar" }));
  fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));
  await screen.findByText("Pontuação deletada com sucesso");
  await screen.findByText("Página 1 de 1");
  expect(screen.getByText("Regra 1")).toBeInTheDocument();
});

test("listagem vazia desabilita aplicar todos", async () => {
  fetchPrivateData.mockResolvedValue([]); render(<Page />);
  await waitFor(() => expect(screen.queryByText("Carregando pontuações…")).not.toBeInTheDocument());
  expect(screen.getByText("Nenhum dado")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Aplicar todos os pontos pendentes" })).toBeDisabled();
});

test("falha de carregamento sem resposta HTTP é exibida", async () => {
  fetchPrivateData.mockRejectedValue(new Error("Rede indisponível")); render(<Page />);
  await screen.findByText("Erro ao carregar dados: Rede indisponível");
  expect(screen.getByRole("button", { name: "Aplicar todos os pontos pendentes" })).toBeDisabled();
});

test("sem ano aberto não consulta pontos nem permite alterações", () => {
  useOpenSchoolYear.mockReturnValue({ hasOpenSchoolYear: false, isLoading: false, error: null });
  render(<Page />);
  expect(fetchPrivateData).not.toHaveBeenCalled();
  expect(screen.getByRole("status")).toHaveTextContent("Não há ano letivo aberto");
  expect(screen.queryByRole("button", { name: "Aplicar todos os pontos pendentes" })).not.toBeInTheDocument();
});

test("sem usuário não consulta pontos", () => {
  useAuth.mockReturnValue({ user: null, getToken: () => undefined, isLoading: false });
  render(<Page />); expect(fetchPrivateData).not.toHaveBeenCalled();
});

test.each([
  ["Aplicar", "Lançamento coletivo aplicado a todas as turmas"],
  ["Anular", "Lançamento coletivo anulado em todas as turmas"],
  ["Deletar", "Lançamento coletivo deletado de todas as turmas"],
])("%s preserva o fluxo coletivo usando um representante", async (label, message) => {
  fetchPrivateData.mockResolvedValue([point(1, { grupoLancamentoId: "grupo" }), point(2, { grupoLancamentoId: "grupo" })]);
  render(<Page />); await loaded();
  expect(screen.getAllByRole("button", { name: label, exact: true })).toHaveLength(1);
  fireEvent.click(screen.getByRole("button", { name: label, exact: true }));
  if (label === "Deletar") {
    expect(screen.getByText(/deletado das 2 turmas/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));
  }
  await screen.findByText(message);
  expect(postPrivateData.mock.calls[0][1]).toEqual({ contador: 1, id_turma: 1 });
});

test.each([
  ["Aplicados", "Anular", "manager/cancelar", applied],
  ["Anulados", "Aplicar", "manager/aprovar", "pontuacao/pontosDoAnoCorrenteAnulados"],
])("ação na aba %s atualiza a mesma listagem", async (tab, action, endpoint, listEndpoint) => {
  render(<Page />); await loaded();
  fireEvent.click(screen.getByRole("button", { name: tab, exact: true })); await loaded();
  fireEvent.click(screen.getByRole("button", { name: action, exact: true }));
  await waitFor(() => expect(fetchPrivateData).toHaveBeenCalledTimes(3));
  expect(postPrivateData).toHaveBeenCalledWith(endpoint, { contador: 1, id_turma: 1 }, "token");
  expect(fetchPrivateData).toHaveBeenLastCalledWith(listEndpoint, "token");
});
