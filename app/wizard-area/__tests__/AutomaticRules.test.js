import { render, screen, within, fireEvent } from "@testing-library/react";
import WizardAreaPage from "../page";
import { fetchPrivateData } from "../../../utils/api";

jest.mock("../../../utils/api", () => ({ fetchPrivateData: jest.fn(), postPrivateData: jest.fn(), putPrivateData: jest.fn(), patchPrivateData: jest.fn(), deletePrivateData: jest.fn() }));
jest.mock("../../../providers/AuthProvider", () => {
  const user = { roles: ["ROLE_ADMINISTRADOR"] };
  const getToken = () => "test-token";
  return { useAuth: () => ({ user, getToken, isLoading: false }) };
});
jest.mock("../../../utils/role", () => ({ isFromCategory: () => true }));
jest.mock("next/image", () => ({ __esModule: true, default: () => null }));
jest.mock("../AdministrativeEntities", () => ({ ClassesManagement: () => null, SchoolYearsManagement: () => null, SenseManagement: () => null }));

beforeEach(() => {
  const automatic = { id: 1, descricao: "Bônus de limpeza", senso: "Limpeza", sensoId: 1, categoria: "Bônus", automatico: true, ativo: true, fixo: true, valorMinimo: 20, frequencia: 1, versao: 1 };
  const manual = { ...automatic, id: 2, descricao: "Avaliação de limpeza", automatico: false };
  fetchPrivateData.mockImplementation((path) => Promise.resolve(path.endsWith("metadados") ? {
    sensos: [{ id: 1, descricao: "Limpeza", ativo: true }],
    categorias: [{ id: 1, nome: "Bônus", ativo: true, senso: { id: 1 } }],
    roles: [{ id: 1, name: "ROLE_ADMINISTRADOR" }],
    tipos: [{ id: 1, descricao: "Valor Fixo Automático por Bimestre", fixo: true, automatico: true }, { id: 2, descricao: "Valor Fixo", fixo: true, automatico: false }],
  } : [automatic, manual]));
});

test("mantém regra automática visível e sem ações de alteração", async () => {
  render(<WizardAreaPage />);
  const title = await screen.findByText("Bônus de limpeza");
  const article = title.closest("article");
  expect(within(article).getByText("Automática · Somente consulta")).toBeInTheDocument();
  expect(within(article).queryByRole("button", { name: /editar|desativar|ativar/i })).not.toBeInTheDocument();
  expect(within(screen.getByText("Avaliação de limpeza").closest("article")).getByRole("button", { name: "Editar" })).toBeInTheDocument();
});

test("não oferece tipo automático na criação de regra", async () => {
  render(<WizardAreaPage />);
  await screen.findByText("Bônus de limpeza");
  fireEvent.click(screen.getByRole("button", { name: "Nova regra em Limpeza" }));
  expect(screen.queryByRole("option", { name: "Valor Fixo Automático por Bimestre" })).not.toBeInTheDocument();
  expect(screen.getByRole("option", { name: "Valor Fixo" })).toBeInTheDocument();
});
