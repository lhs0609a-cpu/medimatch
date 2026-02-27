'use client';

import { Check, X, Minus } from 'lucide-react';

interface ComparisonColumn {
  name: string;
  highlight?: boolean;
  badge?: string;
}

interface ComparisonRow {
  label: string;
  values: (string | boolean | null)[];
}

interface ServiceComparisonTableProps {
  headline: string;
  subHeadline?: string;
  columns: ComparisonColumn[];
  rows: ComparisonRow[];
  resultRow?: {
    label: string;
    values: string[];
  };
}

function CellValue({ value }: { value: string | boolean | null }) {
  if (value === true) return <Check className="w-5 h-5 text-green-500 mx-auto" />;
  if (value === false) return <X className="w-5 h-5 text-red-400 mx-auto" />;
  if (value === null) return <Minus className="w-5 h-5 text-gray-300 mx-auto" />;
  return <span className="text-sm">{value}</span>;
}

export default function ServiceComparisonTable({
  headline,
  subHeadline,
  columns,
  rows,
  resultRow,
}: ServiceComparisonTableProps) {
  return (
    <section className="py-16 md:py-24 bg-gray-50">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-4xl font-bold text-gray-900">{headline}</h2>
          {subHeadline && (
            <p className="mt-3 text-lg text-gray-600">{subHeadline}</p>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="py-4 px-4 text-left text-sm font-medium text-gray-500 w-1/4">
                    항목
                  </th>
                  {columns.map((col, idx) => (
                    <th
                      key={idx}
                      className={`py-4 px-4 text-center ${
                        col.highlight
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700'
                      }`}
                    >
                      <div className="font-bold text-base">
                        {col.name}
                      </div>
                      {col.badge && (
                        <span className="inline-block mt-1 text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">
                          {col.badge}
                        </span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rIdx) => (
                  <tr key={rIdx} className="border-b border-gray-50 last:border-b-0">
                    <td className="py-3.5 px-4 text-sm font-medium text-gray-700">
                      {row.label}
                    </td>
                    {row.values.map((val, cIdx) => (
                      <td
                        key={cIdx}
                        className={`py-3.5 px-4 text-center ${
                          columns[cIdx]?.highlight ? 'bg-blue-50/50' : ''
                        }`}
                      >
                        <CellValue value={val} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
              {resultRow && (
                <tfoot>
                  <tr className="bg-gray-50 border-t-2 border-gray-200">
                    <td className="py-4 px-4 font-bold text-gray-900">
                      {resultRow.label}
                    </td>
                    {resultRow.values.map((val, idx) => (
                      <td
                        key={idx}
                        className={`py-4 px-4 text-center font-bold text-sm ${
                          columns[idx]?.highlight
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-700'
                        }`}
                      >
                        {val}
                      </td>
                    ))}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
