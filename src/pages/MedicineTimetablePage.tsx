import React from 'react';
import { useDocuments } from '@/context/DocumentContext';

export const MedicineTimetablePage: React.FC = () => {
  const { currentDoc, timetableChecklist, markTimetableItemCompleted } = useDocuments();
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  if (!currentDoc?.carePlan?.medications?.length) {
    return <div className="text-center py-20 text-slate-500">Generate a care plan with medications first.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Medicine Schedule</h1>
        <p className="text-sm text-slate-500 mt-1">7-day adherence timetable</p>
      </div>

      <div className="overflow-x-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800">
              <th className="text-left p-3 font-semibold">Medication</th>
              {days.map((d) => (
                <th key={d} className="p-3 font-semibold text-center">{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentDoc.carePlan.medications.map((m) => (
              <tr key={m.id} className="border-b border-slate-100 dark:border-slate-800">
                <td className="p-3 font-medium">{m.name}<br /><span className="text-xs text-slate-400">{m.dose} · {m.frequency}</span></td>
                {days.map((d) => {
                  const key = `${d}_${m.id}`;
                  const done = timetableChecklist[key];
                  return (
                    <td key={d} className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={!!done}
                        onChange={(e) => markTimetableItemCompleted(d, m.id, e.target.checked)}
                        className="w-4 h-4 accent-sky-500 cursor-pointer"
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
