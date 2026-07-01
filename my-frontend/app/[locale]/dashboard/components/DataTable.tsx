"use client";

interface DataTableProps {
  data: Record<string, any>[];
  columns?: { key: string; label: string }[];
}

export default function DataTable({ data, columns }: DataTableProps) {
  if (!data || data.length === 0) return null;

  const displayColumns = columns || Object.keys(data[0]).map(key => ({ key, label: key }));

  return (
    <div className="w-full overflow-hidden rounded-xl border border-slate-200">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {displayColumns.map((col) => (
                <th key={col.key} className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {data.map((row, i) => (
              <tr key={i} className="hover:bg-slate-50 transition-colors">
                {displayColumns.map((col) => (
                  <td key={col.key} className="px-4 py-2.5 text-slate-600">
                    {typeof row[col.key] === "number" ? row[col.key].toLocaleString() : String(row[col.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
