"use client";

import { useState } from "react";
import Tab from "../components/Tab";
import Table from "../components/Table";
import MessageBox from "../components/MessageBox";
import NotAuthorized from "../components/NotAuthorized";
import LoadingSpinner from "../components/LoadingSpinner";
import Modal from "../components/Modal";
import PointSchoolClassCell from "../components/PointSchoolClassCell";
import { useValidationPoints } from "./useValidationPoints";
import { useAuth } from "../../providers/AuthProvider";
import { format } from "date-fns";
import NoOpenSchoolYearNotice from "../components/NoOpenSchoolYearNotice";
import { useOpenSchoolYear } from "../hooks/useOpenSchoolYear";
import {
  formatPointMotivation,
  getPointSchoolClassNames,
  groupCollectivePoints,
} from "../../utils/point";

const tabs = [
  {
    label: "Pendentes",
    endpoint: "pontuacao/pontosDoAnoCorrenteParaValidar",
  },
  {
    label: "Aplicados",
    endpoint: "pontuacao/pontosDoAnoCorrenteAplicados",
  },
  {
    label: "Anulados",
    endpoint: "pontuacao/pontosDoAnoCorrenteAnulados",
  },
  { label: "Todos os Pontos", endpoint: "pontuacao/pontosDoAnoCorrente" },
];

const TABS_COLORS = {
  Pendentes: "#18a08c",
  Aplicados: "#49c8aa",
  "Todos os Pontos": "#ffbb03",
  Anulados: "#ff8486",
};

const itemsPerPage = 10;

const PointsValidationPage = () => {
  const { user, isLoading, getToken, isLoggingOut } = useAuth();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingPoint, setDeletingPoint] = useState(null);
  const [activeTab, setActiveTab] = useState(tabs[0].label);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const token = getToken();
  const {
    hasOpenSchoolYear,
    isLoading: isSchoolYearLoading,
    error: schoolYearError,
  } = useOpenSchoolYear(token, Boolean(user));

  const endpoint = tabs.find(tab => tab.label === activeTab).endpoint;
  const { points: pointsData, isLoading: isPointsLoading, isMutating,
    messages, dismissMessage, mutate } = useValidationPoints({
      endpoint, token, enabled: Boolean(user) && hasOpenSchoolYear && !isLoggingOut,
    });

  const groupedPoints = groupCollectivePoints(pointsData);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handleDelete = (pontuacao) => {
    setDeletingPoint(pontuacao);
    setDeleteModalOpen(true);
  };

  const pointIdentity = point => ({
    id_turma: point.id_turma ?? point.turma?.id ?? point.idTurma,
    contador: point.contador,
  });

  const changePoint = async (action, point) => {
    const options = {
      delete: { endpoint: "pontuacao/deletarPontuacao", errorPrefix: "Erro ao deletar pontuação",
        success: point.collective ? "Lançamento coletivo deletado de todas as turmas" : "Pontuação deletada com sucesso" },
      apply: { endpoint: "manager/aprovar", errorPrefix: "Erro ao aplicar pontuação",
        success: point.collective ? "Lançamento coletivo aplicado a todas as turmas" : "Pontuação aplicada com sucesso" },
      annul: { endpoint: "manager/cancelar", errorPrefix: "Erro ao anular pontuação",
        success: point.collective ? "Lançamento coletivo anulado em todas as turmas" : "Pontuação anulada com sucesso" },
    };
    const changed = await mutate({ ...options[action], data: pointIdentity(point) });
    if (changed && action === "delete") {
      setDeleteModalOpen(false);
      setDeletingPoint(null);
    }
  };
  const deletePoints = () => changePoint("delete", deletingPoint);
  const handleApply = point => changePoint("apply", point);
  const handleAnnul = point => changePoint("annul", point);
  const handleApplyAll = () => mutate({
    endpoint: "manager/aprovarTodas", data: groupedPoints.map(pointIdentity),
    success: "Pontuações aplicadas com sucesso", errorPrefix: "Erro ao aplicar pontuação",
  });

  const onPageChange = (page) => {
    setCurrentPage(page);
  };

  const filteredPoints = groupedPoints.filter((point) =>
    getPointSchoolClassNames(point).some((name) =>
      name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  if (isLoading || isLoggingOut || isSchoolYearLoading)
    return <LoadingSpinner />;
  if (!user) return <NotAuthorized />;

  // Função para definir as ações conforme a aba ativa
  const getActions = (tab) => {
    if (!hasOpenSchoolYear) return [];

    switch (tab) {
      case "Pendentes":
        return [
          { label: "Deletar", color: "bg-red-500", onClick: handleDelete, disabled: isMutating || isPointsLoading },
          { label: "Aplicar", color: "bg-green-500", onClick: handleApply, disabled: isMutating || isPointsLoading },
          { label: "Anular", color: "bg-yellow-500", onClick: handleAnnul, disabled: isMutating || isPointsLoading },
        ];
      case "Aplicados":
        return [
          { label: "Anular", color: "bg-yellow-500", onClick: handleAnnul, disabled: isMutating || isPointsLoading },
        ];
      case "Anulados":
        return [
          { label: "Aplicar", color: "bg-green-500", onClick: handleApply, disabled: isMutating || isPointsLoading },
        ];
      default:
        return [];
    }
  };

  const totalPages = Math.max(1, Math.ceil(filteredPoints.length / itemsPerPage));
  const visiblePage = Math.min(currentPage, totalPages);

  return (
    <div className="container mx-auto p-4">
      {messages.error && (
        <MessageBox
          message={messages.error}
          color="detail-minor"
          onClose={() => dismissMessage("error")}
        />
      )}
      {messages.success && (
        <MessageBox
          message={messages.success}
          color="lime-400"
          onClose={() => dismissMessage("success")}
        />
      )}

      <h1 className="text-2xl font-bold mb-4">Validação de Pontuações</h1>

      {schoolYearError && (
        <MessageBox message={schoolYearError} color="detail-minor" />
      )}

      {!schoolYearError && !hasOpenSchoolYear && (
        <NoOpenSchoolYearNotice />
      )}

      {/* Componente de Abas */}
      <div className="overflow-x-auto flex flex-nowrap gap-2 border-b border-gray-300 mb-4">
        <Tab
          tabs={tabs.map((tab) => tab.label)}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          tabColors={TABS_COLORS}
        />
      </div>

      <br></br>

      {hasOpenSchoolYear && activeTab === "Pendentes" && (
        <>
          <button
            key="aplicarTudo"
            className="px-4 py-2 m-1 mb-6 text-md font-medium rounded bg-green-500 disabled:opacity-50"
            onClick={handleApplyAll}
            disabled={isMutating || isPointsLoading || !groupedPoints.length}
          >
            Aplicar todos os pontos pendentes
          </button>
        </>
      )}

      {isPointsLoading && <p role="status" className="mb-4 text-sm text-gray-600">Carregando pontuações…</p>}

      {/* Tabela com Paginação e Ações Dinâmicas */}
      <Table
        searchText="Buscar pelo nome da turma..."
        headers={[
          "Nome da Turma",
          "Bimestre",
          "Regra",
          "Motivacao",
          "Operacao",
          "Pontos",
          "Status",
          "Registrado Em",
          "Registrado Por",
        ]}
        data={filteredPoints
          .slice((visiblePage - 1) * itemsPerPage, visiblePage * itemsPerPage)
          .map((pontuacao) => ({
            nome_da_turma: <PointSchoolClassCell point={pontuacao} />,
            bimestre:
              pontuacao.bimestre === 4 ? "Extra" : pontuacao.bimestre + 1,
            contador: pontuacao.contador,
            id_turma: pontuacao.turma.id,
            regra: pontuacao.regra.descricao,
            motivacao: formatPointMotivation(pontuacao),
            operacao: pontuacao.operacao === "SUM" ? "Adição" : "Subtração",
            pontos: pontuacao.pontos,
            status: pontuacao.aplicado
              ? "Aplicado"
              : pontuacao.anulado
              ? "Anulado"
              : "Pendente",
            registrado_em: format(
              new Date(pontuacao.createdAt),
              "dd/MM/yyyy HH:mm:ss"
            ),
            registrado_por: pontuacao.criadoPor.username,
            collective: pontuacao.collective,
            schoolClasses: pontuacao.schoolClasses,
          }))}
        actions={getActions(activeTab)}
        page={visiblePage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        searchValue={searchTerm}
        onSearch={(value) => {
          setCurrentPage(1);
          setSearchTerm(value);
        }}
      />

      <Modal
        title={"Deletar Pontuação"}
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onSave={deletePoints}
        isSaving={isMutating}
      >
        <p>
          {deletingPoint?.collective
            ? `Este lançamento coletivo será deletado das ${deletingPoint.schoolClasses.length} turmas. Deseja continuar?`
            : "Tem certeza que deseja deletar essa pontuação?"}
        </p>
      </Modal>
    </div>
  );
};

export default PointsValidationPage;
