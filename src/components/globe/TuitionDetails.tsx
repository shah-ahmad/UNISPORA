export type TuitionBreakdown = {
  year: string;
  audience: string;
  unit: string;
  categories: string[][];
  medical: string[][];
  doctoral: string[][];
  note: string;
};

export function readTuitionBreakdown(raw?: string): TuitionBreakdown | undefined {
  try {
    const data = JSON.parse(raw || '{}').breakdown;
    if (!data || !['year', 'audience', 'unit', 'note'].every(key => typeof data[key] === 'string')) return;
    for (const [key, columns] of [['categories', 3], ['medical', 2], ['doctoral', 2]] as const) {
      if (!Array.isArray(data[key]) || !data[key].every((row: unknown) => Array.isArray(row) && row.length === columns && row.every(cell => typeof cell === 'string'))) return;
    }
    return data;
  } catch { return; }
}

export function TuitionDetails({ name, breakdown, onBack }: { name: string; breakdown: TuitionBreakdown; onBack: () => void }) {
  return <>
    <button type="button" className="tuition-back" onClick={onBack} autoFocus>← Back to university</button>
    <p className="tuition-eyebrow">Tuition fees · {breakdown.year}</p>
    <h2 className="tuition-title">{name}</h2>
    <p>{breakdown.audience}</p>
    <p className="tuition-unit">{breakdown.unit}</p>
    <FeeTable title="Tuition by category" headers={['Category', "Bachelor’s", "Master’s"]} rows={breakdown.categories} />
    <FeeTable title="Medical programs" headers={['Program', 'Annual tuition']} rows={breakdown.medical} />
    <FeeTable title="Doctoral programs (PhD)" headers={['Category', 'Annual tuition']} rows={breakdown.doctoral} />
    <p className="tuition-disclaimer"><strong>About these figures</strong><br />{breakdown.note}</p>
  </>;
}

function FeeTable({ title, headers, rows }: { title: string; headers: string[]; rows: string[][] }) {
  return <div className="tuition-table-wrap"><table className="tuition-table"><caption>{title}</caption><thead><tr>{headers.map(header => <th key={header} scope="col">{header}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={index}>{row.map((cell, column) => column === 0 ? <th key={column} scope="row">{cell}</th> : <td key={column}>{cell}</td>)}</tr>)}</tbody></table></div>;
}
