import { formatPointMotivation } from "../point";

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
