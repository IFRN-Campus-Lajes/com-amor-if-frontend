"use client";

import React, { useState } from "react";
import { FaCircleCheck, FaCircleMinus, FaCirclePlus } from "react-icons/fa6";
import RuleSelect from "./RuleSelect";

const fieldLabelClassName = "block text-sm font-semibold text-gray-700";
const fieldControlClassName =
  "mt-2 min-h-11 w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500";

const PontuacaoForm = ({
  regrasDisponiveis,
  turmasDisponiveis = [],
  olimpiadasDisponiveis = [],
  onSubmit,
  disabled = false,
}) => {
  const [regras, setRegras] = useState(regrasDisponiveis || []);
  const [operacao, setOperacao] = useState(null);
  const [formData, setFormData] = useState({
    idTurma: "",
    idRegra: "",
    pontos: "",
    operacao: "",
    motivacao: "",
    matriculaAluno: "",
    bimestre: 0,
    turno: "",
    idOlimpiada: "",
  });
  const [tipoRegra, setTipoRegra] = useState(null);

  const handleRegraChange = (regraId) => {
    const regraSelecionada = regras.find(
      (regra) => regra.id === parseInt(regraId)
    );
    setTipoRegra(regraSelecionada?.tipoRegra || null);
    setOperacao(regraSelecionada?.operacao || "");
    setFormData({
      ...formData,
      idRegra: regraId,
      operacao: regraSelecionada?.operacao || "",
      pontos: regraSelecionada?.tipoRegra?.fixo
        ? regraSelecionada.valorMinimo
        : "",
      bimestre: regraSelecionada?.tipoRegra?.bimestreExtra ? 4 : 0,
      valorMinimo: regraSelecionada?.valorMinimo || 0,
      valorMaximo: regraSelecionada?.valorMaximo || 500,
      idOlimpiada: "",
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (disabled) return;
    onSubmit(formData, setFormData, setTipoRegra, setOperacao);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <fieldset disabled={disabled} className="space-y-6">
      {/* Seletor de Regra */}
      <div>
        <div className="flex min-h-6 flex-wrap items-center justify-between gap-2">
          <label htmlFor="regra" className={fieldLabelClassName}>Regra</label>
          {operacao && (
            <span
              className={`inline-flex items-center gap-1.5 text-sm font-medium ${
                operacao === "SUM" ? "text-green-700" : "text-red-700"
              }`}
              aria-live="polite"
            >
              {operacao === "SUM" ? (
                <FaCirclePlus className="h-4 w-4" aria-hidden="true" />
              ) : (
                <FaCircleMinus className="h-4 w-4" aria-hidden="true" />
              )}
              {operacao === "SUM"
                ? "Operação de adição"
                : "Operação de subtração"}
            </span>
          )}
        </div>
        <RuleSelect
          rules={regras}
          selectedRuleId={formData.idRegra}
          onChange={handleRegraChange}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {/* Select Turma ou Turno */}
        {tipoRegra?.porTurno ? (
          <div>
            <label htmlFor="turno" className={fieldLabelClassName}>Turno</label>
            <select
              id="turno"
              name="turno"
              value={formData.turno}
              onChange={handleInputChange}
              className={fieldControlClassName}
              required
            >
              <option value="">Selecione um turno</option>
              <option value="0">Matutino</option>
              <option value="1">Vespertino</option>
            </select>
          </div>
        ) : (
          <div>
            <label htmlFor="turma" className={fieldLabelClassName}>Turma</label>
            <select
              id="turma"
              name="idTurma"
              value={formData.idTurma}
              onChange={handleInputChange}
              className={fieldControlClassName}
              required
            >
              <option value="">Selecione uma turma</option>
              {turmasDisponiveis.map((turma) => (
                <option key={turma.id} value={turma.id}>
                  {turma.nome}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Select Bimestre */}
        {(tipoRegra?.frequencia !== 0 || tipoRegra?.bimestreExtra) && (
          <div>
            <label htmlFor="bimestre" className={fieldLabelClassName}>Bimestre</label>
            <select
              id="bimestre"
              name="bimestre"
              value={formData.bimestre}
              onChange={handleInputChange}
              className={fieldControlClassName}
              required
              disabled={tipoRegra?.bimestreExtra}
            >
              <option value="0">1º Bimestre</option>
              <option value="1">2º Bimestre</option>
              <option value="2">3º Bimestre</option>
              <option value="3">4º Bimestre</option>
              <option value="4">Bimestre Extra</option>
            </select>
          </div>
        )}

        {/* Pontos */}
        {tipoRegra?.fixo ? (
          <div>
            <span className={fieldLabelClassName}>Pontos</span>
            <p className="mt-2 flex min-h-11 items-center rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-700">
              {formData.pontos} pontos (valor fixo)
            </p>
          </div>
        ) : (
          <div>
            <label htmlFor="pontos" className={fieldLabelClassName}>Pontos</label>
            <input
              id="pontos"
              type="number"
              name="pontos"
              value={formData.pontos}
              onChange={handleInputChange}
              min={formData.valorMinimo || 0}
              max={formData.valorMaximo || 100}
              className={fieldControlClassName}
              required
            />
          </div>
        )}

        {/* Matrícula do Aluno */}
        {tipoRegra?.temAluno && (
          <div>
            <label htmlFor="matriculaAluno" className={fieldLabelClassName}>
              Matrícula do Aluno
            </label>
            <input
              id="matriculaAluno"
              type="text"
              name="matriculaAluno"
              value={formData.matriculaAluno}
              onChange={handleInputChange}
              maxLength={15}
              className={fieldControlClassName}
            />
          </div>
        )}

        {tipoRegra?.temOlimpiada && (
          <div>
            <label htmlFor="olimpiada" className={fieldLabelClassName}>
              Olimpíada
            </label>
            <select
              id="olimpiada"
              name="idOlimpiada"
              value={formData.idOlimpiada}
              onChange={handleInputChange}
              className={fieldControlClassName}
              required
            >
              <option value="">Selecione uma olimpíada</option>
              {olimpiadasDisponiveis.map((olimpiada) => (
                <option key={olimpiada.id} value={olimpiada.id}>
                  {olimpiada.nome}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Motivação */}
      <div>
        <label htmlFor="motivacao" className={fieldLabelClassName}>Motivação</label>
        <textarea
          id="motivacao"
          name="motivacao"
          value={formData.motivacao}
          onChange={handleInputChange}
          className={`${fieldControlClassName} min-h-24 resize-y`}
          rows="3"
        ></textarea>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end border-t border-gray-200 pt-5">
        <button
          type="submit"
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:w-auto"
        >
          <FaCircleCheck className="h-4 w-4" aria-hidden="true" />
          Registrar Pontuação
        </button>
      </div>
      </fieldset>
    </form>
  );
};

export default PontuacaoForm;
