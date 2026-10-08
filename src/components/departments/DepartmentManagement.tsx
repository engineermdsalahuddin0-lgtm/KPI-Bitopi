import React, { useState, useEffect } from 'react';
import { Department, Section, Subsection } from '../../types';
import { db } from '../../services/db';
import {
  Building2,
  Plus,
  Search,
  Eye,
  EyeOff,
  RotateCw,
  Power,
  ExternalLink,
  Layers,
  X,
  Check,
  AlertCircle,
  FolderTree,
} from 'lucide-react';

interface DepartmentManagementProps {
  onSelectDepartmentForKPI: (deptId: string) => void;
}

export const DepartmentManagement: React.FC<DepartmentManagementProps> = ({
  onSelectDepartmentForKPI,
}) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [revealedCodes, setRevealedCodes] = useState<Record<string, boolean>>({});

  // Modals State
  const [addModalOpen, setAddModalOpen] = useState<boolean>(false);
  const [hierarchyModalDept, setHierarchyModalDept] = useState<Department | null>(null);

  // Add Department Form State
  const [newDeptName, setNewDeptName] = useState<string>('');
  const [newDeptCode, setNewDeptCode] = useState<string>('');
  const [addError, setAddError] = useState<string | null>(null);
  const [createdCredentials, setCreatedCredentials] = useState<{
    name: string;
    departmentId: string;
    accessCode: string;
  } | null>(null);

  // Hierarchy Form State
  const [deptSections, setDeptSections] = useState<Section[]>([]);
  const [newSectionName, setNewSectionName] = useState<string>('');
  const [newSubSectionName, setNewSubSectionName] = useState<string>('');
  const [selectedSectionForSub, setSelectedSectionForSub] = useState<string>('');
  const [subsectionsMap, setSubsectionsMap] = useState<Record<string, Subsection[]>>({});

  const refreshList = () => {
    setDepartments(db.getDepartments());
  };

  useEffect(() => {
    refreshList();
  }, []);

  const filteredDepartments = departments.filter(
    (d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.short_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.department_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleRevealCode = (id: string) => {
    setRevealedCodes((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleRegenerateCode = (dept: Department) => {
    if (
      window.confirm(
        `Regenerate access code for ${dept.name}? The previous code will become immediately invalid.`
      )
    ) {
      db.regenerateAccessCode(dept.id);
      refreshList();
    }
  };

  const handleToggleStatus = (dept: Department) => {
    db.toggleDepartmentStatus(dept.id);
    refreshList();
  };

  const handleCreateDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);

    if (!newDeptName.trim()) {
      setAddError('Department Name is required.');
      return;
    }
    if (!newDeptCode.trim()) {
      setAddError('Short Code is required.');
      return;
    }

    try {
      const created = db.createDepartment(newDeptName, newDeptCode);
      setCreatedCredentials({
        name: created.name,
        departmentId: created.department_id,
        accessCode: created.access_code,
      });
      setNewDeptName('');
      setNewDeptCode('');
      refreshList();
    } catch (err: any) {
      setAddError(err.message || 'Failed to create department');
    }
  };

  // Open Hierarchy Manager
  const openHierarchyManager = (dept: Department) => {
    setHierarchyModalDept(dept);
    const secs = db.getSections(dept.id);
    setDeptSections(secs);

    const subMap: Record<string, Subsection[]> = {};
    secs.forEach((s) => {
      subMap[s.id] = db.getSubsections(s.id);
    });
    setSubsectionsMap(subMap);
  };

  const handleAddSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hierarchyModalDept || !newSectionName.trim()) return;

    db.addSection(hierarchyModalDept.id, newSectionName.trim());
    setNewSectionName('');

    const secs = db.getSections(hierarchyModalDept.id);
    setDeptSections(secs);
  };

  const handleAddSubsection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSectionForSub || !newSubSectionName.trim()) return;

    db.addSubsection(selectedSectionForSub, newSubSectionName.trim());
    setNewSubSectionName('');

    const subs = db.getSubsections(selectedSectionForSub);
    setSubsectionsMap((prev) => ({
      ...prev,
      [selectedSectionForSub]: subs,
    }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
      {/* Top Header Card */}
      <div className="bg-white border border-neutral-200/90 rounded-lg p-4 mb-4 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-neutral-900 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-800" />
            <span>Department Management</span>
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Configure industry departments, secure access codes, and organizational structures.
          </p>
        </div>

        <button
          onClick={() => {
            setCreatedCredentials(null);
            setAddModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md bg-emerald-800 hover:bg-emerald-900 text-white shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Department</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-neutral-200/90 rounded-lg p-3 mb-4 shadow-2xs flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search departments by name or short code..."
            className="w-full pl-8 pr-3 py-1.5 rounded-md border border-neutral-300 bg-white text-xs text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-700"
          />
        </div>
        <div className="text-xs text-neutral-500">
          Showing <strong>{filteredDepartments.length}</strong> of {departments.length} departments
        </div>
      </div>

      {/* Department List Table (#11) */}
      <div className="bg-white rounded-lg border border-neutral-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="bg-neutral-50 border-b border-neutral-200 font-semibold text-neutral-600 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-2.5 px-4">Department</th>
                <th className="py-2.5 px-3">Code</th>
                <th className="py-2.5 px-3">Department ID</th>
                <th className="py-2.5 px-3">Access Code</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200/70">
              {filteredDepartments.map((dept) => {
                const isRevealed = !!revealedCodes[dept.id];
                return (
                  <tr
                    key={dept.id}
                    className="hover:bg-neutral-50/70 transition-colors text-neutral-800"
                  >
                    <td className="py-2.5 px-4 font-semibold text-neutral-900">
                      {dept.name}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-medium text-neutral-700">
                      {dept.short_code}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-medium text-emerald-900">
                      {dept.department_id}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-neutral-700">
                      <div className="flex items-center gap-2">
                        <span>{isRevealed ? dept.access_code : '••••••••••••'}</span>
                        <button
                          onClick={() => toggleRevealCode(dept.id)}
                          className="p-1 text-neutral-400 hover:text-neutral-700 transition-colors rounded"
                          title={isRevealed ? 'Mask Access Code' : 'Reveal Access Code'}
                        >
                          {isRevealed ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${
                          dept.status === 'active'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-neutral-100 text-neutral-500 border border-neutral-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            dept.status === 'active' ? 'bg-emerald-600' : 'bg-neutral-400'
                          }`}
                        />
                        <span>{dept.status === 'active' ? 'Active' : 'Disabled'}</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onSelectDepartmentForKPI(dept.id)}
                          className="px-2 py-1 rounded text-neutral-700 hover:bg-neutral-100 text-xs font-medium transition-colors flex items-center gap-1"
                          title="View KPI Board for this department"
                        >
                          <ExternalLink className="w-3 h-3 text-neutral-500" />
                          <span>View KPI</span>
                        </button>

                        <button
                          onClick={() => openHierarchyManager(dept)}
                          className="p-1 rounded text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                          title="Manage Sections & Sub-sections hierarchy"
                        >
                          <FolderTree className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleRegenerateCode(dept)}
                          className="p-1 rounded text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                          title="Regenerate Access Code"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleToggleStatus(dept)}
                          className={`p-1 rounded transition-colors ${
                            dept.status === 'active'
                              ? 'text-neutral-400 hover:text-rose-600 hover:bg-rose-50'
                              : 'text-emerald-700 hover:bg-emerald-50'
                          }`}
                          title={dept.status === 'active' ? 'Disable Department' : 'Enable Department'}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Department Modal (#10) */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs">
          <div className="bg-white rounded-xl border border-neutral-200 shadow-xl w-full max-w-md p-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <h2 className="text-sm font-bold text-neutral-900">Add New Department</h2>
              <button
                onClick={() => setAddModalOpen(false)}
                className="p-1 rounded text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {createdCredentials ? (
              <div className="py-4 space-y-4 text-xs">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900">
                  <p className="font-semibold flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-700" />
                    <span>Department Created Successfully!</span>
                  </p>
                  <p className="text-[11px] text-emerald-800 mt-1">
                    Department ID and Access Code have been generated automatically according to Bitopi security policies.
                  </p>
                </div>

                <div className="bg-neutral-50 p-3.5 rounded-lg border border-neutral-200 space-y-2 font-mono">
                  <div>
                    <span className="text-[10px] text-neutral-500 font-sans block">Department Name</span>
                    <span className="font-sans font-bold text-neutral-900">{createdCredentials.name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-500 font-sans block">Department ID</span>
                    <span className="font-bold text-emerald-800">{createdCredentials.departmentId}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-500 font-sans block">Access Code</span>
                    <span className="font-bold text-neutral-900 bg-white px-2 py-0.5 rounded border border-neutral-300 inline-block">
                      {createdCredentials.accessCode}
                    </span>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => {
                      setAddModalOpen(false);
                      setCreatedCredentials(null);
                    }}
                    className="px-4 py-1.5 rounded-md bg-emerald-800 text-white font-medium hover:bg-emerald-900"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateDepartment} className="py-4 space-y-3.5 text-xs">
                {addError && (
                  <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{addError}</span>
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-neutral-800 mb-1">
                    Department Name
                  </label>
                  <input
                    type="text"
                    value={newDeptName}
                    onChange={(e) => setNewDeptName(e.target.value)}
                    placeholder="e.g. Industrial Engineering"
                    className="w-full px-2.5 py-1.5 rounded border border-neutral-300 bg-white text-xs text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-700"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-800 mb-1">
                    Department Short Code
                  </label>
                  <input
                    type="text"
                    maxLength={5}
                    value={newDeptCode}
                    onChange={(e) => setNewDeptCode(e.target.value.toUpperCase())}
                    placeholder="e.g. IE"
                    className="w-full px-2.5 py-1.5 rounded border border-neutral-300 bg-white text-xs font-mono uppercase text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-700"
                  />
                  <p className="text-[10px] text-neutral-500 mt-1">
                    Department ID and secure Access Code will be automatically generated upon creation.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                  <button
                    type="button"
                    onClick={() => setAddModalOpen(false)}
                    className="px-3 py-1.5 rounded border border-neutral-300 text-neutral-700 hover:bg-neutral-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded bg-emerald-800 hover:bg-emerald-900 text-white font-medium shadow-xs"
                  >
                    Create Department
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Organizational Hierarchy Modal (#13: Department -> Section -> Sub-section) */}
      {hierarchyModalDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs">
          <div className="bg-white rounded-xl border border-neutral-200 shadow-xl w-full max-w-xl p-5 animate-in fade-in zoom-in-95 duration-150 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <div>
                <h2 className="text-sm font-bold text-neutral-900">
                  Organizational Hierarchy: {hierarchyModalDept.name}
                </h2>
                <p className="text-xs text-neutral-500">
                  Department → Section → Sub-section structure (#13)
                </p>
              </div>
              <button
                onClick={() => setHierarchyModalDept(null)}
                className="p-1 rounded text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs overflow-y-auto flex-1">
              {/* Add Section */}
              <form onSubmit={handleAddSection} className="flex gap-2">
                <input
                  type="text"
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  placeholder="New Section name (e.g. Line Optimization)"
                  className="flex-1 px-2.5 py-1.5 rounded border border-neutral-300 text-xs"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded bg-neutral-900 text-white font-medium hover:bg-neutral-800"
                >
                  + Add Section
                </button>
              </form>

              {/* Sections & Subsections tree */}
              <div className="space-y-3">
                {deptSections.length === 0 ? (
                  <p className="text-neutral-400 italic text-center py-4">
                    No sections defined yet for this department.
                  </p>
                ) : (
                  deptSections.map((sec) => {
                    const subs = subsectionsMap[sec.id] || [];
                    return (
                      <div
                        key={sec.id}
                        className="p-3 rounded-lg border border-neutral-200 bg-neutral-50 space-y-2"
                      >
                        <div className="font-semibold text-neutral-900 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-emerald-700" />
                          <span>{sec.name}</span>
                        </div>

                        {/* Subsections list */}
                        <div className="pl-5 space-y-1">
                          {subs.map((sub) => (
                            <div
                              key={sub.id}
                              className="text-[11px] text-neutral-700 bg-white px-2 py-1 rounded border border-neutral-200/80"
                            >
                              └─ {sub.name}
                            </div>
                          ))}
                        </div>

                        {/* Add Subsection form */}
                        <div className="pl-5 pt-1 flex gap-2">
                          <input
                            type="text"
                            value={selectedSectionForSub === sec.id ? newSubSectionName : ''}
                            onChange={(e) => {
                              setSelectedSectionForSub(sec.id);
                              setNewSubSectionName(e.target.value);
                            }}
                            onFocus={() => setSelectedSectionForSub(sec.id)}
                            placeholder="Add Sub-section..."
                            className="flex-1 px-2 py-1 rounded border border-neutral-300 text-[11px] bg-white"
                          />
                          <button
                            type="button"
                            onClick={handleAddSubsection}
                            className="px-2.5 py-1 rounded bg-neutral-200 hover:bg-neutral-300 text-neutral-800 text-[11px] font-medium"
                          >
                            + Add Sub
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-200 flex justify-end">
              <button
                onClick={() => setHierarchyModalDept(null)}
                className="px-4 py-1.5 rounded bg-emerald-800 text-white font-medium hover:bg-emerald-900 text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
