/** The record a task asks to type, as a small table (like a line of a source document). */
import type { ExcelTask } from './tasks';

export default function TaskRecord({ record }: { record: NonNullable<ExcelTask['record']> }) {
  return (
    <table className="mt-1.5 border-collapse text-left">
      <thead>
        <tr>
          {record.map((f) => (
            <th
              key={f.label}
              className="border border-stone-300 bg-stone-100 px-2 py-0.5 text-xs font-semibold text-stone-600"
            >
              {f.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        <tr>
          {record.map((f) => (
            <td key={f.label} data-record-value className="border border-stone-300 px-2 py-1 font-mono text-stone-900">
              {f.value}
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  );
}
