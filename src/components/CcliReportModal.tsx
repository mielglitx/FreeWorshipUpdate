import React, { useMemo, useState } from 'react';
import { Download, FileSpreadsheet, Search, Trash2, X } from 'lucide-react';
import { CcliLogEntry, downloadCcliCsv } from '../services/ccliLogService';

interface CcliReportModalProps {
  isOpen: boolean;
  entries: CcliLogEntry[];
  onClearLog: () => void;
  onClose: () => void;
}

export const CcliReportModal: React.FC<CcliReportModalProps> = ({
  isOpen,
  entries,
  onClearLog,
  onClose,
}) => {
  const [filterText, setFilterText] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);

  const filtered = useMemo(() => {
    const q = filterText.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.author.toLowerCase().includes(q) ||
        e.ccliNumber.toLowerCase().includes(q) ||
        e.dateStr.includes(q)
    );
  }, [entries, filterText]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-booth-900 border border-booth-700 rounded-2xl w-full max-w-3xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="px-5 py-3.5 bg-booth-950 border-b border-booth-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white">
                CCLI Song Usage Log &amp; Licensing Report
              </h2>
              <p className="text-[11px] text-slate-400">
                Automatically records each worship song projected live ({entries.length} logged)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-booth-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 border-b border-booth-800 flex items-center justify-between gap-2 flex-wrap bg-booth-950/60">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Filter by song title, author, CCLI #, or YYYY-MM..."
              className="w-full bg-booth-950 border border-booth-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:border-emerald-400 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={filtered.length === 0}
              onClick={() => downloadCcliCsv(filtered)}
              className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 disabled:opacity-40"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV ({filtered.length})</span>
            </button>

            {entries.length > 0 && !confirmClear && (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="px-2.5 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 font-bold text-xs flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            )}

            {confirmClear && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    onClearLog();
                    setConfirmClear(false);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-rose-600 text-white font-bold text-xs"
                >
                  Confirm Clear
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="px-2 py-1.5 rounded-lg bg-booth-800 text-slate-300 text-xs"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              {entries.length === 0
                ? 'No live song projections logged yet. Songs projected live appear here automatically.'
                : 'No entries match your filter.'}
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-booth-800 text-[10px] uppercase tracking-wider text-slate-400">
                  <th className="py-2 pr-3">Date / Time</th>
                  <th className="py-2 pr-3">Song Title</th>
                  <th className="py-2 pr-3">Author</th>
                  <th className="py-2 pr-3">Key</th>
                  <th className="py-2">CCLI #</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-booth-800/70">
                {filtered.map((entry) => (
                  <tr key={entry.id} className="hover:bg-booth-850/60">
                    <td className="py-2 pr-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {entry.dateStr}{' '}
                      {new Date(entry.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-2 pr-3 font-bold text-white">{entry.title}</td>
                    <td className="py-2 pr-3 text-slate-300">{entry.author}</td>
                    <td className="py-2 pr-3 font-mono text-amber-300">{entry.musicalKey}</td>
                    <td className="py-2 font-mono text-emerald-300">{entry.ccliNumber}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
