import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Page from "../automatic-rules/page";
import { fetchPrivateData, postPrivateData } from "../../../utils/api";
import { isFromCategory } from "../../../utils/role";
jest.mock("../../../utils/api", () => ({ fetchPrivateData: jest.fn(), postPrivateData: jest.fn() }));
jest.mock("../../../utils/role", () => ({ isFromCategory: jest.fn() }));
jest.mock("../../../providers/AuthProvider", () => ({ useAuth: () => ({ user: {}, getToken: () => "token", isLoading: false }) }));
beforeEach(() => {
 jest.clearAllMocks(); isFromCategory.mockReturnValue(true);
 fetchPrivateData.mockResolvedValue({ content: [{ id: "audit-1", origem: "ADMINISTRATIVA", solicitante: "admin", status: "FALHA", criados: 0, existentes: 0, inelegiveis: 0, erro: "Falha registrada" }], totalPages: 1 });
 postPrivateData.mockResolvedValue({ status: "SUCESSO", criados: 1 });
});
test("exibe auditoria e reprocessa apenas o bimestre selecionado", async () => {
 render(<Page />); await screen.findAllByText("Falha registrada");
 fireEvent.change(screen.getByRole("combobox"), { target: { value: "2" } });
 fireEvent.click(screen.getByRole("button", { name: "Reprocessar" }));
 await waitFor(() => expect(postPrivateData).toHaveBeenCalledWith("admin/regras-automaticas/reprocessar", { bimestre: 2 }, "token"));
 await screen.findByRole("status"); expect(fetchPrivateData).toHaveBeenCalledTimes(2);
});
test("não consulta auditoria para usuário sem perfil administrativo", () => {
 isFromCategory.mockReturnValue(false); render(<Page />);
 expect(fetchPrivateData).not.toHaveBeenCalled(); expect(screen.queryByRole("button", { name: "Reprocessar" })).not.toBeInTheDocument();
});
