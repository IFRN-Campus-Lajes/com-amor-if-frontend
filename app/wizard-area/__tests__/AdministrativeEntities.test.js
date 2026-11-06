import {
  groupClassesBySchoolYear,
  initialExpandedYears,
  sortSchoolYears,
} from "../AdministrativeEntities";

const years = [
  { id: 1, ano_letivo: 2024, status: "Fechado" },
  { id: 3, ano_letivo: 2026, status: "Aberto" },
  { id: 2, ano_letivo: 2025, status: "Fechado" },
];

describe("organização de turmas por ano letivo", () => {
  it("ordena os anos do mais recente para o mais antigo", () => {
    expect(sortSchoolYears(years).map((year) => year.ano_letivo)).toEqual([
      2026, 2025, 2024,
    ]);
  });

  it("abre por padrão somente o ano letivo aberto", () => {
    expect(initialExpandedYears(years)).toEqual({
      1: false,
      2: false,
      3: true,
    });
  });

  it("agrupa e ordena alfabeticamente as turmas dentro de cada ano", () => {
    const classes = [
      { id: 1, nome: "Zeta", anoLetivo: { id: 3 } },
      { id: 2, nome: "Alfa", anoLetivo: { id: 3 } },
      { id: 3, nome: "Beta", anoLetivo: { id: 2 } },
    ];

    const groups = groupClassesBySchoolYear(years, classes);

    expect(groups.map(({ year }) => year.ano_letivo)).toEqual([2026, 2025, 2024]);
    expect(groups[0].classes.map((schoolClass) => schoolClass.nome)).toEqual([
      "Alfa",
      "Zeta",
    ]);
    expect(groups[1].classes.map((schoolClass) => schoolClass.nome)).toEqual([
      "Beta",
    ]);
    expect(groups[2].classes).toEqual([]);
  });
});
