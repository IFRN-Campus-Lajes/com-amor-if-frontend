import {
  formatPointMotivation,
  formatPointSchoolClasses,
  formatPointScope,
  groupCollectivePoints,
} from "../point";

describe("formatPointMotivation", () => {
  it("combina a motivação com o aluno e a olimpíada", () => {
    expect(
      formatPointMotivation({
        descricao: "Participação registrada",
        matriculaAluno: "20261234567890",
        olimpiada: { nome: "OBMEP" },
      })
    ).toBe(
      "Participação registrada | Aluno: 20261234567890 | Olimpíada: OBMEP"
    );
  });

  it("preserva a motivação das pontuações sem aluno e olimpíada", () => {
    expect(formatPointMotivation({ descricao: "Sala organizada" })).toBe(
      "Sala organizada"
    );
  });

  it("exibe um marcador quando não há informações", () => {
    expect(formatPointMotivation({})).toBe("—");
  });
});

describe("groupCollectivePoints", () => {
  it("representa um lançamento por turno como uma única pontuação coletiva", () => {
    const points = [
      {
        contador: 1,
        grupoLancamentoId: "grupo-1",
        turno: 0,
        turma: { id: 1, nome: "1º A" },
      },
      {
        contador: 1,
        grupoLancamentoId: "grupo-1",
        turno: 0,
        turma: { id: 2, nome: "1º B" },
      },
    ];

    const grouped = groupCollectivePoints(points);

    expect(grouped).toHaveLength(1);
    expect(grouped[0].collective).toBe(true);
    expect(grouped[0].groupedPoints).toHaveLength(2);
    expect(formatPointSchoolClasses(grouped[0])).toBe("2 turmas: 1º A, 1º B");
    expect(formatPointScope(grouped[0])).toBe("Coletiva • Matutino • 2 turmas");
  });

  it("mantém lançamentos individuais separados", () => {
    const grouped = groupCollectivePoints([
      { contador: 1, turma: { id: 1, nome: "1º A" } },
      { contador: 2, turma: { id: 1, nome: "1º A" } },
    ]);

    expect(grouped).toHaveLength(2);
    expect(grouped.every((point) => !point.collective)).toBe(true);
    expect(formatPointScope(grouped[0])).toBe("Individual");
  });

  it("não mistura dois lançamentos coletivos do mesmo turno", () => {
    const grouped = groupCollectivePoints([
      { grupoLancamentoId: "grupo-1", turno: 1, turma: { nome: "2º A" } },
      { grupoLancamentoId: "grupo-2", turno: 1, turma: { nome: "2º A" } },
    ]);

    expect(grouped).toHaveLength(2);
  });
});
