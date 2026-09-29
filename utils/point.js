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
