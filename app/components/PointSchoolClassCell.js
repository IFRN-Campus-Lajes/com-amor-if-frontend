"use client";

import { FaChevronDown } from "react-icons/fa6";
import {
  formatPointSchoolClasses,
  getPointSchoolClassNames,
} from "../../utils/point";

const PointSchoolClassCell = ({ point }) => {
  const label = formatPointSchoolClasses(point);

  if (!point?.collective) return <span>{label}</span>;

  const schoolClassNames = getPointSchoolClassNames(point);

  return (
    <details className="group min-w-44">
      <summary
        className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-md px-2 py-1 font-semibold text-amber-900 transition hover:bg-amber-100"
        aria-label={`${label}. Exibir ${schoolClassNames.length} ${
          schoolClassNames.length === 1 ? "turma" : "turmas"
        }`}
      >
        <FaChevronDown className="shrink-0 text-[10px] transition-transform group-open:rotate-180" />
        <span>{label}</span>
      </summary>
      <ul className="ml-2 mt-1 space-y-1 border-l border-amber-300 pl-4 text-xs text-gray-600">
        {schoolClassNames.map((name, index) => (
          <li key={`${name}-${index}`}>{name}</li>
        ))}
      </ul>
    </details>
  );
};

export default PointSchoolClassCell;
