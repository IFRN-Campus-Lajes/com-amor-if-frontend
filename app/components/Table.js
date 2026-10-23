"use client";

const Table = ({
  headers,
  data,
  actions,
  page,
  totalPages,
  onPageChange,
  searchValue,
  onSearch,
  searchText = "Buscar...",
  rowClassName,
}) => {
  return (
    <div>
      {/* Search Field */}
      <div className="mb-4">
        <input
          type="text"
          placeholder={searchText}
          value={searchValue}
          onChange={(e) => onSearch(e.target.value)}
          className="w-full px-4 py-2 border rounded shadow-sm"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="table-auto w-full border-collapse border border-gray-200">
          <thead>
            <tr className="bg-gray-100">
              {headers.map((header, index) => (
                <th
                  key={index}
                  className="px-4 py-2 border border-gray-200 text-left text-sm font-medium text-gray-600"
                >
                  {header}
                </th>
              ))}
              {actions && actions.length > 0 && (
                <th className="px-4 py-2 border border-gray-200 text-left text-sm font-medium text-gray-600">
                  Ações
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={
                    headers.length + (actions && actions.length > 0 ? 1 : 0)
                  }
                  className="px-4 py-2 text-center text-sm text-gray-600"
                >
                  Nenhum dado
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr
                  key={index}
                  className={`hover:bg-gray-50 ${rowClassName?.(row) || ""}`}
                >
                  {headers.map((header, idx) => (
                    <td
                      key={idx}
                      className="px-4 py-2 border border-gray-200 text-sm text-gray-700"
                    >
                      {row[header.toLowerCase().replace(/ /g, "_")]}
                    </td>
                  ))}
                  {actions && actions.length > 0 && (
                    <td className="px-4 py-2 border border-gray-200">
                      {actions.map((action, idx) => (
                        <button
                          key={idx}
                          className={`px-3 py-1 m-1 text-sm font-medium rounded ${action.color}`}
                          onClick={() => action.onClick(row)}
                        >
                          {action.label}
                        </button>
                      ))}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
        >
          Anterior
        </button>
        <span className="text-sm text-gray-600">
          Página {page} de {totalPages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
        >
          Próxima
        </button>
      </div>
    </div>
  );
};

export default Table;
