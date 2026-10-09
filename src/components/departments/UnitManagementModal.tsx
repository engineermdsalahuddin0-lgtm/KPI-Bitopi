import React, { useState } from 'react';
import { Unit } from '../../types';
import { db } from '../../services/db';
import {
  Factory,
  Plus,
  Trash2,
  X,
  AlertCircle,
  Check,
  MapPin,
  Building2,
} from 'lucide-react';

interface UnitManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnitsChanged: () => void;
}

export const UnitManagementModal: React.FC<UnitManagementModalProps> = ({
  isOpen,
  onClose,
  onUnitsChanged,
}) => {
  const [units, setUnits] = useState<Unit[]>(() => db.getUnits());
  const [newUnitName, setNewUnitName] = useState('');
  const [newUnitCode, setNewUnitCode] = useState('');
  const [newUnitLocation, setNewUnitLocation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [unitToDeleteId, setUnitToDeleteId] = useState<string | null>(null);

  if (!isOpen) return null;

  const refreshList = () => {
    setUnits(db.getUnits());
    onUnitsChanged();
  };

  const cleanLabel = (text?: string): string => {
    if (!text) return '';
    return text.replace(/\s*\([^)]*\)/g, '').trim();
  };

  const handleCreateUnit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const cleanName = newUnitName.trim();
    const cleanCode = newUnitCode.trim().toUpperCase();

    if (!cleanName) {
      setError('Business Unit Name is required.');
      return;
    }
    if (!cleanCode) {
      setError('Unit Code is required (e.g. BGL, MGL, TAL).');
      return;
    }

    try {
      db.createUnit(cleanName, cleanCode, newUnitLocation.trim());
      setNewUnitName('');
      setNewUnitCode('');
      setNewUnitLocation('');
      setSuccess(`Business Unit "${cleanName}" added successfully.`);
      refreshList();
    } catch (err: any) {
      setError(err.message || 'Failed to add business unit.');
    }
  };

  const handleConfirmDeleteUnit = (unit: Unit) => {
    const res = db.deleteUnit(unit.id);
    if (res.success) {
      setSuccess(`Business Unit "${cleanLabel(unit.name)}" removed.`);
      setError(null);
      setUnitToDeleteId(null);
      refreshList();
    } else {
      setError(res.error || 'Failed to delete business unit.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs">
      <div className="bg-white rounded-xl border border-neutral-200 shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-3.5 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/70">
          <div className="flex items-center gap-2">
            <Factory className="w-5 h-5 text-emerald-800" />
            <div>
              <h2 className="text-sm font-bold text-neutral-900">
                Business Unit Management
              </h2>
              <p className="text-[11px] text-neutral-500">
                Add, manage, or delete company business units & facilities
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0 text-emerald-700" />
              <span>{success}</span>
            </div>
          )}

          {/* Add Unit Form */}
          <form
            onSubmit={handleCreateUnit}
            className="p-4 bg-neutral-50 rounded-lg border border-neutral-200 space-y-3"
          >
            <div className="flex items-center gap-1.5 font-bold text-neutral-800">
              <Plus className="w-4 h-4 text-emerald-700" />
              <span>Add New Business Unit</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                  Business Unit Name *
                </label>
                <input
                  type="text"
                  value={newUnitName}
                  onChange={(e) => setNewUnitName(e.target.value)}
                  placeholder="e.g. Comilla Apparel Unit"
                  className="w-full px-3 py-1.5 rounded-md border border-neutral-300 bg-white text-xs focus:outline-hidden focus:ring-1 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                  Unit Code *
                </label>
                <input
                  type="text"
                  value={newUnitCode}
                  onChange={(e) => setNewUnitCode(e.target.value)}
                  placeholder="e.g. CAU"
                  maxLength={8}
                  className="w-full px-3 py-1.5 rounded-md border border-neutral-300 bg-white text-xs uppercase font-mono focus:outline-hidden focus:ring-1 focus:ring-emerald-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                Location (Optional)
              </label>
              <input
                type="text"
                value={newUnitLocation}
                onChange={(e) => setNewUnitLocation(e.target.value)}
                placeholder="e.g. Comilla EPZ, Bangladesh"
                className="w-full px-3 py-1.5 rounded-md border border-neutral-300 bg-white text-xs focus:outline-hidden focus:ring-1 focus:ring-emerald-700"
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-4 py-1.5 rounded-md bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Unit</span>
              </button>
            </div>
          </form>

          {/* Current Units List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="font-bold text-neutral-800">
                Existing Business Units ({units.length})
              </div>
            </div>

            <div className="divide-y divide-neutral-200 border border-neutral-200 rounded-lg overflow-hidden bg-white">
              {units.map((u) => {
                const deptsCount = db.getDepartments(u.id).length;
                return (
                  <div
                    key={u.id}
                    className="p-3 flex items-center justify-between gap-3 hover:bg-neutral-50/70 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-md bg-emerald-50 border border-emerald-200 flex items-center justify-center font-bold text-emerald-800 font-mono text-xs">
                        {u.code}
                      </div>
                      <div>
                        <div className="font-semibold text-neutral-900">
                          {cleanLabel(u.name)}
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-neutral-500 mt-0.5">
                          {u.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-neutral-400" />
                              <span>{u.location}</span>
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-neutral-400" />
                            <span>{deptsCount} department{deptsCount !== 1 ? 's' : ''}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {unitToDeleteId === u.id ? (
                        <div className="flex items-center gap-1.5 bg-rose-50 p-1 rounded-md border border-rose-200">
                          <button
                            type="button"
                            onClick={() => handleConfirmDeleteUnit(u)}
                            className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-semibold text-[10px] transition-colors"
                          >
                            Confirm Delete
                          </button>
                          <button
                            type="button"
                            onClick={() => setUnitToDeleteId(null)}
                            className="px-2 py-1 rounded border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 font-medium text-[10px] transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setUnitToDeleteId(u.id)}
                          className="p-1.5 rounded-md text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title={`Delete ${cleanLabel(u.name)}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-neutral-200 bg-neutral-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-md border border-neutral-300 text-neutral-700 hover:bg-white transition-colors font-medium text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
