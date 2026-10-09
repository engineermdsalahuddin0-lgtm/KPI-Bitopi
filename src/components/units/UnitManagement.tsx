import React, { useState, useEffect } from 'react';
import { Unit } from '../../types';
import { db } from '../../services/db';
import {
  Factory,
  Plus,
  Search,
  Eye,
  EyeOff,
  Power,
  X,
  Check,
  AlertCircle,
  Edit2,
  Trash2,
  Copy,
  Building2,
  MapPin,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface UnitManagementProps {
  onNavigateToDepartments?: (unitId?: string) => void;
}

export const UnitManagement: React.FC<UnitManagementProps> = ({
  onNavigateToDepartments,
}) => {
  const [units, setUnits] = useState<Unit[]>(() => db.getUnits());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled'>('all');
  const [revealedCodes, setRevealedCodes] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modals
  const [addModalOpen, setAddModalOpen] = useState<boolean>(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [unitToDeleteId, setUnitToDeleteId] = useState<string | null>(null);

  // Add Form
  const [newUnitName, setNewUnitName] = useState<string>('');
  const [newUnitCode, setNewUnitCode] = useState<string>('');
  const [newUnitLocation, setNewUnitLocation] = useState<string>('');
  const [newUnitAccessCode, setNewUnitAccessCode] = useState<string>('');
  const [newUnitStatus, setNewUnitStatus] = useState<'active' | 'disabled'>('active');
  const [addError, setAddError] = useState<string | null>(null);

  // Edit Form
  const [editName, setEditName] = useState<string>('');
  const [editCode, setEditCode] = useState<string>('');
  const [editLocation, setEditLocation] = useState<string>('');
  const [editAccessCode, setEditAccessCode] = useState<string>('');
  const [editStatus, setEditStatus] = useState<'active' | 'disabled'>('active');
  const [editError, setEditError] = useState<string | null>(null);

  // Notification Banner
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  const cleanLabel = (text?: string): string => (text ? text.replace(/\s*\([^)]*\)/g, '').trim() : '');

  // Reactive subscription
  useEffect(() => {
    const unsub = db.subscribe(() => {
      setUnits(db.getUnits());
    });
    return unsub;
  }, []);

  const refreshUnits = () => {
    setUnits(db.getUnits());
  };

  const toggleRevealCode = (unitId: string) => {
    setRevealedCodes((prev) => ({ ...prev, [unitId]: !prev[unitId] }));
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleStatus = (unit: Unit) => {
    const newStatus = unit.status === 'active' ? 'disabled' : 'active';
    db.updateUnit(unit.id, { status: newStatus });
    setBannerMessage(`Unit "${cleanLabel(unit.name)}" status changed to ${newStatus}.`);
    refreshUnits();
    setTimeout(() => setBannerMessage(null), 4000);
  };

  // ADD UNIT
  const handleAddUnitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);

    const name = newUnitName.trim();
    const code = newUnitCode.trim().toUpperCase();
    if (!name) {
      setAddError('Business Unit Name is required.');
      return;
    }
    if (!code) {
      setAddError('Unit Code is required (e.g. BGL, MGL, TAL).');
      return;
    }

    try {
      const created = db.createUnit(
        name,
        code,
        newUnitLocation.trim(),
        newUnitAccessCode.trim() || undefined,
        newUnitStatus
      );
      setNewUnitName('');
      setNewUnitCode('');
      setNewUnitLocation('');
      setNewUnitAccessCode('');
      setNewUnitStatus('active');
      setAddModalOpen(false);
      setBannerMessage(`Business Unit "${created.name}" created successfully.`);
      refreshUnits();
      setTimeout(() => setBannerMessage(null), 4000);
    } catch (err: any) {
      setAddError(err.message || 'Failed to create business unit.');
    }
  };

  // EDIT UNIT
  const openEditModal = (unit: Unit) => {
    setEditingUnit(unit);
    setEditName(cleanLabel(unit.name));
    setEditCode(unit.code);
    setEditLocation(unit.location || '');
    setEditAccessCode(unit.access_code || '');
    setEditStatus(unit.status);
    setEditError(null);
  };

  const handleEditUnitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUnit) return;
    setEditError(null);

    const name = editName.trim();
    const code = editCode.trim().toUpperCase();
    if (!name) {
      setEditError('Business Unit Name cannot be empty.');
      return;
    }
    if (!code) {
      setEditError('Unit Code cannot be empty.');
      return;
    }

    try {
      db.updateUnit(editingUnit.id, {
        name,
        code,
        location: editLocation.trim(),
        access_code: editAccessCode.trim() || editingUnit.access_code,
        status: editStatus,
      });
      setEditingUnit(null);
      setBannerMessage(`Business Unit "${name}" updated successfully.`);
      refreshUnits();
      setTimeout(() => setBannerMessage(null), 4000);
    } catch (err: any) {
      setEditError(err.message || 'Failed to update business unit.');
    }
  };

  // DELETE UNIT
  const handleConfirmDelete = (unit: Unit) => {
    const res = db.deleteUnit(unit.id);
    if (res.success) {
      setBannerMessage(`Business Unit "${cleanLabel(unit.name)}" deleted.`);
      setUnitToDeleteId(null);
      refreshUnits();
      setTimeout(() => setBannerMessage(null), 4000);
    } else {
      setBannerMessage(`Error: ${res.error || 'Failed to delete unit.'}`);
    }
  };

  // FILTERED UNITS
  const filteredUnits = units.filter((u) => {
    if (statusFilter !== 'all' && u.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const nameMatch = u.name.toLowerCase().includes(q);
      const codeMatch = u.code.toLowerCase().includes(q);
      const locMatch = (u.location || '').toLowerCase().includes(q);
      return nameMatch || codeMatch || locMatch;
    }
    return true;
  });

  const totalDepts = db.getDepartments().length;
  const activeUnitsCount = units.filter((u) => u.status === 'active').length;
  const uniqueLocations = new Set(units.map((u) => u.location).filter(Boolean)).size;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-in fade-in duration-200">
      {/* Top Banner Message */}
      {bannerMessage && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-700 shrink-0" />
            <span className="font-medium">{bannerMessage}</span>
          </div>
          <button
            onClick={() => setBannerMessage(null)}
            className="text-emerald-700 hover:text-emerald-900"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-800 text-white shadow-2xs">
              <Factory className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-neutral-900">
                Business Unit Management
              </h1>
              <p className="text-xs text-neutral-500 mt-0.5">
                Bitopi Group organizational units, factories, facilities & access credentials
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            setAddError(null);
            setAddModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-md bg-emerald-800 hover:bg-emerald-900 text-white shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Business Unit</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white p-3.5 rounded-lg border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs mb-1">
            <span>Total Units</span>
            <Factory className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-xl font-bold text-neutral-900 font-mono">
            {units.length}
          </div>
          <div className="text-[11px] text-neutral-500 mt-0.5">
            Registered business units
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs mb-1">
            <span>Active Facilities</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <div className="text-xl font-bold text-emerald-800 font-mono">
            {activeUnitsCount}
          </div>
          <div className="text-[11px] text-emerald-700 mt-0.5">
            Operational status
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs mb-1">
            <span>Departments Mapped</span>
            <Building2 className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-xl font-bold text-neutral-900 font-mono">
            {totalDepts}
          </div>
          <div className="text-[11px] text-neutral-500 mt-0.5">
            Across all business units
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs mb-1">
            <span>Locations & Cities</span>
            <MapPin className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-xl font-bold text-neutral-900 font-mono">
            {uniqueLocations}
          </div>
          <div className="text-[11px] text-neutral-500 mt-0.5">
            Mirpur, EPZ, Gazipur, Dhaka
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white border border-neutral-200 rounded-lg p-3 mb-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative w-full max-w-xs">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by unit name, code, or location..."
              className="w-full pl-8 pr-3 py-1.5 rounded-md border border-neutral-300 bg-white text-xs text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-700"
            />
          </div>

          <div className="flex items-center gap-1 bg-neutral-100 p-0.5 rounded-md border border-neutral-200 text-xs font-medium">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded transition-colors ${
                statusFilter === 'all'
                  ? 'bg-white text-neutral-900 shadow-2xs font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              All ({units.length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-2.5 py-1 rounded transition-colors ${
                statusFilter === 'active'
                  ? 'bg-white text-emerald-900 shadow-2xs font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Active ({activeUnitsCount})
            </button>
            <button
              onClick={() => setStatusFilter('disabled')}
              className={`px-2.5 py-1 rounded transition-colors ${
                statusFilter === 'disabled'
                  ? 'bg-white text-rose-900 shadow-2xs font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Disabled ({units.length - activeUnitsCount})
            </button>
          </div>
        </div>

        <div className="text-xs text-neutral-500 shrink-0">
          Showing <strong>{filteredUnits.length}</strong> of {units.length} business units
        </div>
      </div>

      {/* Units Table */}
      <div className="bg-white rounded-lg border border-neutral-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="bg-neutral-50 border-b border-neutral-200 font-semibold text-neutral-600 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-2.5 px-4">Business Unit</th>
                <th className="py-2.5 px-3">Unit Code</th>
                <th className="py-2.5 px-3">Facility Location</th>
                <th className="py-2.5 px-3">Unit Access Code</th>
                <th className="py-2.5 px-3 text-center">Departments</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200/70">
              {filteredUnits.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-neutral-500 text-xs">
                    No business units found matching your search.
                  </td>
                </tr>
              ) : (
                filteredUnits.map((u) => {
                  const depts = db.getDepartments(u.id);
                  const isRevealed = !!revealedCodes[u.id];
                  const isDeleting = unitToDeleteId === u.id;

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-neutral-50/70 transition-colors text-neutral-800"
                    >
                      <td className="py-3 px-4 font-semibold text-neutral-900">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center font-bold text-xs font-mono">
                            {u.code.slice(0, 3)}
                          </div>
                          <div>
                            <span className="font-semibold text-neutral-900 block">
                              {cleanLabel(u.name)}
                            </span>
                            <span className="text-[10px] text-neutral-500 font-mono">
                              ID: {u.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-neutral-100 text-neutral-800 border border-neutral-200">
                          {u.code}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-neutral-600">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                          <span>{u.location || 'Dhaka HQ'}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="inline-flex items-center gap-1.5 bg-neutral-50 px-2 py-1 rounded border border-neutral-200">
                          <span className="font-mono text-xs font-medium tracking-wider">
                            {isRevealed ? u.access_code || 'BGL-992-K8P' : '••••••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleRevealCode(u.id)}
                            className="text-neutral-400 hover:text-neutral-700 p-0.5 transition-colors"
                            title={isRevealed ? 'Hide access code' : 'Reveal access code'}
                          >
                            {isRevealed ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(u.access_code || 'BGL-992-K8P', u.id)}
                            className="text-neutral-400 hover:text-neutral-700 p-0.5 transition-colors"
                            title="Copy access code"
                          >
                            {copiedId === u.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => onNavigateToDepartments && onNavigateToDepartments(u.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-neutral-100 hover:bg-emerald-50 hover:text-emerald-900 border border-neutral-200 text-neutral-700 font-semibold transition-colors"
                          title="View all departments in this unit"
                        >
                          <Building2 className="w-3 h-3 text-neutral-500" />
                          <span>{depts.length}</span>
                          <ArrowRight className="w-3 h-3 opacity-50" />
                        </button>
                      </td>

                      <td className="py-3 px-3">
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold transition-colors border ${
                            u.status === 'active'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                          }`}
                          title={`Click to ${u.status === 'active' ? 'disable' : 'activate'} this unit`}
                        >
                          <Power className="w-2.5 h-2.5" />
                          <span>{u.status === 'active' ? 'Active' : 'Disabled'}</span>
                        </button>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {isDeleting ? (
                          <div className="inline-flex items-center gap-1 bg-rose-50 p-1 rounded-md border border-rose-200">
                            <span className="text-[10px] text-rose-800 font-semibold pr-1">
                              Delete? ({depts.length} depts)
                            </span>
                            <button
                              type="button"
                              onClick={() => handleConfirmDelete(u)}
                              className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-700 text-white font-semibold text-[10px]"
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              onClick={() => setUnitToDeleteId(null)}
                              className="px-2 py-0.5 rounded border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 text-[10px]"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEditModal(u)}
                              className="p-1.5 rounded-md text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 transition-colors"
                              title="Edit Business Unit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setUnitToDeleteId(u.id)}
                              className="p-1.5 rounded-md text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Delete Business Unit"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD UNIT MODAL */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs animate-in fade-in">
          <div className="bg-white rounded-xl border border-neutral-200 shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="px-5 py-3.5 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
              <div className="flex items-center gap-2">
                <Factory className="w-4 h-4 text-emerald-800" />
                <h3 className="font-bold text-neutral-900 text-sm">
                  Add New Business Unit
                </h3>
              </div>
              <button
                onClick={() => setAddModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddUnitSubmit} className="p-5 space-y-3.5 text-xs">
              {addError && (
                <div className="p-2.5 rounded-md bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{addError}</span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Business Unit Name *
                </label>
                <input
                  type="text"
                  value={newUnitName}
                  onChange={(e) => setNewUnitName(e.target.value)}
                  placeholder="e.g. Bitopi Garments Ltd."
                  className="w-full px-3 py-1.5 rounded-md border border-neutral-300 bg-white text-xs text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-700"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Unit Code (Acronym) *
                  </label>
                  <input
                    type="text"
                    value={newUnitCode}
                    onChange={(e) => setNewUnitCode(e.target.value.toUpperCase())}
                    placeholder="e.g. BGL, MGL"
                    maxLength={10}
                    className="w-full px-3 py-1.5 rounded-md border border-neutral-300 bg-white text-xs font-mono uppercase focus:outline-hidden focus:ring-1 focus:ring-emerald-700"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Status
                  </label>
                  <select
                    value={newUnitStatus}
                    onChange={(e) => setNewUnitStatus(e.target.value as any)}
                    className="w-full px-3 py-1.5 rounded-md border border-neutral-300 bg-white text-xs focus:outline-hidden focus:ring-1 focus:ring-emerald-700"
                  >
                    <option value="active">Active</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Facility Location
                </label>
                <input
                  type="text"
                  value={newUnitLocation}
                  onChange={(e) => setNewUnitLocation(e.target.value)}
                  placeholder="e.g. Mirpur, Dhaka / Comilla EPZ"
                  className="w-full px-3 py-1.5 rounded-md border border-neutral-300 bg-white text-xs focus:outline-hidden focus:ring-1 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Custom Access Code (Optional)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newUnitAccessCode}
                    onChange={(e) => setNewUnitAccessCode(e.target.value.toUpperCase())}
                    placeholder="Leave empty to auto-generate"
                    className="w-full px-3 py-1.5 rounded-md border border-neutral-300 bg-white font-mono text-xs uppercase focus:outline-hidden focus:ring-1 focus:ring-emerald-700"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const code = newUnitCode.trim().toUpperCase() || 'UNT';
                      const rnd = Math.random().toString(36).substring(2, 6).toUpperCase();
                      setNewUnitAccessCode(`${code}-991-${rnd}`);
                    }}
                    className="px-2.5 py-1.5 rounded-md border border-neutral-300 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-[11px] font-semibold shrink-0"
                    title="Generate random access code"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-3 py-1.5 rounded-md border border-neutral-300 text-neutral-700 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-md bg-emerald-800 hover:bg-emerald-900 text-white font-semibold shadow-xs"
                >
                  Create Unit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT UNIT MODAL */}
      {editingUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs animate-in fade-in">
          <div className="bg-white rounded-xl border border-neutral-200 shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="px-5 py-3.5 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-emerald-800" />
                <h3 className="font-bold text-neutral-900 text-sm">
                  Edit Business Unit: {editingUnit.code}
                </h3>
              </div>
              <button
                onClick={() => setEditingUnit(null)}
                className="text-neutral-400 hover:text-neutral-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditUnitSubmit} className="p-5 space-y-3.5 text-xs">
              {editError && (
                <div className="p-2.5 rounded-md bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Business Unit Name *
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-md border border-neutral-300 bg-white text-xs text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-700"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Unit Code (Acronym) *
                  </label>
                  <input
                    type="text"
                    value={editCode}
                    onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                    maxLength={10}
                    className="w-full px-3 py-1.5 rounded-md border border-neutral-300 bg-white text-xs font-mono uppercase focus:outline-hidden focus:ring-1 focus:ring-emerald-700"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full px-3 py-1.5 rounded-md border border-neutral-300 bg-white text-xs focus:outline-hidden focus:ring-1 focus:ring-emerald-700"
                  >
                    <option value="active">Active</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Facility Location
                </label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  placeholder="e.g. Mirpur, Dhaka"
                  className="w-full px-3 py-1.5 rounded-md border border-neutral-300 bg-white text-xs focus:outline-hidden focus:ring-1 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Unit Access Code
                </label>
                <input
                  type="text"
                  value={editAccessCode}
                  onChange={(e) => setEditAccessCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-1.5 rounded-md border border-neutral-300 bg-white font-mono text-xs uppercase focus:outline-hidden focus:ring-1 focus:ring-emerald-700"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setEditingUnit(null)}
                  className="px-3 py-1.5 rounded-md border border-neutral-300 text-neutral-700 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-md bg-emerald-800 hover:bg-emerald-900 text-white font-semibold shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
