import type { ReactNode } from 'react';

type Column<T> = {
  key: keyof T;
  label: string;
  render?: (row: T) => ReactNode;
};

export function Table<T extends { id: number | string }>({ rows, columns }: { rows: T[]; columns: Column<T>[] }) {
  return (
    <div className="card table-card">
      <table>
        <thead>
          <tr>
            {columns.map((column) => <th key={String(column.key)}>{column.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              {columns.map((column) => (
                <td key={String(column.key)}>{column.render ? column.render(row) : String(row[column.key] ?? '')}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
