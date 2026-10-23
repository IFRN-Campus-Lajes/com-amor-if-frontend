"use client";

import { useId, useState } from "react";
import { FaChevronDown } from "react-icons/fa6";
import {
  formatPointSchoolClasses,
  getPointSchoolClassNames,
} from "../../utils/point";

const PointSchoolClassCell = ({ point }) => {
  const [isOpen, setIsOpen] = useState(false);
  const panelId = useId();
  const label = formatPointSchoolClasses(point);

  if (!point?.collective) return <span>{label}</span>;

  const schoolClassNames = getPointSchoolClassNames(point);

  return (
    <div className="min-w-44">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        aria-controls={panelId}
        aria-label={`${label}. Exibir ${schoolClassNames.length} ${
          schoolClassNames.length === 1 ? "turma" : "turmas"
        }`}
        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-left font-semibold text-gray-700 transition-colors hover:bg-gray-100"
      >
        <FaChevronDown
          className={`shrink-0 text-[10px] transition-transform duration-300 motion-reduce:transition-none ${
            isOpen ? "rotate-180" : "rotate-0"
          }`}
        />
        <span>{label}</span>
      </button>
      <div
        id={panelId}
        role="region"
        aria-label={`Turmas de ${label}`}
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out motion-reduce:transition-none ${
          isOpen
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <ul className="ml-2 mt-1 space-y-1 border-l border-gray-200 pl-4 text-xs text-gray-600">
            {schoolClassNames.map((name, index) => (
              <li key={`${name}-${index}`}>{name}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PointSchoolClassCell;
