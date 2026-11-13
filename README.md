# Com Amor, IF - Frontend

Interface web do sistema **Com Amor, IF**, voltado ao acompanhamento de
pontuações de turmas por sensos. O projeto permite registrar, validar,
acompanhar e consultar pontuações, com regras disponíveis conforme o perfil do
usuário.

## Versão 1.0.0

Esta versão consolida o catálogo de regras, o lançamento de pontuações e a
consulta de resultados. Entre os destaques estão:

- seleção pesquisável de regras, organizada por categoria;
- navegação completa por teclado e suporte a leitores de tela;
- identificação visual de operações de adição, subtração e regras TURBO;
- formulário responsivo para lançamentos por turma ou turno;
- páginas de relatórios, validação, turmas, anos letivos e pontuações do
  sistema.

## Tecnologias

- Next.js 15
- React 19
- Tailwind CSS
- Axios
- Jest e Testing Library

## Requisitos

- Node.js 22 ou compatível com o projeto
- npm
- API do backend em execução

## Configuração

Crie um arquivo `.env` na raiz do projeto:

```env
NEXT_PUBLIC_REACT_APP_API_URL=http://localhost:8080/api/
```

O endereço deve terminar com `/`, pois as rotas da API são concatenadas a
essa variável.

## Execução local

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Qualidade

```bash
npm test
npm run lint
npm run build
```

## Docker

```bash
docker build -t com-amor-if-frontend .
docker run --rm -p 3000:3000 --env-file .env com-amor-if-frontend
```

## Regras automáticas e auditoria

Integração da [issue #5 do backend](https://github.com/IFRN-Campus-Lajes/com-amor-if-backend/issues/5),
independente da issue #5 deste repositório (sensos e consolidação da Área do Mago).

Administradores acessam a auditoria pelo link abaixo da descrição da Área do
Mago. A página permite consultar execuções e consolidar manualmente os bônus de
limpeza e ordenação por bimestre. As regras automáticas aparecem no catálogo
somente para consulta e não podem ser criadas ou editadas pela interface.

O histórico usa cartões abaixo de 768 px e tabela nas telas maiores. Formulário,
paginação, menu mobile e navegação foram validados em larguras de 320, 375, 390,
768 e 1024 px, sem transbordamento horizontal da página.

O backend correspondente deve disponibilizar `/api/admin/regras-automaticas`.

## Projetos relacionados

- Backend: [IFRN-Campus-Lajes/com-amor-if-backend](https://github.com/IFRN-Campus-Lajes/com-amor-if-backend)
- Documentação do projeto: mantida no Google Docs da equipe.

## Licença

Consulte a organização IFRN-Campus-Lajes para as condições de uso e manutenção
do sistema.
