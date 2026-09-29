"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import LoadingSpinner from "../components/LoadingSpinner";
import MessageBox from "../components/MessageBox";
import Table from "../components/Table";
import {
  TurmaBarChart,
  PontuacaoEvolucaoChart,
  RadarSensoChart,
} from "../components/ReportsCharts";
import NoData from "../components/NoData";
import { formatPointMotivation } from "../../utils/point";

const apiUrl = process.env.NEXT_PUBLIC_REACT_APP_API_URL;

const itemsPerPage = 10;

const ReportsPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [pontuacoes, setPontuacoes] = useState([]);
  const [todasPontuacoes, setTodasPontuacoes] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [turmasColors, setTurmasColors] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pontuacaoRes, turmasRes] = await Promise.all([
          fetch(`${apiUrl}pontuacao/pontosDoAnoCorrente`),
          fetch(`${apiUrl}public/pontuacao`),
        ]);

        if (!pontuacaoRes.ok || !turmasRes.ok) {
          setError("Erro ao buscar os dados.");
        } else {
          const pontuacaoData = await pontuacaoRes.json();
          const turmasData = await turmasRes.json();

          setTodasPontuacoes(pontuacaoData);
          setPontuacoes(pontuacaoData.filter((p) => p.aplicado));
          setTurmas(turmasData);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const generateColor = () => {
      while (true) {
        const color = `#${Math.random().toString(16).slice(2, 8)}`;
        const [r, g, b] = color.match(/\w\w/g).map((c) => parseInt(c, 16));
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        if (brightness >= 50 && brightness <= 200) return color;
      }
    };

    setTurmasColors(
      turmas.reduce(
        (acc, { nome }) => ({ ...acc, [nome]: generateColor() }),
        {}
      )
    );
  }, [turmas]);

  if (loading) return <LoadingSpinner />;
  if (
    todasPontuacoes.length === 0 ||
    !todasPontuacoes.some((p) => p.aplicado)
  ) {
    return <NoData />;
  }
  if (error) return <MessageBox message={error} color="detail-minor" />;

  // Cálculo de métricas
  const turmasPontuacao = {};
  const sensoPontuacao = {};
  const sensoContador = {};

  pontuacoes.forEach((p) => {
    const { idTurma, nomeTurma, pontos, regra, operacao, bimestre } = p;
    const senso = regra.senso.descricao;

    if (!turmasPontuacao[idTurma]) {
      turmasPontuacao[idTurma] = { nome: nomeTurma, total: 0, bimestres: {} };
    }

    turmasPontuacao[idTurma].total += operacao === "SUM" ? pontos : -pontos;

    // Utiliza diretamente o bimestre informado na pontuação
    turmasPontuacao[idTurma].bimestres[bimestre] =
      (turmasPontuacao[idTurma].bimestres[bimestre] || 0) +
      (operacao === "SUM" ? pontos : -pontos);

    if (!sensoPontuacao[senso]) sensoPontuacao[senso] = 0;
    if (!sensoContador[senso]) sensoContador[senso] = 0;
    sensoPontuacao[senso] += operacao === "SUM" ? pontos : -pontos;
    sensoContador[senso]++;
  });

  Object.keys(sensoPontuacao).forEach((senso) => {
    sensoPontuacao[senso] = Math.round(
      sensoPontuacao[senso] / sensoContador[senso]
    );
  });

  // Garantir que todas as turmas apareçam no relatório, mesmo sem pontuação
  turmas.forEach((turma) => {
    if (!turmasPontuacao[turma.id]) {
      turmasPontuacao[turma.id] = { nome: turma.nome, total: 0, bimestres: {} };
    }
  });

  // Organizar dados para os gráficos
  const turmasArray = Object.values(turmasPontuacao);
  const sensoArray = Object.entries(sensoPontuacao).map(([senso, total]) => ({
    senso,
    total,
  }));

  const sensoMaisPontuado = sensoArray.sort((a, b) => b.total - a.total)[0];
  const sensoMenosPontuado = sensoArray.sort((a, b) => a.total - b.total)[0];

  const filteredData = todasPontuacoes.filter((p) =>
    p.nomeTurma.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const onPageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Relatório Geral das Turmas</h1>

      {/* Resumo */}
      <div className="mb-4 p-4 border rounded-md bg-gray-100">
        <h2 className="text-lg font-semibold">Resumo</h2>
        <p>
          <strong>Total de Turmas:</strong> {turmas.length}
        </p>
        <p>
          <strong>Senso mais pontuado:</strong> {sensoMaisPontuado.senso} (Média
          de {sensoMaisPontuado.total} pontos)
        </p>
        <p>
          <strong>Senso menos pontuado:</strong> {sensoMenosPontuado.senso}{" "}
          (Média de {sensoMenosPontuado.total} pontos)
        </p>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 gap-4">
        <div className="p-4 border rounded-lg bg-white">
          <TurmaBarChart
            turmasArray={turmasArray}
            title="Pontuação das Turmas"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div className="p-4 border rounded-lg bg-white">
          <PontuacaoEvolucaoChart
            colors={turmasColors}
            turmasArray={turmasArray}
            title="Evolução da Pontuação"
          />
        </div>
        <div className="p-4 border rounded-lg bg-white">
          <RadarSensoChart
            sensoArray={sensoArray}
            title="Desempenho por Senso"
          />
        </div>
      </div>

      {/* Tabela de Pontuações */}
      <h2 className="text-xl font-semibold my-4">Pontuações do Ano Corrente</h2>
      <Table
        searchText="Buscar por nome da turma..."
        headers={[
          "Turma",
          "Bimestre",
          "Senso",
          "Regra",
          "Motivacao",
          "Operacao",
          "Pontos",
          "Status",
          "Registrado Em",
          "Criado Por",
          "Detalhes",
        ]}
        data={filteredData
          .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
          .map((p) => ({
            turma: p.nomeTurma,
            bimestre: p.bimestre === 4 ? "Extra" : p.bimestre + 1,
            regra: p.regra.descricao,
            motivacao: formatPointMotivation(p),
            senso: p.regra.senso.descricao,
            operacao: p.operacao === "SUM" ? "Adição" : "Subtração",
            pontos: p.pontos,
            status: p.aplicado
              ? "Aplicado"
              : p.anulado
              ? "Anulado"
              : "Pendente",
            data: format(new Date(p.createdAt), "dd/MM/yyyy"),
            criado_por: p.criadoPor.username,
            registrado_em: format(new Date(p.createdAt), "dd/MM/yyyy HH:mm:ss"),
            detalhes: (
              <Link
                href={`/reports/${p.idTurma}?nome=${p.nomeTurma}`}
                className="text-blue-500 hover:underline"
              >
                Ver detalhes
              </Link>
            ),
          }))}
        searchValue={searchTerm}
        onSearch={(value) => {
          setCurrentPage(1);
          setSearchTerm(value);
        }}
        page={currentPage}
        totalPages={
          Math.ceil(filteredData.length / itemsPerPage) > 1
            ? Math.ceil(filteredData.length / itemsPerPage)
            : 1
        }
        onPageChange={onPageChange}
      />
    </div>
  );
};

export default ReportsPage;
