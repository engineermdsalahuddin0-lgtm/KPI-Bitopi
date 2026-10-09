const fs = require('fs');

const hierarchy = JSON.parse(fs.readFileSync('extracted_hierarchy.json', 'utf8'));

// Unit details
const unitMeta = {
  BGL: { name: 'Bitopi Garments Ltd. (BGL)', location: 'Mirpur, Dhaka', access_code: 'BGL-992-K8P' },
  MGL: { name: 'Misami Garments Ltd. (MGL)', location: 'Comilla EPZ', access_code: 'MGL-441-R7T' },
  RHL: { name: 'Rimpex Holdings Ltd. (RHL)', location: 'Adamjee EPZ, Narayanganj', access_code: 'RHL-782-X2M' },
  SRSL: { name: 'Sheba Ready Made Solutions Ltd. (SRSL)', location: 'Corporate Studio, Dhaka', access_code: 'SRS-319-Q5L' },
  TAL: { name: 'Tara Atire Ltd. (TAL)', location: 'Kashimpur, Gazipur', access_code: 'TAL-853-Z9W' }
};

// Department short codes dictionary
const deptShortCodes = {
  'HR & Admin': 'HRA',
  'Industrial Engineering': 'IE',
  'CAD & Sample': 'CAD',
  'Commercial': 'COM',
  'Engineering & Services': 'ENG',
  'ERP & IT': 'IT',
  'Finance & Accounts': 'FIN',
  'General': 'GEN',
  'HR, Admin & Compliance': 'HRC',
  'MIS & Internal Audit': 'MIS',
  'Production': 'PROD',
  'Production Planning & control': 'PPC',
  'QA, Audit & Technical': 'QA',
  'Store & Warehouse': 'STW',
  'Technical': 'TECH',
  'Washing': 'WASH',
  'Design & Product Development': 'DPD',
  'ESG': 'ESG',
  'Marketing & Merchandising': 'MM',
  'Supply Chain': 'SCM',
  'IE': 'IE2'
};

const units = [];
const departments = [];
const sections = [];
const subsections = [];

let deptCounter = 1;
let secCounter = 1;
let subCounter = 1;

for (const u of hierarchy) {
  const uCode = u.code;
  const meta = unitMeta[uCode] || { name: `${uCode} Unit`, location: 'Bangladesh', access_code: `${uCode}-123-ABC` };
  const uId = `unit-${uCode.toLowerCase()}`;
  units.push({
    id: uId,
    name: meta.name,
    code: uCode,
    location: meta.location,
    access_code: meta.access_code,
    status: 'active'
  });

  for (const d of u.departments) {
    const sc = deptShortCodes[d.name] || d.name.replace(/[^A-Za-z]/g, '').slice(0, 4).toUpperCase();
    const dId = `dept-${uCode.toLowerCase()}-${sc.toLowerCase()}-${deptCounter++}`;
    const hex = Math.floor(1000 + Math.random() * 9000).toString(16).toUpperCase();
    const deptUniqueId = `${uCode}-${sc}-${hex}`.slice(0, 24);
    const accessCode = `${sc}-${Math.floor(10 + Math.random() * 89)}K-${Math.floor(10 + Math.random() * 89)}P`;

    departments.push({
      id: dId,
      unit_id: uId,
      name: d.name,
      short_code: `${uCode}-${sc}`,
      department_id: deptUniqueId,
      access_code: accessCode,
      status: 'active'
    });

    for (const s of d.sections) {
      const sId = `sec-${uCode.toLowerCase()}-${secCounter++}`;
      sections.push({
        id: sId,
        department_id: dId,
        name: s.name
      });

      for (const sub of s.subsections) {
        const subId = `sub-${uCode.toLowerCase()}-${subCounter++}`;
        subsections.push({
          id: subId,
          section_id: sId,
          name: sub.name
        });
      }
    }
  }
}

console.log(`Generated: ${units.length} Units, ${departments.length} Departments, ${sections.length} Sections, ${subsections.length} Subsections`);

// Write to JSON
fs.writeFileSync('generated_seeds.json', JSON.stringify({ units, departments, sections, subsections }, null, 2));
