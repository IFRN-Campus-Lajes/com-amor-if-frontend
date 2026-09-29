// Definição do enum em JavaScript
export const Roles = {
  ROLE_ALUNO: "General",
  ROLE_AVAL: "Aval",
  ROLE_SISTEMA: "Admin",
  ROLE_ADMINISTRADOR: "Admin",
  ROLE_BIBLIOTECARIO: "Aval",
  ROLE_APOIO_ACADEMICO: "Aval",
  ROLE_ASSESSORIA_PEDAGOGICA: "Aval",
  ROLE_ASSISTENCIA_ESTUDANTIL: "Aval",
  ROLE_ASSESSORIA_LABORATORIO: "Aval",
  ROLE_COORDENADOR_CURSO: "Aval",
  ROLE_COEXPEIN: "Aval",
  ROLE_DOCENTE: "Aval",
  ROLE_SEAC: "Aval",
};

// Função para verificar acesso com base na role
export const canAccessPage = (role, allowedCategories) => {
  const category = Roles[role];
  return allowedCategories.includes(category);
};

// Função para verificar se o usuário tem alguma role na categoria fornecida
export const isFromCategory = (user, category) => {
  return user.roles.some((role) => Roles[role] === category);
};

export const hasRole = (user, role) => {
  // Adiciona o prefixo 'ROLE_' à role fornecida
  const roleWithPrefix = `ROLE_${role.toUpperCase()}`;

  // Verifica se a role com o prefixo está presente nas roles do usuário
  return user.roles.includes(roleWithPrefix);
};

export const canManageOlympiads = (user) =>
  Boolean(
    user?.roles?.some((role) =>
      ["ROLE_ADMINISTRADOR", "ROLE_COORDENADOR_CURSO"].includes(role)
    )
  );
