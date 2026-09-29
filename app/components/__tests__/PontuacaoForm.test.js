import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PontuacaoForm from "../PontuacaoForm";

const classes = [{ id: "turma-1", nome: "1º Informática" }];

const fixedRule = {
  id: 1,
  descricao: "Pontos fixos por empréstimo",
  categoria: "Biblioteca",
  operacao: "SUM",
  valorMinimo: 5,
  valorMaximo: 5,
  tipoRegra: { fixo: true, porTurno: false, frequencia: 0 },
};

const variableRule = {
  id: 2,
  descricao: "Ocorrência no laboratório",
  categoria: "Laboratório",
  operacao: "SUB",
  valorMinimo: 2,
  valorMaximo: 10,
  tipoRegra: { fixo: false, porTurno: true, frequencia: 1 },
};

const olympiadRule = {
  id: 3,
  descricao: "2 pontos por aluno em cada olimpíada",
  categoria: "Atividades extracurriculares",
  operacao: "SUM",
  valorMinimo: 2,
  valorMaximo: 2,
  tipoRegra: {
    fixo: true,
    porTurno: false,
    frequencia: 0,
    temAluno: true,
    temOlimpiada: true,
  },
};

describe("PontuacaoForm com seletor de regras pesquisável", () => {
  it("mantém os efeitos de uma regra fixa ao selecioná-la pela busca", async () => {
    const user = userEvent.setup();
    render(
      <PontuacaoForm
        regrasDisponiveis={[fixedRule, variableRule]}
        turmasDisponiveis={classes}
        onSubmit={jest.fn()}
        setErrorMessage={jest.fn()}
      />
    );

    const search = screen.getByRole("combobox", { name: /buscar regra/i });
    await user.click(search);
    await user.click(
      screen.getByRole("option", { name: fixedRule.descricao })
    );

    expect(screen.getByText("Operação de adição")).toBeInTheDocument();
    expect(screen.getByText("5 pontos (valor fixo)")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Turma" })).toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: "Turno" })).not.toBeInTheDocument();
  });

  it("continua ajustando os campos condicionais ao trocar para uma regra variável", async () => {
    const user = userEvent.setup();
    render(
      <PontuacaoForm
        regrasDisponiveis={[fixedRule, variableRule]}
        turmasDisponiveis={classes}
        onSubmit={jest.fn()}
        setErrorMessage={jest.fn()}
      />
    );

    const search = screen.getByRole("combobox", { name: /buscar regra/i });
    await user.click(search);
    await user.click(
      screen.getByRole("option", { name: variableRule.descricao })
    );

    expect(screen.getByText("Operação de subtração")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Turno" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Bimestre" })).toBeInTheDocument();
    expect(screen.getByRole("spinbutton", { name: "Pontos" })).toHaveAttribute(
      "min",
      "2"
    );
    expect(screen.getByRole("spinbutton", { name: "Pontos" })).toHaveAttribute(
      "max",
      "10"
    );
  });

  it("envia a regra selecionada pela busca sem alterar o contrato do formulário", async () => {
    const onSubmit = jest.fn();
    const user = userEvent.setup();
    render(
      <PontuacaoForm
        regrasDisponiveis={[fixedRule]}
        turmasDisponiveis={classes}
        onSubmit={onSubmit}
        setErrorMessage={jest.fn()}
      />
    );

    await user.click(screen.getByRole("combobox", { name: /buscar regra/i }));
    await user.click(
      screen.getByRole("option", { name: fixedRule.descricao })
    );
    await user.selectOptions(screen.getByRole("combobox", { name: "Turma" }), "turma-1");
    await user.click(screen.getByRole("button", { name: "Registrar Pontuação" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        idRegra: "1",
        idTurma: "turma-1",
        pontos: 5,
        operacao: "SUM",
      }),
      expect.any(Function),
      expect.any(Function),
      expect.any(Function)
    );
  });

  it("bloqueia todos os campos quando o ano aberto não possui turmas", () => {
    render(
      <PontuacaoForm
        regrasDisponiveis={[fixedRule]}
        turmasDisponiveis={[]}
        onSubmit={jest.fn()}
        disabled
      />
    );

    expect(
      screen.getByRole("combobox", { name: /buscar regra/i })
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Registrar Pontuação" })
    ).toBeDisabled();
  });

  it("exige e envia a olimpíada para regras que identificam a participação", async () => {
    const onSubmit = jest.fn();
    const user = userEvent.setup();
    render(
      <PontuacaoForm
        regrasDisponiveis={[olympiadRule]}
        turmasDisponiveis={classes}
        olimpiadasDisponiveis={[{ id: 9, nome: "OBMEP" }]}
        onSubmit={onSubmit}
      />
    );

    await user.click(screen.getByRole("combobox", { name: /buscar regra/i }));
    await user.click(screen.getByRole("option", { name: olympiadRule.descricao }));
    await user.selectOptions(screen.getByRole("combobox", { name: "Turma" }), "turma-1");
    await user.type(screen.getByRole("textbox", { name: "Matrícula do Aluno" }), "20151204010002");

    const olympiadSelect = screen.getByRole("combobox", { name: "Olimpíada" });
    expect(olympiadSelect).toBeRequired();
    await user.selectOptions(olympiadSelect, "9");
    await user.click(screen.getByRole("button", { name: "Registrar Pontuação" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ idRegra: "3", idOlimpiada: "9" }),
      expect.any(Function),
      expect.any(Function),
      expect.any(Function)
    );
  });
});
