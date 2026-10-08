import React from 'react';
import { KPI } from '../../types';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface DeleteConfirmModalProps {
  kpi: KPI;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  kpi,
  onConfirm,
  onCancel,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs">
      <div className="bg-white rounded-xl border border-neutral-200 shadow-xl w-full max-w-md p-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-neutral-900">Delete KPI?</h3>
            <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
              This will remove the KPI definition for <strong className="text-neutral-800">{kpi.kpi_code}</strong> ({kpi.smart_kpi_text}) and all associated monthly performance records.
            </p>
            <p className="text-xs text-rose-600 font-medium mt-2">
              This action cannot be undone.
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-3.5 py-1.5 text-xs font-medium rounded-md border border-neutral-300 text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-1.5 text-xs font-medium rounded-md bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete KPI</span>
          </button>
        </div>
      </div>
    </div>
  );
};
