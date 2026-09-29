"use client";

import { useState, useEffect } from "react";
import Tab from "../components/Tab";
import Table from "../components/Table";
import MessageBox from "../components/MessageBox";
import NotAuthorized from "../components/NotAuthorized";
import LoadingSpinner from "../components/LoadingSpinner";
import Modal from "../components/Modal";
import { fetchPrivateData, postPrivateData } from "../../utils/api";
import { useAuth } from "../../providers/AuthProvider";
import { format } from "date-fns";
import NoOpenSchoolYearNotice from "../components/NoOpenSchoolYearNotice";
import { useOpenSchoolYear } from "../hooks/useOpenSchoolYear";
import { formatPointMotivation } from "../../utils/point";

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
  const [messages, setMessages] = useState({ error: null, success: null });
  const [pointsData, setPointsData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const token = getToken();
  const {
    hasOpenSchoolYear,
    isLoading: isSchoolYearLoading,
    error: schoolYearError,
  } = useOpenSchoolYear(token, Boolean(user));

  const fetchPoints = async (endpoint) => {
    try {
      if (user) {
        const data = await fetchPrivateData(endpoint, token);
        setPointsData(data);
      }
    } catch (error) {
      setMessages({
        error: "Erro ao carregar dados: " + error?.response?.data?.errors[0],
      });
    }
  };

  useEffect(() => {
    if (user && hasOpenSchoolYear) {
      const defaultTab = tabs.find((tab) => tab.label === activeTab);
      if (defaultTab) fetchPoints(defaultTab.endpoint);
    } else if (!hasOpenSchoolYear) {
      setPointsData([]);
    }
  }, [activeTab, token, user, hasOpenSchoolYear]);

  if (isLoading || isLoggingOut || isSchoolYearLoading)
    return <LoadingSpinner />;
  if (!user) return <NotAuthorized />;

  // Função para definir as ações conforme a aba ativa
  const getActions = (tab) => {
    if (!hasOpenSchoolYear) return [];

    switch (tab) {
      case "Pendentes":
        return [
          { label: "Deletar", color: "bg-red-500", onClick: handleDelete },
          { label: "Aplicar", color: "bg-green-500", onClick: handleApply },
          { label: "Anular", color: "bg-yellow-500", onClick: handleAnnul },
        ];
      case "Aplicados":
        return [
          { label: "Anular", color: "bg-yellow-500", onClick: handleAnnul },
        ];
      case "Anulados":
        return [
          { label: "Aplicar", color: "bg-green-500", onClick: handleApply },
        ];
      default:
        return [];
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handleDelete = (pontuacao) => {
    setDeletingPoint(pontuacao);
    setDeleteModalOpen(true);
  };

  const deletePoints = async () => {
    if (!token)
      return setMessages({ error: "Token de autenticação não encontrado" });

    const dataToSend = {
      id_turma: deletingPoint.id_turma,
      contador: deletingPoint.contador,
    };

    try {
      await postPrivateData("pontuacao/deletarPontuacao", dataToSend, token);
      setMessages({ success: "Pontuação deletada com sucesso" });

      fetchPoints(tabs.find((tab) => tab.label === activeTab).endpoint);
      setDeleteModalOpen(false);
      setDeletingPoint(null);
    } catch (error) {
      setMessages({
        error: "Erro ao deletar pontuacao: " + error?.response?.data?.errors[0],
      });
    }
  };

  const handleApplyAll = async () => {
    if (!token)
      return setMessages({ error: "Token de autenticação não encontrado" });

    const dataToSend = pointsData.map((point) => ({
      contador: point.contador,
      id_turma: point.idTurma,
    }));

    try {
      await postPrivateData("manager/aprovarTodas", dataToSend, token);
      setMessages({ success: "Pontuações aplicadas com sucesso" });

      //console.log(tabs.find((tab) => tab.label === activeTab).endpoint);

      fetchPoints(tabs.find((tab) => tab.label === activeTab).endpoint);
      setDeleteModalOpen(false);
      setDeletingPoint(null);
    } catch (error) {
      setMessages({
        error: "Erro ao aplicar pontuacao: " + error?.response?.data?.errors[0],
      });
    }
  };

  const handleApply = async (point) => {
    if (!token)
      return setMessages({ error: "Token de autenticação não encontrado" });

    const dataToSend = {
      id_turma: point.id_turma,
      contador: point.contador,
    };

    try {
      await postPrivateData("manager/aprovar", dataToSend, token);
      setMessages({ success: "Pontuação aplicada com sucesso" });

      //console.log(tabs.find((tab) => tab.label === activeTab).endpoint);

      fetchPoints(tabs.find((tab) => tab.label === activeTab).endpoint);
      setDeleteModalOpen(false);
      setDeletingPoint(null);
    } catch (error) {
      setMessages({
        error: "Erro ao aplicar pontuacao: " + error?.response?.data?.errors[0],
      });
    }
  };

  const handleAnnul = async (point) => {
    if (!token)
      return setMessages({ error: "Token de autenticação não encontrado" });

    const dataToSend = {
      id_turma: point.id_turma,
      contador: point.contador,
    };

    try {
      await postPrivateData("manager/cancelar", dataToSend, token);
      setMessages({ success: "Pontuação anulada com sucesso" });

      fetchPoints(tabs.find((tab) => tab.label === activeTab).endpoint);
      setDeleteModalOpen(false);
      setDeletingPoint(null);
    } catch (error) {
      setMessages({
        error: "Erro ao anular pontuacao: " + error?.response?.data?.errors[0],
      });
    }
  };

  const onPageChange = (page) => {
    setCurrentPage(page);
  };

  const filteredPoints = pointsData.filter((p) =>
    p.turma.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-4">
      {messages.error && (
        <MessageBox
          message={messages.error}
          color="detail-minor"
          onClose={() => setMessages({ ...messages, error: null })}
        />
      )}
      {messages.success && (
        <MessageBox
          message={messages.success}
          color="lime-400"
          onClose={() => setMessages({ ...messages, success: null })}
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
            className={`px-4 py-2 m-1 mb-6 text-md font-medium rounded bg-green-500`}
            onClick={handleApplyAll}
          >
            Aplicar todos os pontos pendentes
          </button>
        </>
      )}

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
          .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
          .map((pontuacao) => ({
            nome_da_turma: pontuacao.turma.nome,
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
          }))}
        actions={getActions(activeTab)}
        page={currentPage}
        totalPages={
          Math.ceil(filteredPoints.length / itemsPerPage) > 1
            ? Math.ceil(filteredPoints.length / itemsPerPage)
            : 1
        }
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
      >
        <p>Tem certeza que deseja deletar essa pontuação?</p>
      </Modal>
    </div>
  );
};

export default PointsValidationPage;
