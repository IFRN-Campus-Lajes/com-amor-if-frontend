"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FaCircleMinus, FaCirclePlus, FaRocket } from "react-icons/fa6";

export const UNGROUPED_RULES_LABEL = "Outras regras";
export const isTurboRule = (rule) => Number(rule?.valorMinimo) >= 30;
export const getRuleDisplayDescription = (description = "") =>
  description.replace(/^\s*\[TURBO\]\s*/i, "").trim();

const OPERATION_DETAILS = {
  SUM: {
    Icon: FaCirclePlus,
    label: "Operação de adição",
    iconClassName: "text-green-600",
    hoverClassName: "hover:bg-green-50",
    activeClassName: "bg-green-50",
  },
  SUB: {
    Icon: FaCircleMinus,
    label: "Operação de subtração",
    iconClassName: "text-red-600",
    hoverClassName: "hover:bg-red-50",
    activeClassName: "bg-red-50",
  },
};

const RuleOperationIcon = ({ operation, announce = false }) => {
  const details = OPERATION_DETAILS[operation];

  if (!details) return <span className="h-5 w-5 shrink-0" aria-hidden="true" />;

  const { Icon, iconClassName, label } = details;
  return (
    <span
      className={`flex h-5 w-5 shrink-0 items-center justify-center ${iconClassName}`}
      role={announce ? "img" : undefined}
      aria-label={announce ? label : undefined}
      aria-hidden={announce ? undefined : "true"}
      title={announce ? label : undefined}
    >
      <Icon className="h-5 w-5" />
    </span>
  );
};

const RuleTurboIcon = ({ announce = false }) => (
  <span
    className="flex h-5 w-5 shrink-0 items-center justify-center text-amber-600"
    role={announce ? "img" : undefined}
    aria-label={announce ? "Regra TURBO" : undefined}
    aria-hidden={announce ? undefined : "true"}
    title={announce ? "Regra TURBO" : undefined}
  >
    <FaRocket className="h-4 w-4" />
  </span>
);

const normalizeSearchValue = (value = "") =>
  (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase();

export const groupRulesByCategory = (rules = []) =>
  rules.reduce((groups, rule) => {
    const groupName = rule.categoria?.trim() || UNGROUPED_RULES_LABEL;

    if (!groups[groupName]) groups[groupName] = [];
    groups[groupName].push(rule);

    return groups;
  }, {});

export const isLastRuleCategory = (groupName = "") =>
  ["outros", normalizeSearchValue(UNGROUPED_RULES_LABEL)].includes(
    normalizeSearchValue(groupName)
  );

export const orderRuleGroups = (groups = []) => [...groups].sort(([nameA], [nameB]) => {
  const rank = (name) => normalizeSearchValue(name) === "outros" ? 1
    : normalizeSearchValue(name) === normalizeSearchValue(UNGROUPED_RULES_LABEL) ? 2 : 0;
  const rankA = rank(nameA);
  const rankB = rank(nameB);
  if (rankA !== rankB) return rankA - rankB;
  return nameA.localeCompare(nameB, "pt-BR", { sensitivity: "base" });
});

const RuleSelect = ({ rules = [], selectedRuleId, onChange }) => {
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const activeOptionRef = useRef(null);
  const editingRef = useRef(false);
  const keyboardNavigationRef = useRef(false);
  const keyboardScrollBlockRef = useRef("nearest");
  const previousSelectedRuleIdRef = useRef(selectedRuleId);
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const selectedRule = rules.find((rule) => String(rule.id) === String(selectedRuleId));
  const filteredRules = useMemo(() => {
    const normalizedSearch = normalizeSearchValue(searchTerm);
    return rules.filter((rule) =>
      [
        getRuleDisplayDescription(rule.descricao),
        rule.categoria,
        isTurboRule(rule) ? "turbo" : "",
      ].some((value) =>
        normalizeSearchValue(value).includes(normalizedSearch)
      )
    );
  }, [rules, searchTerm]);
  const groups = orderRuleGroups(
    Object.entries(groupRulesByCategory(filteredRules))
  );
  const displayedRules = groups.flatMap(([, groupedRules]) => groupedRules);
  const selectedOperation = OPERATION_DETAILS[selectedRule?.operacao];
  const selectedIsTurbo = isTurboRule(selectedRule);
  const selectedHasIcon = selectedOperation || selectedIsTurbo;
  const selectedInputPadding = selectedOperation && selectedIsTurbo ? "pl-16" : "pl-10";

  useEffect(() => {
    if (selectedRule) {
      setSearchTerm(getRuleDisplayDescription(selectedRule.descricao));
      editingRef.current = false;
    } else if (previousSelectedRuleIdRef.current && !editingRef.current) {
      setSearchTerm("");
    }
    previousSelectedRuleIdRef.current = selectedRuleId;
  }, [selectedRule, selectedRuleId]);

  useEffect(() => {
    inputRef.current?.setCustomValidity(
      selectedRule ? "" : "Selecione uma regra da lista."
    );
  }, [selectedRule]);

  useEffect(() => {
    if (!keyboardNavigationRef.current || !isOpen) return;

    activeOptionRef.current?.scrollIntoView?.({
      block: keyboardScrollBlockRef.current,
    });
    keyboardNavigationRef.current = false;
  }, [activeIndex, isOpen]);

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setIsOpen(false);
        if (selectedRule) {
          setSearchTerm(getRuleDisplayDescription(selectedRule.descricao));
        }
      }
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [selectedRule]);

  const handleSelect = (rule) => {
    editingRef.current = false;
    onChange(String(rule.id));
    setSearchTerm(getRuleDisplayDescription(rule.descricao));
    setIsOpen(false);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      setIsOpen(false);
      setSearchTerm(getRuleDisplayDescription(selectedRule?.descricao));
      return;
    }
    if (!displayedRules.length) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      keyboardNavigationRef.current = true;
      setIsOpen(true);
      const direction = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((current) => {
        const next =
          (current + direction + displayedRules.length) % displayedRules.length;
        const wrapped =
          (direction === 1 && next === 0) ||
          (direction === -1 && next === displayedRules.length - 1);
        keyboardScrollBlockRef.current =
          wrapped || next === 0 ? "center" : "nearest";
        return next;
      });
    }
    if (event.key === "Enter" && isOpen) {
      event.preventDefault();
      handleSelect(displayedRules[activeIndex] || displayedRules[0]);
    }
  };

  return (
    <div className="relative mt-2" ref={containerRef}>
      {selectedHasIcon && (
        <span className="pointer-events-none absolute left-3 top-[22px] z-10 flex -translate-y-1/2 gap-1">
          {selectedOperation && (
            <RuleOperationIcon operation={selectedRule.operacao} announce />
          )}
          {selectedIsTurbo && <RuleTurboIcon announce />}
        </span>
      )}
      <input
        ref={inputRef}
        id="regra"
        aria-activedescendant={
          isOpen && displayedRules[activeIndex]
            ? `rule-option-${displayedRules[activeIndex].id}`
            : undefined
        }
        aria-autocomplete="list"
        aria-controls="rule-options"
        aria-expanded={isOpen}
        aria-label="Buscar regra pela descrição ou categoria"
        autoComplete="off"
        autoCorrect="off"
        className={`min-h-11 w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 ${selectedHasIcon ? selectedInputPadding : ""}`}
        onChange={(event) => {
          editingRef.current = true;
          setSearchTerm(event.target.value);
          setActiveIndex(0);
          setIsOpen(true);
          if (selectedRuleId) onChange("");
        }}
        onFocus={() => {
          setActiveIndex(Math.max(0, displayedRules.indexOf(selectedRule)));
          setIsOpen(true);
        }}
        onKeyDown={handleKeyDown}
        placeholder="Digite a descrição ou categoria"
        role="combobox"
        spellCheck={false}
        type="search"
        value={searchTerm}
        required
      />

      {isOpen && (
        <div
          id="rule-options"
          role="listbox"
          aria-label="Regras disponíveis"
          className="absolute z-20 mt-2 max-h-80 w-full overflow-y-auto rounded-md border border-gray-200 bg-white shadow-xl"
        >
          {groups.length > 0 ? (
            groups.map(([groupName, groupedRules]) => (
              <section key={groupName} aria-label={groupName}>
                <h3 className="sticky top-0 z-10 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700">
                  {groupName}
                </h3>
                {groupedRules.map((rule) => {
                  const ruleIndex = displayedRules.indexOf(rule);
                  const operation = OPERATION_DETAILS[rule.operacao];
                  const turbo = isTurboRule(rule);
                  const displayDescription = getRuleDisplayDescription(rule.descricao);
                  const operationDescriptionId = `rule-operation-${rule.id}`;
                  const turboDescriptionId = `rule-turbo-${rule.id}`;
                  const descriptionIds = [
                    operation ? operationDescriptionId : null,
                    turbo ? turboDescriptionId : null,
                  ].filter(Boolean);
                  return (
                    <button
                      ref={ruleIndex === activeIndex ? activeOptionRef : null}
                      id={`rule-option-${rule.id}`}
                      type="button"
                      role="option"
                      aria-label={displayDescription}
                      aria-selected={ruleIndex === activeIndex}
                      aria-describedby={descriptionIds.join(" ") || undefined}
                      className={`flex min-h-11 w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors duration-150 ${
                        operation?.hoverClassName || "hover:bg-gray-50"
                      } ${
                        ruleIndex === activeIndex
                          ? operation?.activeClassName || "bg-gray-50"
                          : ""
                      }`}
                      key={rule.id}
                      onMouseEnter={() => setActiveIndex(ruleIndex)}
                      onClick={() => handleSelect(rule)}
                    >
                      <RuleOperationIcon operation={rule.operacao} />
                      {turbo && <RuleTurboIcon />}
                      <span className="min-w-0 flex-1 leading-snug">
                        {displayDescription}
                      </span>
                      {operation && (
                        <span id={operationDescriptionId} className="sr-only">
                          {operation.label}.
                        </span>
                      )}
                      {turbo && (
                        <span id={turboDescriptionId} className="sr-only">
                          Regra TURBO.
                        </span>
                      )}
                    </button>
                  );
                })}
              </section>
            ))
          ) : (
            <p className="px-3 py-2 text-gray-600" role="status">
              Nenhuma regra encontrada.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default RuleSelect;
