export const formatPointMotivation = (point) => {
  const details = [point?.descricao];

  if (point?.matriculaAluno) {
    details.push(`Aluno: ${point.matriculaAluno}`);
  }

  if (point?.olimpiada?.nome) {
    details.push(`Olimpíada: ${point.olimpiada.nome}`);
  }

  return details.filter(Boolean).join(" | ") || "—";
};

const TURN_NAMES = {
  0: "Matutino",
  1: "Vespertino",
};

const getSchoolClass = (point) => point?.turma || {
  id: point?.idTurma,
  nome: point?.nomeTurma,
};

export const groupCollectivePoints = (points = []) => {
  const grouped = new Map();
  const result = [];

  points.forEach((point) => {
    const groupId = point?.grupoLancamentoId;
    if (!groupId) {
      result.push({
        ...point,
        collective: false,
        groupedPoints: [point],
        schoolClasses: [getSchoolClass(point)].filter((turma) => turma?.nome),
      });
      return;
    }

    const existing = grouped.get(groupId);
    if (existing) {
      existing.groupedPoints.push(point);
      const turma = getSchoolClass(point);
      if (turma?.nome) existing.schoolClasses.push(turma);
      return;
    }

    const collectivePoint = {
      ...point,
      collective: true,
      groupedPoints: [point],
      schoolClasses: [getSchoolClass(point)].filter((turma) => turma?.nome),
    };
    grouped.set(groupId, collectivePoint);
    result.push(collectivePoint);
  });

  return result;
};

export const getPointSchoolClassNames = (point) =>
  (point?.schoolClasses || [getSchoolClass(point)])
    .map((turma) => turma?.nome)
    .filter(Boolean);

export const formatPointSchoolClasses = (point) => {
  const names = getPointSchoolClassNames(point);
  if (!point?.collective) return names[0] || "—";
  const turn = TURN_NAMES[point?.turno] || "Turno não informado";
  return `Coletiva • ${turn}`;
};
