import { Unit, Department, Section, Subsection } from '../types';

export const INITIAL_UNITS: Omit<Unit, 'created_at' | 'updated_at'>[] = [
  {
    "id": "unit-bgl",
    "name": "Bitopi Garments Ltd.",
    "code": "BGL",
    "location": "Mirpur, Dhaka",
    "access_code": "BGL-992-K8P",
    "status": "active"
  },
  {
    "id": "unit-mgl",
    "name": "Misami Garments Ltd.",
    "code": "MGL",
    "location": "Comilla EPZ",
    "access_code": "MGL-441-R7T",
    "status": "active"
  },
  {
    "id": "unit-rhl",
    "name": "Rimpex Holdings Ltd.",
    "code": "RHL",
    "location": "Adamjee EPZ, Narayanganj",
    "access_code": "RHL-782-X2M",
    "status": "active"
  },
  {
    "id": "unit-srsl",
    "name": "Sheba Ready Made Solutions Ltd.",
    "code": "SRSL",
    "location": "Corporate Studio, Dhaka",
    "access_code": "SRS-319-Q5L",
    "status": "active"
  },
  {
    "id": "unit-tal",
    "name": "Tara Atire Ltd.",
    "code": "TAL",
    "location": "Kashimpur, Gazipur",
    "access_code": "TAL-853-Z9W",
    "status": "active"
  }
];

export const INITIAL_DEPARTMENTS: Omit<Department, 'created_at' | 'updated_at'>[] = [
  {
    "id": "dept-bgl-hra-1",
    "unit_id": "unit-bgl",
    "name": "HR & Admin",
    "short_code": "BGL-HRA",
    "department_id": "BGL-HRA-1511",
    "access_code": "HRA-61K-77P",
    "status": "active"
  },
  {
    "id": "dept-bgl-ie-2",
    "unit_id": "unit-bgl",
    "name": "Industrial Engineering",
    "short_code": "BGL-IE",
    "department_id": "BGL-IE-54A",
    "access_code": "IE-52K-37P",
    "status": "active"
  },
  {
    "id": "dept-bgl-cad-3",
    "unit_id": "unit-bgl",
    "name": "CAD & Sample",
    "short_code": "BGL-CAD",
    "department_id": "BGL-CAD-23CE",
    "access_code": "CAD-98K-60P",
    "status": "active"
  },
  {
    "id": "dept-bgl-com-4",
    "unit_id": "unit-bgl",
    "name": "Commercial",
    "short_code": "BGL-COM",
    "department_id": "BGL-COM-5AE",
    "access_code": "COM-18K-60P",
    "status": "active"
  },
  {
    "id": "dept-bgl-eng-5",
    "unit_id": "unit-bgl",
    "name": "Engineering & Services",
    "short_code": "BGL-ENG",
    "department_id": "BGL-ENG-11B8",
    "access_code": "ENG-78K-81P",
    "status": "active"
  },
  {
    "id": "dept-bgl-it-6",
    "unit_id": "unit-bgl",
    "name": "ERP & IT",
    "short_code": "BGL-IT",
    "department_id": "BGL-IT-D54",
    "access_code": "IT-31K-64P",
    "status": "active"
  },
  {
    "id": "dept-bgl-fin-7",
    "unit_id": "unit-bgl",
    "name": "Finance & Accounts",
    "short_code": "BGL-FIN",
    "department_id": "BGL-FIN-1C51",
    "access_code": "FIN-45K-93P",
    "status": "active"
  },
  {
    "id": "dept-bgl-gen-8",
    "unit_id": "unit-bgl",
    "name": "General",
    "short_code": "BGL-GEN",
    "department_id": "BGL-GEN-1CA6",
    "access_code": "GEN-68K-75P",
    "status": "active"
  },
  {
    "id": "dept-bgl-hrc-9",
    "unit_id": "unit-bgl",
    "name": "HR, Admin & Compliance",
    "short_code": "BGL-HRC",
    "department_id": "BGL-HRC-14F3",
    "access_code": "HRC-39K-95P",
    "status": "active"
  },
  {
    "id": "dept-bgl-mis-10",
    "unit_id": "unit-bgl",
    "name": "MIS & Internal Audit",
    "short_code": "BGL-MIS",
    "department_id": "BGL-MIS-97A",
    "access_code": "MIS-44K-40P",
    "status": "active"
  },
  {
    "id": "dept-bgl-prod-11",
    "unit_id": "unit-bgl",
    "name": "Production",
    "short_code": "BGL-PROD",
    "department_id": "BGL-PROD-120A",
    "access_code": "PROD-42K-67P",
    "status": "active"
  },
  {
    "id": "dept-bgl-ppc-12",
    "unit_id": "unit-bgl",
    "name": "Production Planning & control",
    "short_code": "BGL-PPC",
    "department_id": "BGL-PPC-1DB5",
    "access_code": "PPC-55K-70P",
    "status": "active"
  },
  {
    "id": "dept-bgl-qa-13",
    "unit_id": "unit-bgl",
    "name": "QA, Audit & Technical",
    "short_code": "BGL-QA",
    "department_id": "BGL-QA-1123",
    "access_code": "QA-81K-15P",
    "status": "active"
  },
  {
    "id": "dept-bgl-stw-14",
    "unit_id": "unit-bgl",
    "name": "Store & Warehouse",
    "short_code": "BGL-STW",
    "department_id": "BGL-STW-744",
    "access_code": "STW-62K-24P",
    "status": "active"
  },
  {
    "id": "dept-bgl-tech-15",
    "unit_id": "unit-bgl",
    "name": "Technical",
    "short_code": "BGL-TECH",
    "department_id": "BGL-TECH-2528",
    "access_code": "TECH-91K-87P",
    "status": "active"
  },
  {
    "id": "dept-mgl-eng-16",
    "unit_id": "unit-mgl",
    "name": "Engineering & Services",
    "short_code": "MGL-ENG",
    "department_id": "MGL-ENG-1759",
    "access_code": "ENG-33K-71P",
    "status": "active"
  },
  {
    "id": "dept-mgl-hra-17",
    "unit_id": "unit-mgl",
    "name": "HR & Admin",
    "short_code": "MGL-HRA",
    "department_id": "MGL-HRA-1775",
    "access_code": "HRA-48K-96P",
    "status": "active"
  },
  {
    "id": "dept-mgl-ie-m1",
    "unit_id": "unit-mgl",
    "name": "Industrial Engineering",
    "short_code": "MGL-IE",
    "department_id": "MGL-IE-1102",
    "access_code": "IE-88K-12P",
    "status": "active"
  },
  {
    "id": "dept-mgl-prod-m2",
    "unit_id": "unit-mgl",
    "name": "Production",
    "short_code": "MGL-PROD",
    "department_id": "MGL-PROD-1205",
    "access_code": "PROD-77K-23P",
    "status": "active"
  },
  {
    "id": "dept-mgl-ppc-m3",
    "unit_id": "unit-mgl",
    "name": "Production Planning & control",
    "short_code": "MGL-PPC",
    "department_id": "MGL-PPC-1308",
    "access_code": "PPC-44K-81P",
    "status": "active"
  },
  {
    "id": "dept-mgl-qa-m4",
    "unit_id": "unit-mgl",
    "name": "QA, Audit & Technical",
    "short_code": "MGL-QA",
    "department_id": "MGL-QA-1411",
    "access_code": "QA-99K-34P",
    "status": "active"
  },
  {
    "id": "dept-mgl-cad-m5",
    "unit_id": "unit-mgl",
    "name": "CAD & Sample",
    "short_code": "MGL-CAD",
    "department_id": "MGL-CAD-1514",
    "access_code": "CAD-66K-45P",
    "status": "active"
  },
  {
    "id": "dept-mgl-com-m6",
    "unit_id": "unit-mgl",
    "name": "Commercial",
    "short_code": "MGL-COM",
    "department_id": "MGL-COM-1617",
    "access_code": "COM-55K-56P",
    "status": "active"
  },
  {
    "id": "dept-mgl-it-m7",
    "unit_id": "unit-mgl",
    "name": "ERP & IT",
    "short_code": "MGL-IT",
    "department_id": "MGL-IT-1720",
    "access_code": "IT-33K-67P",
    "status": "active"
  },
  {
    "id": "dept-mgl-fin-m8",
    "unit_id": "unit-mgl",
    "name": "Finance & Accounts",
    "short_code": "MGL-FIN",
    "department_id": "MGL-FIN-1823",
    "access_code": "FIN-22K-78P",
    "status": "active"
  },
  {
    "id": "dept-mgl-stw-m9",
    "unit_id": "unit-mgl",
    "name": "Store & Warehouse",
    "short_code": "MGL-STW",
    "department_id": "MGL-STW-1926",
    "access_code": "STW-11K-89P",
    "status": "active"
  },
  {
    "id": "dept-mgl-gen-m10",
    "unit_id": "unit-mgl",
    "name": "General",
    "short_code": "MGL-GEN",
    "department_id": "MGL-GEN-2029",
    "access_code": "GEN-99K-90P",
    "status": "active"
  },
  {
    "id": "dept-rhl-cad-18",
    "unit_id": "unit-rhl",
    "name": "CAD & Sample",
    "short_code": "RHL-CAD",
    "department_id": "RHL-CAD-1529",
    "access_code": "CAD-21K-15P",
    "status": "active"
  },
  {
    "id": "dept-rhl-com-19",
    "unit_id": "unit-rhl",
    "name": "Commercial",
    "short_code": "RHL-COM",
    "department_id": "RHL-COM-1EEE",
    "access_code": "COM-30K-19P",
    "status": "active"
  },
  {
    "id": "dept-rhl-hra-20",
    "unit_id": "unit-rhl",
    "name": "HR & Admin",
    "short_code": "RHL-HRA",
    "department_id": "RHL-HRA-1A1B",
    "access_code": "HRA-56K-36P",
    "status": "active"
  },
  {
    "id": "dept-rhl-prod-21",
    "unit_id": "unit-rhl",
    "name": "Production",
    "short_code": "RHL-PROD",
    "department_id": "RHL-PROD-2698",
    "access_code": "PROD-68K-66P",
    "status": "active"
  },
  {
    "id": "dept-rhl-ppc-22",
    "unit_id": "unit-rhl",
    "name": "Production Planning & control",
    "short_code": "RHL-PPC",
    "department_id": "RHL-PPC-7A5",
    "access_code": "PPC-90K-25P",
    "status": "active"
  },
  {
    "id": "dept-rhl-eng-23",
    "unit_id": "unit-rhl",
    "name": "Engineering & Services",
    "short_code": "RHL-ENG",
    "department_id": "RHL-ENG-7A2",
    "access_code": "ENG-49K-14P",
    "status": "active"
  },
  {
    "id": "dept-rhl-it-24",
    "unit_id": "unit-rhl",
    "name": "ERP & IT",
    "short_code": "RHL-IT",
    "department_id": "RHL-IT-B80",
    "access_code": "IT-39K-30P",
    "status": "active"
  },
  {
    "id": "dept-rhl-fin-25",
    "unit_id": "unit-rhl",
    "name": "Finance & Accounts",
    "short_code": "RHL-FIN",
    "department_id": "RHL-FIN-13DC",
    "access_code": "FIN-95K-42P",
    "status": "active"
  },
  {
    "id": "dept-rhl-gen-26",
    "unit_id": "unit-rhl",
    "name": "General",
    "short_code": "RHL-GEN",
    "department_id": "RHL-GEN-D55",
    "access_code": "GEN-90K-51P",
    "status": "active"
  },
  {
    "id": "dept-rhl-hrc-27",
    "unit_id": "unit-rhl",
    "name": "HR, Admin & Compliance",
    "short_code": "RHL-HRC",
    "department_id": "RHL-HRC-CA1",
    "access_code": "HRC-87K-21P",
    "status": "active"
  },
  {
    "id": "dept-rhl-ie-28",
    "unit_id": "unit-rhl",
    "name": "Industrial Engineering",
    "short_code": "RHL-IE",
    "department_id": "RHL-IE-21C1",
    "access_code": "IE-13K-68P",
    "status": "active"
  },
  {
    "id": "dept-rhl-mis-29",
    "unit_id": "unit-rhl",
    "name": "MIS & Internal Audit",
    "short_code": "RHL-MIS",
    "department_id": "RHL-MIS-14BE",
    "access_code": "MIS-19K-66P",
    "status": "active"
  },
  {
    "id": "dept-rhl-qa-30",
    "unit_id": "unit-rhl",
    "name": "QA, Audit & Technical",
    "short_code": "RHL-QA",
    "department_id": "RHL-QA-936",
    "access_code": "QA-89K-41P",
    "status": "active"
  },
  {
    "id": "dept-rhl-stw-31",
    "unit_id": "unit-rhl",
    "name": "Store & Warehouse",
    "short_code": "RHL-STW",
    "department_id": "RHL-STW-B75",
    "access_code": "STW-57K-17P",
    "status": "active"
  },
  {
    "id": "dept-rhl-wash-32",
    "unit_id": "unit-rhl",
    "name": "Washing",
    "short_code": "RHL-WASH",
    "department_id": "RHL-WASH-2597",
    "access_code": "WASH-24K-36P",
    "status": "active"
  },
  {
    "id": "dept-srsl-dpd-33",
    "unit_id": "unit-srsl",
    "name": "Design & Product Development",
    "short_code": "SRSL-DPD",
    "department_id": "SRSL-DPD-1741",
    "access_code": "DPD-90K-38P",
    "status": "active"
  },
  {
    "id": "dept-srsl-fin-34",
    "unit_id": "unit-srsl",
    "name": "Finance & Accounts",
    "short_code": "SRSL-FIN",
    "department_id": "SRSL-FIN-92B",
    "access_code": "FIN-86K-90P",
    "status": "active"
  },
  {
    "id": "dept-srsl-gen-35",
    "unit_id": "unit-srsl",
    "name": "General",
    "short_code": "SRSL-GEN",
    "department_id": "SRSL-GEN-2646",
    "access_code": "GEN-69K-10P",
    "status": "active"
  },
  {
    "id": "dept-srsl-ie-s1",
    "unit_id": "unit-srsl",
    "name": "Industrial Engineering",
    "short_code": "SRSL-IE",
    "department_id": "SRSL-IE-2101",
    "access_code": "IE-91K-22P",
    "status": "active"
  },
  {
    "id": "dept-srsl-prod-s2",
    "unit_id": "unit-srsl",
    "name": "Production",
    "short_code": "SRSL-PROD",
    "department_id": "SRSL-PROD-2202",
    "access_code": "PROD-82K-33P",
    "status": "active"
  },
  {
    "id": "dept-srsl-qa-s3",
    "unit_id": "unit-srsl",
    "name": "QA, Audit & Technical",
    "short_code": "SRSL-QA",
    "department_id": "SRSL-QA-2303",
    "access_code": "QA-73K-44P",
    "status": "active"
  },
  {
    "id": "dept-srsl-hra-s4",
    "unit_id": "unit-srsl",
    "name": "HR & Admin",
    "short_code": "SRSL-HRA",
    "department_id": "SRSL-HRA-2404",
    "access_code": "HRA-64K-55P",
    "status": "active"
  },
  {
    "id": "dept-srsl-ppc-s5",
    "unit_id": "unit-srsl",
    "name": "Production Planning & control",
    "short_code": "SRSL-PPC",
    "department_id": "SRSL-PPC-2505",
    "access_code": "PPC-55K-66P",
    "status": "active"
  },
  {
    "id": "dept-srsl-eng-s6",
    "unit_id": "unit-srsl",
    "name": "Engineering & Services",
    "short_code": "SRSL-ENG",
    "department_id": "SRSL-ENG-2606",
    "access_code": "ENG-46K-77P",
    "status": "active"
  },
  {
    "id": "dept-srsl-it-s7",
    "unit_id": "unit-srsl",
    "name": "ERP & IT",
    "short_code": "SRSL-IT",
    "department_id": "SRSL-IT-2707",
    "access_code": "IT-37K-88P",
    "status": "active"
  },
  {
    "id": "dept-srsl-stw-s8",
    "unit_id": "unit-srsl",
    "name": "Store & Warehouse",
    "short_code": "SRSL-STW",
    "department_id": "SRSL-STW-2808",
    "access_code": "STW-28K-99P",
    "status": "active"
  },
  {
    "id": "dept-tal-cad-36",
    "unit_id": "unit-tal",
    "name": "CAD & Sample",
    "short_code": "TAL-CAD",
    "department_id": "TAL-CAD-A46",
    "access_code": "CAD-74K-12P",
    "status": "active"
  },
  {
    "id": "dept-tal-com-37",
    "unit_id": "unit-tal",
    "name": "Commercial",
    "short_code": "TAL-COM",
    "department_id": "TAL-COM-24A7",
    "access_code": "COM-19K-91P",
    "status": "active"
  },
  {
    "id": "dept-tal-dpd-38",
    "unit_id": "unit-tal",
    "name": "Design & Product Development",
    "short_code": "TAL-DPD",
    "department_id": "TAL-DPD-13A6",
    "access_code": "DPD-66K-32P",
    "status": "active"
  },
  {
    "id": "dept-tal-eng-39",
    "unit_id": "unit-tal",
    "name": "Engineering & Services",
    "short_code": "TAL-ENG",
    "department_id": "TAL-ENG-425",
    "access_code": "ENG-28K-34P",
    "status": "active"
  },
  {
    "id": "dept-tal-it-40",
    "unit_id": "unit-tal",
    "name": "ERP & IT",
    "short_code": "TAL-IT",
    "department_id": "TAL-IT-3EB",
    "access_code": "IT-79K-67P",
    "status": "active"
  },
  {
    "id": "dept-tal-esg-41",
    "unit_id": "unit-tal",
    "name": "ESG",
    "short_code": "TAL-ESG",
    "department_id": "TAL-ESG-24C7",
    "access_code": "ESG-37K-12P",
    "status": "active"
  },
  {
    "id": "dept-tal-fin-42",
    "unit_id": "unit-tal",
    "name": "Finance & Accounts",
    "short_code": "TAL-FIN",
    "department_id": "TAL-FIN-235F",
    "access_code": "FIN-76K-42P",
    "status": "active"
  },
  {
    "id": "dept-tal-gen-43",
    "unit_id": "unit-tal",
    "name": "General",
    "short_code": "TAL-GEN",
    "department_id": "TAL-GEN-22A4",
    "access_code": "GEN-36K-16P",
    "status": "active"
  },
  {
    "id": "dept-tal-hra-44",
    "unit_id": "unit-tal",
    "name": "HR & Admin",
    "short_code": "TAL-HRA",
    "department_id": "TAL-HRA-1FF7",
    "access_code": "HRA-93K-55P",
    "status": "active"
  },
  {
    "id": "dept-tal-hrc-45",
    "unit_id": "unit-tal",
    "name": "HR, Admin & Compliance",
    "short_code": "TAL-HRC",
    "department_id": "TAL-HRC-24A9",
    "access_code": "HRC-86K-52P",
    "status": "active"
  },
  {
    "id": "dept-tal-ie-46",
    "unit_id": "unit-tal",
    "name": "Industrial Engineering",
    "short_code": "TAL-IE",
    "department_id": "TAL-IE-899",
    "access_code": "IE-80K-82P",
    "status": "active"
  },
  {
    "id": "dept-tal-mm-47",
    "unit_id": "unit-tal",
    "name": "Marketing & Merchandising",
    "short_code": "TAL-MM",
    "department_id": "TAL-MM-1A38",
    "access_code": "MM-47K-86P",
    "status": "active"
  },
  {
    "id": "dept-tal-mis-48",
    "unit_id": "unit-tal",
    "name": "MIS & Internal Audit",
    "short_code": "TAL-MIS",
    "department_id": "TAL-MIS-6A7",
    "access_code": "MIS-25K-37P",
    "status": "active"
  },
  {
    "id": "dept-tal-prod-49",
    "unit_id": "unit-tal",
    "name": "Production",
    "short_code": "TAL-PROD",
    "department_id": "TAL-PROD-745",
    "access_code": "PROD-84K-17P",
    "status": "active"
  },
  {
    "id": "dept-tal-ppc-50",
    "unit_id": "unit-tal",
    "name": "Production Planning & control",
    "short_code": "TAL-PPC",
    "department_id": "TAL-PPC-7F7",
    "access_code": "PPC-61K-53P",
    "status": "active"
  },
  {
    "id": "dept-tal-qa-51",
    "unit_id": "unit-tal",
    "name": "QA, Audit & Technical",
    "short_code": "TAL-QA",
    "department_id": "TAL-QA-14FE",
    "access_code": "QA-26K-44P",
    "status": "active"
  },
  {
    "id": "dept-tal-stw-52",
    "unit_id": "unit-tal",
    "name": "Store & Warehouse",
    "short_code": "TAL-STW",
    "department_id": "TAL-STW-1F94",
    "access_code": "STW-45K-27P",
    "status": "active"
  },
  {
    "id": "dept-tal-scm-53",
    "unit_id": "unit-tal",
    "name": "Supply Chain",
    "short_code": "TAL-SCM",
    "department_id": "TAL-SCM-265A",
    "access_code": "SCM-16K-22P",
    "status": "active"
  },
  {
    "id": "dept-tal-ie2-54",
    "unit_id": "unit-tal",
    "name": "IE",
    "short_code": "TAL-IE2",
    "department_id": "TAL-IE2-2627",
    "access_code": "IE2-80K-29P",
    "status": "active"
  },
  {
    "id": "dept-tal-tech-55",
    "unit_id": "unit-tal",
    "name": "Technical",
    "short_code": "TAL-TECH",
    "department_id": "TAL-TECH-75C",
    "access_code": "TECH-92K-12P",
    "status": "active"
  },
  {
    "id": "dept-tal-wash-56",
    "unit_id": "unit-tal",
    "name": "Washing",
    "short_code": "TAL-WASH",
    "department_id": "TAL-WASH-1770",
    "access_code": "WASH-93K-94P",
    "status": "active"
  }
];

export const INITIAL_SECTIONS: Omit<Section, 'created_at'>[] = [
  {
    "id": "sec-bgl-1",
    "department_id": "dept-bgl-hra-1",
    "name": "Admin"
  },
  {
    "id": "sec-bgl-2",
    "department_id": "dept-bgl-ie-2",
    "name": "IE"
  },
  {
    "id": "sec-bgl-3",
    "department_id": "dept-bgl-cad-3",
    "name": "CAD"
  },
  {
    "id": "sec-bgl-4",
    "department_id": "dept-bgl-com-4",
    "name": "Commercial"
  },
  {
    "id": "sec-bgl-5",
    "department_id": "dept-bgl-eng-5",
    "name": "Maintenance"
  },
  {
    "id": "sec-bgl-6",
    "department_id": "dept-bgl-eng-5",
    "name": "Utility & Engineering"
  },
  {
    "id": "sec-bgl-7",
    "department_id": "dept-bgl-it-6",
    "name": "IT"
  },
  {
    "id": "sec-bgl-8",
    "department_id": "dept-bgl-fin-7",
    "name": "Finance & Accounts"
  },
  {
    "id": "sec-bgl-9",
    "department_id": "dept-bgl-gen-8",
    "name": "General"
  },
  {
    "id": "sec-bgl-10",
    "department_id": "dept-bgl-hrc-9",
    "name": "HR"
  },
  {
    "id": "sec-bgl-11",
    "department_id": "dept-bgl-hrc-9",
    "name": "HR, Admin & Compliance"
  },
  {
    "id": "sec-bgl-12",
    "department_id": "dept-bgl-hrc-9",
    "name": "Admin"
  },
  {
    "id": "sec-bgl-13",
    "department_id": "dept-bgl-mis-10",
    "name": "MIS & Internal Audit"
  },
  {
    "id": "sec-bgl-14",
    "department_id": "dept-bgl-prod-11",
    "name": "Cutting"
  },
  {
    "id": "sec-bgl-15",
    "department_id": "dept-bgl-prod-11",
    "name": "Production"
  },
  {
    "id": "sec-bgl-16",
    "department_id": "dept-bgl-prod-11",
    "name": "Finishing"
  },
  {
    "id": "sec-bgl-17",
    "department_id": "dept-bgl-prod-11",
    "name": "Technical"
  },
  {
    "id": "sec-bgl-18",
    "department_id": "dept-bgl-prod-11",
    "name": "Sewing"
  },
  {
    "id": "sec-bgl-19",
    "department_id": "dept-bgl-prod-11",
    "name": "Printing"
  },
  {
    "id": "sec-bgl-20",
    "department_id": "dept-bgl-ppc-12",
    "name": "Planning"
  },
  {
    "id": "sec-bgl-21",
    "department_id": "dept-bgl-qa-13",
    "name": "Quality"
  },
  {
    "id": "sec-bgl-22",
    "department_id": "dept-bgl-stw-14",
    "name": "Store"
  },
  {
    "id": "sec-bgl-23",
    "department_id": "dept-bgl-stw-14",
    "name": "Warehouse"
  },
  {
    "id": "sec-bgl-24",
    "department_id": "dept-bgl-tech-15",
    "name": "Technical"
  },
  {
    "id": "sec-mgl-25",
    "department_id": "dept-mgl-eng-16",
    "name": "Utility & Engineering"
  },
  {
    "id": "sec-mgl-26",
    "department_id": "dept-mgl-hra-17",
    "name": "Admin"
  },
  {
    "id": "sec-mgl-27",
    "department_id": "dept-mgl-hra-17",
    "name": "HR"
  },
  {
    "id": "sec-mgl-28",
    "department_id": "dept-mgl-ie-m1",
    "name": "Work Study & Line Balancing"
  },
  {
    "id": "sec-mgl-29",
    "department_id": "dept-mgl-prod-m2",
    "name": "Sewing Floor"
  },
  {
    "id": "sec-mgl-30",
    "department_id": "dept-mgl-ppc-m3",
    "name": "Production Planning"
  },
  {
    "id": "sec-mgl-31",
    "department_id": "dept-mgl-qa-m4",
    "name": "Quality Audit & Inspection"
  },
  {
    "id": "sec-mgl-32",
    "department_id": "dept-mgl-cad-m5",
    "name": "Pattern & Sample"
  },
  {
    "id": "sec-mgl-33",
    "department_id": "dept-mgl-com-m6",
    "name": "Import & Export"
  },
  {
    "id": "sec-mgl-34",
    "department_id": "dept-mgl-it-m7",
    "name": "ERP & Network"
  },
  {
    "id": "sec-mgl-35",
    "department_id": "dept-mgl-fin-m8",
    "name": "Accounts & Costing"
  },
  {
    "id": "sec-mgl-36",
    "department_id": "dept-mgl-stw-m9",
    "name": "Materials & Store"
  },
  {
    "id": "sec-mgl-37",
    "department_id": "dept-mgl-gen-m10",
    "name": "General Admin"
  },
  {
    "id": "sec-srsl-56",
    "department_id": "dept-srsl-ie-s1",
    "name": "IE Optimization"
  },
  {
    "id": "sec-srsl-57",
    "department_id": "dept-srsl-prod-s2",
    "name": "Manufacturing Floor"
  },
  {
    "id": "sec-srsl-58",
    "department_id": "dept-srsl-qa-s3",
    "name": "Quality & Technical Audit"
  },
  {
    "id": "sec-srsl-59",
    "department_id": "dept-srsl-hra-s4",
    "name": "HR & Welfare"
  },
  {
    "id": "sec-srsl-60",
    "department_id": "dept-srsl-ppc-s5",
    "name": "Capacity & Planning"
  },
  {
    "id": "sec-srsl-61",
    "department_id": "dept-srsl-eng-s6",
    "name": "Engineering Maintenance"
  },
  {
    "id": "sec-srsl-62",
    "department_id": "dept-srsl-it-s7",
    "name": "ERP Systems"
  },
  {
    "id": "sec-srsl-63",
    "department_id": "dept-srsl-stw-s8",
    "name": "Central Store"
  },
  {
    "id": "sec-rhl-28",
    "department_id": "dept-rhl-cad-18",
    "name": "General"
  },
  {
    "id": "sec-rhl-29",
    "department_id": "dept-rhl-cad-18",
    "name": "Sample"
  },
  {
    "id": "sec-rhl-30",
    "department_id": "dept-rhl-cad-18",
    "name": "CAD"
  },
  {
    "id": "sec-rhl-31",
    "department_id": "dept-rhl-com-19",
    "name": "Commercial"
  },
  {
    "id": "sec-rhl-32",
    "department_id": "dept-rhl-hra-20",
    "name": "Admin"
  },
  {
    "id": "sec-rhl-33",
    "department_id": "dept-rhl-prod-21",
    "name": "Production"
  },
  {
    "id": "sec-rhl-34",
    "department_id": "dept-rhl-prod-21",
    "name": "Sewing"
  },
  {
    "id": "sec-rhl-35",
    "department_id": "dept-rhl-prod-21",
    "name": "Finishing"
  },
  {
    "id": "sec-rhl-36",
    "department_id": "dept-rhl-prod-21",
    "name": "Cutting"
  },
  {
    "id": "sec-rhl-37",
    "department_id": "dept-rhl-ppc-22",
    "name": "Planning"
  },
  {
    "id": "sec-rhl-38",
    "department_id": "dept-rhl-ppc-22",
    "name": "Planning & Coordination"
  },
  {
    "id": "sec-rhl-39",
    "department_id": "dept-rhl-eng-23",
    "name": "Maintenance"
  },
  {
    "id": "sec-rhl-40",
    "department_id": "dept-rhl-eng-23",
    "name": "Utility & Engineering"
  },
  {
    "id": "sec-rhl-41",
    "department_id": "dept-rhl-it-24",
    "name": "IT"
  },
  {
    "id": "sec-rhl-42",
    "department_id": "dept-rhl-fin-25",
    "name": "Finance & Accounts"
  },
  {
    "id": "sec-rhl-43",
    "department_id": "dept-rhl-gen-26",
    "name": "General"
  },
  {
    "id": "sec-rhl-44",
    "department_id": "dept-rhl-hrc-27",
    "name": "HR, Admin & Compliance"
  },
  {
    "id": "sec-rhl-45",
    "department_id": "dept-rhl-hrc-27",
    "name": "HR"
  },
  {
    "id": "sec-rhl-46",
    "department_id": "dept-rhl-hrc-27",
    "name": "Sustainability"
  },
  {
    "id": "sec-rhl-47",
    "department_id": "dept-rhl-ie-28",
    "name": "IE"
  },
  {
    "id": "sec-rhl-48",
    "department_id": "dept-rhl-mis-29",
    "name": "MIS & Internal Audit"
  },
  {
    "id": "sec-rhl-49",
    "department_id": "dept-rhl-qa-30",
    "name": "Quality"
  },
  {
    "id": "sec-rhl-50",
    "department_id": "dept-rhl-stw-31",
    "name": "Store & Warehouse"
  },
  {
    "id": "sec-rhl-51",
    "department_id": "dept-rhl-wash-32",
    "name": "Washing"
  },
  {
    "id": "sec-srsl-52",
    "department_id": "dept-srsl-dpd-33",
    "name": "Design & Product Development"
  },
  {
    "id": "sec-srsl-53",
    "department_id": "dept-srsl-dpd-33",
    "name": "Development"
  },
  {
    "id": "sec-srsl-54",
    "department_id": "dept-srsl-fin-34",
    "name": "Finance"
  },
  {
    "id": "sec-srsl-55",
    "department_id": "dept-srsl-gen-35",
    "name": "General Admin"
  },
  {
    "id": "sec-tal-56",
    "department_id": "dept-tal-cad-36",
    "name": "CAD"
  },
  {
    "id": "sec-tal-57",
    "department_id": "dept-tal-cad-36",
    "name": "Sample"
  },
  {
    "id": "sec-tal-58",
    "department_id": "dept-tal-cad-36",
    "name": "CAD & Sample"
  },
  {
    "id": "sec-tal-59",
    "department_id": "dept-tal-com-37",
    "name": "Commercial"
  },
  {
    "id": "sec-tal-60",
    "department_id": "dept-tal-dpd-38",
    "name": "Store"
  },
  {
    "id": "sec-tal-61",
    "department_id": "dept-tal-dpd-38",
    "name": "Design & Product Development"
  },
  {
    "id": "sec-tal-62",
    "department_id": "dept-tal-eng-39",
    "name": "Maintenance"
  },
  {
    "id": "sec-tal-63",
    "department_id": "dept-tal-eng-39",
    "name": "Utility & Engineering"
  },
  {
    "id": "sec-tal-64",
    "department_id": "dept-tal-eng-39",
    "name": "Civil"
  },
  {
    "id": "sec-tal-65",
    "department_id": "dept-tal-it-40",
    "name": "General"
  },
  {
    "id": "sec-tal-66",
    "department_id": "dept-tal-it-40",
    "name": "ERP"
  },
  {
    "id": "sec-tal-67",
    "department_id": "dept-tal-it-40",
    "name": "IT"
  },
  {
    "id": "sec-tal-68",
    "department_id": "dept-tal-esg-41",
    "name": "Social"
  },
  {
    "id": "sec-tal-69",
    "department_id": "dept-tal-esg-41",
    "name": "EMS"
  },
  {
    "id": "sec-tal-70",
    "department_id": "dept-tal-fin-42",
    "name": "Finance & Accounts"
  },
  {
    "id": "sec-tal-71",
    "department_id": "dept-tal-fin-42",
    "name": "Finance"
  },
  {
    "id": "sec-tal-72",
    "department_id": "dept-tal-gen-43",
    "name": "General Admin"
  },
  {
    "id": "sec-tal-73",
    "department_id": "dept-tal-gen-43",
    "name": "General"
  },
  {
    "id": "sec-tal-74",
    "department_id": "dept-tal-hra-44",
    "name": "HR"
  },
  {
    "id": "sec-tal-75",
    "department_id": "dept-tal-hra-44",
    "name": "Admin"
  },
  {
    "id": "sec-tal-76",
    "department_id": "dept-tal-hra-44",
    "name": "General"
  },
  {
    "id": "sec-tal-77",
    "department_id": "dept-tal-hrc-45",
    "name": "Admin"
  },
  {
    "id": "sec-tal-78",
    "department_id": "dept-tal-hrc-45",
    "name": "HR"
  },
  {
    "id": "sec-tal-79",
    "department_id": "dept-tal-hrc-45",
    "name": "HR & Compliance"
  },
  {
    "id": "sec-tal-80",
    "department_id": "dept-tal-hrc-45",
    "name": "HR, Admin & Compliance"
  },
  {
    "id": "sec-tal-81",
    "department_id": "dept-tal-hrc-45",
    "name": "Sustainability"
  },
  {
    "id": "sec-tal-82",
    "department_id": "dept-tal-hrc-45",
    "name": "Compliance"
  },
  {
    "id": "sec-tal-83",
    "department_id": "dept-tal-ie-46",
    "name": "IE"
  },
  {
    "id": "sec-tal-84",
    "department_id": "dept-tal-ie-46",
    "name": "Technical"
  },
  {
    "id": "sec-tal-85",
    "department_id": "dept-tal-mm-47",
    "name": "Merchandising"
  },
  {
    "id": "sec-tal-86",
    "department_id": "dept-tal-mis-48",
    "name": "MIS & Internal Audit"
  },
  {
    "id": "sec-tal-87",
    "department_id": "dept-tal-prod-49",
    "name": "Production"
  },
  {
    "id": "sec-tal-88",
    "department_id": "dept-tal-prod-49",
    "name": "Cutting"
  },
  {
    "id": "sec-tal-89",
    "department_id": "dept-tal-prod-49",
    "name": "Finishing"
  },
  {
    "id": "sec-tal-90",
    "department_id": "dept-tal-prod-49",
    "name": "Sample"
  },
  {
    "id": "sec-tal-91",
    "department_id": "dept-tal-prod-49",
    "name": "Sewing"
  },
  {
    "id": "sec-tal-92",
    "department_id": "dept-tal-prod-49",
    "name": "Embroidery"
  },
  {
    "id": "sec-tal-93",
    "department_id": "dept-tal-prod-49",
    "name": "Warehouse"
  },
  {
    "id": "sec-tal-94",
    "department_id": "dept-tal-prod-49",
    "name": "Wet Process"
  },
  {
    "id": "sec-tal-95",
    "department_id": "dept-tal-ppc-50",
    "name": "Planning & Coordination"
  },
  {
    "id": "sec-tal-96",
    "department_id": "dept-tal-ppc-50",
    "name": "Planning"
  },
  {
    "id": "sec-tal-97",
    "department_id": "dept-tal-qa-51",
    "name": "Quality"
  },
  {
    "id": "sec-tal-98",
    "department_id": "dept-tal-qa-51",
    "name": "Sewing"
  },
  {
    "id": "sec-tal-99",
    "department_id": "dept-tal-qa-51",
    "name": "Finishing"
  },
  {
    "id": "sec-tal-100",
    "department_id": "dept-tal-qa-51",
    "name": "Raw Material"
  },
  {
    "id": "sec-tal-101",
    "department_id": "dept-tal-qa-51",
    "name": "Laboratory"
  },
  {
    "id": "sec-tal-102",
    "department_id": "dept-tal-stw-52",
    "name": "Store"
  },
  {
    "id": "sec-tal-103",
    "department_id": "dept-tal-stw-52",
    "name": "Warehouse"
  },
  {
    "id": "sec-tal-104",
    "department_id": "dept-tal-stw-52",
    "name": "Store & Warehouse"
  },
  {
    "id": "sec-tal-105",
    "department_id": "dept-tal-scm-53",
    "name": "Supply Chain"
  },
  {
    "id": "sec-tal-106",
    "department_id": "dept-tal-ie2-54",
    "name": "IE"
  },
  {
    "id": "sec-tal-107",
    "department_id": "dept-tal-tech-55",
    "name": "Technical"
  },
  {
    "id": "sec-tal-108",
    "department_id": "dept-tal-wash-56",
    "name": "Washing"
  },
  {
    "id": "sec-tal-109",
    "department_id": "dept-tal-wash-56",
    "name": "Wet Process"
  },
  {
    "id": "sec-tal-110",
    "department_id": "dept-tal-wash-56",
    "name": "R&D"
  },
  {
    "id": "sec-tal-111",
    "department_id": "dept-tal-wash-56",
    "name": "Dry Process"
  }
];

export const INITIAL_SUBSECTIONS: Omit<Subsection, 'created_at'>[] = [
  {
    "id": "sub-bgl-1",
    "section_id": "sec-bgl-1",
    "name": "Transportation Management"
  },
  {
    "id": "sub-bgl-2",
    "section_id": "sec-bgl-2",
    "name": "IE"
  },
  {
    "id": "sub-bgl-3",
    "section_id": "sec-bgl-3",
    "name": "CAD"
  },
  {
    "id": "sub-bgl-4",
    "section_id": "sec-bgl-4",
    "name": "Export"
  },
  {
    "id": "sub-bgl-5",
    "section_id": "sec-bgl-5",
    "name": "Maintenance"
  },
  {
    "id": "sub-bgl-6",
    "section_id": "sec-bgl-6",
    "name": "Utility"
  },
  {
    "id": "sub-bgl-7",
    "section_id": "sec-bgl-7",
    "name": "IT"
  },
  {
    "id": "sub-bgl-8",
    "section_id": "sec-bgl-8",
    "name": "Accounts"
  },
  {
    "id": "sub-bgl-9",
    "section_id": "sec-bgl-9",
    "name": "General"
  },
  {
    "id": "sub-bgl-10",
    "section_id": "sec-bgl-10",
    "name": "Payroll"
  },
  {
    "id": "sub-bgl-11",
    "section_id": "sec-bgl-10",
    "name": "HR"
  },
  {
    "id": "sub-bgl-12",
    "section_id": "sec-bgl-11",
    "name": "General"
  },
  {
    "id": "sub-bgl-13",
    "section_id": "sec-bgl-11",
    "name": "HR"
  },
  {
    "id": "sub-bgl-14",
    "section_id": "sec-bgl-11",
    "name": "Compliance"
  },
  {
    "id": "sub-bgl-15",
    "section_id": "sec-bgl-12",
    "name": "Admin"
  },
  {
    "id": "sub-bgl-16",
    "section_id": "sec-bgl-13",
    "name": "Internal Audit"
  },
  {
    "id": "sub-bgl-17",
    "section_id": "sec-bgl-14",
    "name": "Cutting"
  },
  {
    "id": "sub-bgl-18",
    "section_id": "sec-bgl-14",
    "name": "General"
  },
  {
    "id": "sub-bgl-19",
    "section_id": "sec-bgl-15",
    "name": "Sewing"
  },
  {
    "id": "sub-bgl-20",
    "section_id": "sec-bgl-15",
    "name": "Finishing"
  },
  {
    "id": "sub-bgl-21",
    "section_id": "sec-bgl-15",
    "name": "Cutting"
  },
  {
    "id": "sub-bgl-22",
    "section_id": "sec-bgl-15",
    "name": "Production"
  },
  {
    "id": "sub-bgl-23",
    "section_id": "sec-bgl-16",
    "name": "Finishing"
  },
  {
    "id": "sub-bgl-24",
    "section_id": "sec-bgl-17",
    "name": "Technical"
  },
  {
    "id": "sub-bgl-25",
    "section_id": "sec-bgl-18",
    "name": "Sewing"
  },
  {
    "id": "sub-bgl-26",
    "section_id": "sec-bgl-18",
    "name": "Technical"
  },
  {
    "id": "sub-bgl-27",
    "section_id": "sec-bgl-19",
    "name": "Printing"
  },
  {
    "id": "sub-bgl-28",
    "section_id": "sec-bgl-20",
    "name": "Planning & Controll"
  },
  {
    "id": "sub-bgl-29",
    "section_id": "sec-bgl-21",
    "name": "Quality"
  },
  {
    "id": "sub-bgl-30",
    "section_id": "sec-bgl-21",
    "name": "GPQ"
  },
  {
    "id": "sub-bgl-31",
    "section_id": "sec-bgl-21",
    "name": "Sewing"
  },
  {
    "id": "sub-bgl-32",
    "section_id": "sec-bgl-22",
    "name": "Store"
  },
  {
    "id": "sub-bgl-33",
    "section_id": "sec-bgl-23",
    "name": "Warehouse"
  },
  {
    "id": "sub-bgl-34",
    "section_id": "sec-bgl-24",
    "name": "Technical"
  },
  {
    "id": "sub-mgl-35",
    "section_id": "sec-mgl-25",
    "name": "Utility"
  },
  {
    "id": "sub-mgl-36",
    "section_id": "sec-mgl-26",
    "name": "Cafeteria & House Keeping Management"
  },
  {
    "id": "sub-mgl-37",
    "section_id": "sec-mgl-26",
    "name": "Safety, Security & Emergency Management"
  },
  {
    "id": "sub-mgl-38",
    "section_id": "sec-mgl-26",
    "name": "Transportation Management"
  },
  {
    "id": "sub-mgl-39",
    "section_id": "sec-mgl-27",
    "name": "Compensation , Benefits & HR Analytics"
  },
  {
    "id": "sub-rhl-40",
    "section_id": "sec-rhl-28",
    "name": "General"
  },
  {
    "id": "sub-rhl-41",
    "section_id": "sec-rhl-29",
    "name": "Sample"
  },
  {
    "id": "sub-rhl-42",
    "section_id": "sec-rhl-30",
    "name": "CAD"
  },
  {
    "id": "sub-rhl-43",
    "section_id": "sec-rhl-31",
    "name": "Export"
  },
  {
    "id": "sub-rhl-44",
    "section_id": "sec-rhl-32",
    "name": "Transportation Management"
  },
  {
    "id": "sub-rhl-45",
    "section_id": "sec-rhl-33",
    "name": "Production"
  },
  {
    "id": "sub-rhl-46",
    "section_id": "sec-rhl-33",
    "name": "Cutting"
  },
  {
    "id": "sub-rhl-47",
    "section_id": "sec-rhl-34",
    "name": "Sewing"
  },
  {
    "id": "sub-rhl-48",
    "section_id": "sec-rhl-35",
    "name": "Finishing"
  },
  {
    "id": "sub-rhl-49",
    "section_id": "sec-rhl-36",
    "name": "Cutting"
  },
  {
    "id": "sub-rhl-50",
    "section_id": "sec-rhl-37",
    "name": "Planning & Controll"
  },
  {
    "id": "sub-rhl-51",
    "section_id": "sec-rhl-38",
    "name": "Planning & Controll"
  },
  {
    "id": "sub-rhl-52",
    "section_id": "sec-rhl-39",
    "name": "Maintenance"
  },
  {
    "id": "sub-rhl-53",
    "section_id": "sec-rhl-40",
    "name": "Utility"
  },
  {
    "id": "sub-rhl-54",
    "section_id": "sec-rhl-41",
    "name": "IT"
  },
  {
    "id": "sub-rhl-55",
    "section_id": "sec-rhl-42",
    "name": "Accounts"
  },
  {
    "id": "sub-rhl-56",
    "section_id": "sec-rhl-43",
    "name": "General"
  },
  {
    "id": "sub-rhl-57",
    "section_id": "sec-rhl-44",
    "name": "HR"
  },
  {
    "id": "sub-rhl-58",
    "section_id": "sec-rhl-45",
    "name": "Payroll"
  },
  {
    "id": "sub-rhl-59",
    "section_id": "sec-rhl-46",
    "name": "Compliance"
  },
  {
    "id": "sub-rhl-60",
    "section_id": "sec-rhl-47",
    "name": "IE"
  },
  {
    "id": "sub-rhl-61",
    "section_id": "sec-rhl-47",
    "name": "Finishing"
  },
  {
    "id": "sub-rhl-62",
    "section_id": "sec-rhl-47",
    "name": "Sewing"
  },
  {
    "id": "sub-rhl-63",
    "section_id": "sec-rhl-48",
    "name": "Internal Audit"
  },
  {
    "id": "sub-rhl-64",
    "section_id": "sec-rhl-49",
    "name": "Quality"
  },
  {
    "id": "sub-rhl-65",
    "section_id": "sec-rhl-50",
    "name": "Store"
  },
  {
    "id": "sub-rhl-66",
    "section_id": "sec-rhl-51",
    "name": "Washing"
  },
  {
    "id": "sub-srsl-67",
    "section_id": "sec-srsl-52",
    "name": "Design"
  },
  {
    "id": "sub-srsl-68",
    "section_id": "sec-srsl-53",
    "name": "Development"
  },
  {
    "id": "sub-srsl-69",
    "section_id": "sec-srsl-54",
    "name": "Finance"
  },
  {
    "id": "sub-srsl-70",
    "section_id": "sec-srsl-55",
    "name": "General"
  },
  {
    "id": "sub-tal-71",
    "section_id": "sec-tal-56",
    "name": "CAD"
  },
  {
    "id": "sub-tal-72",
    "section_id": "sec-tal-56",
    "name": "3D"
  },
  {
    "id": "sub-tal-73",
    "section_id": "sec-tal-57",
    "name": "Sewing"
  },
  {
    "id": "sub-tal-74",
    "section_id": "sec-tal-57",
    "name": "Quality"
  },
  {
    "id": "sub-tal-75",
    "section_id": "sec-tal-57",
    "name": "Cutting"
  },
  {
    "id": "sub-tal-76",
    "section_id": "sec-tal-57",
    "name": "Sample"
  },
  {
    "id": "sub-tal-77",
    "section_id": "sec-tal-57",
    "name": "Finishing"
  },
  {
    "id": "sub-tal-78",
    "section_id": "sec-tal-57",
    "name": "Technical"
  },
  {
    "id": "sub-tal-79",
    "section_id": "sec-tal-58",
    "name": "Sample"
  },
  {
    "id": "sub-tal-80",
    "section_id": "sec-tal-59",
    "name": "Export"
  },
  {
    "id": "sub-tal-81",
    "section_id": "sec-tal-59",
    "name": "Customs"
  },
  {
    "id": "sub-tal-82",
    "section_id": "sec-tal-59",
    "name": "Import"
  },
  {
    "id": "sub-tal-83",
    "section_id": "sec-tal-59",
    "name": "C & F"
  },
  {
    "id": "sub-tal-84",
    "section_id": "sec-tal-59",
    "name": "General"
  },
  {
    "id": "sub-tal-85",
    "section_id": "sec-tal-59",
    "name": "Cash Incentive"
  },
  {
    "id": "sub-tal-86",
    "section_id": "sec-tal-60",
    "name": "Store"
  },
  {
    "id": "sub-tal-87",
    "section_id": "sec-tal-61",
    "name": "Fabric"
  },
  {
    "id": "sub-tal-88",
    "section_id": "sec-tal-61",
    "name": "Design"
  },
  {
    "id": "sub-tal-89",
    "section_id": "sec-tal-62",
    "name": "Maintenance"
  },
  {
    "id": "sub-tal-90",
    "section_id": "sec-tal-62",
    "name": "Sample"
  },
  {
    "id": "sub-tal-91",
    "section_id": "sec-tal-62",
    "name": "Sewing"
  },
  {
    "id": "sub-tal-92",
    "section_id": "sec-tal-62",
    "name": "Quilting"
  },
  {
    "id": "sub-tal-93",
    "section_id": "sec-tal-62",
    "name": "Quick change over Team"
  },
  {
    "id": "sub-tal-94",
    "section_id": "sec-tal-62",
    "name": "Finishing"
  },
  {
    "id": "sub-tal-95",
    "section_id": "sec-tal-62",
    "name": "Cutting"
  },
  {
    "id": "sub-tal-96",
    "section_id": "sec-tal-62",
    "name": "Folding"
  },
  {
    "id": "sub-tal-97",
    "section_id": "sec-tal-63",
    "name": "Utility"
  },
  {
    "id": "sub-tal-98",
    "section_id": "sec-tal-63",
    "name": "Sample"
  },
  {
    "id": "sub-tal-99",
    "section_id": "sec-tal-63",
    "name": "Substation"
  },
  {
    "id": "sub-tal-100",
    "section_id": "sec-tal-63",
    "name": "Electrical"
  },
  {
    "id": "sub-tal-101",
    "section_id": "sec-tal-64",
    "name": "Civil"
  },
  {
    "id": "sub-tal-102",
    "section_id": "sec-tal-65",
    "name": "General"
  },
  {
    "id": "sub-tal-103",
    "section_id": "sec-tal-66",
    "name": "Support & Customization"
  },
  {
    "id": "sub-tal-104",
    "section_id": "sec-tal-66",
    "name": "Development"
  },
  {
    "id": "sub-tal-105",
    "section_id": "sec-tal-66",
    "name": "Database Admin"
  },
  {
    "id": "sub-tal-106",
    "section_id": "sec-tal-67",
    "name": "Support"
  },
  {
    "id": "sub-tal-107",
    "section_id": "sec-tal-67",
    "name": "Core Network"
  },
  {
    "id": "sub-tal-108",
    "section_id": "sec-tal-67",
    "name": "IT"
  },
  {
    "id": "sub-tal-109",
    "section_id": "sec-tal-68",
    "name": "Social"
  },
  {
    "id": "sub-tal-110",
    "section_id": "sec-tal-69",
    "name": "EMS"
  },
  {
    "id": "sub-tal-111",
    "section_id": "sec-tal-70",
    "name": "Accounts"
  },
  {
    "id": "sub-tal-112",
    "section_id": "sec-tal-70",
    "name": "Cash Incentive"
  },
  {
    "id": "sub-tal-113",
    "section_id": "sec-tal-70",
    "name": "Finance"
  },
  {
    "id": "sub-tal-114",
    "section_id": "sec-tal-71",
    "name": "Finance"
  },
  {
    "id": "sub-tal-115",
    "section_id": "sec-tal-72",
    "name": "Secreteriate"
  },
  {
    "id": "sub-tal-116",
    "section_id": "sec-tal-72",
    "name": "General"
  },
  {
    "id": "sub-tal-117",
    "section_id": "sec-tal-73",
    "name": "General"
  },
  {
    "id": "sub-tal-118",
    "section_id": "sec-tal-74",
    "name": "Compensation , Benefits & HR Analytics"
  },
  {
    "id": "sub-tal-119",
    "section_id": "sec-tal-74",
    "name": "Talent Acquisition & Onboarding"
  },
  {
    "id": "sub-tal-120",
    "section_id": "sec-tal-74",
    "name": "PMS, Learning & OD"
  },
  {
    "id": "sub-tal-121",
    "section_id": "sec-tal-75",
    "name": "Cafeteria & House Keeping Management"
  },
  {
    "id": "sub-tal-122",
    "section_id": "sec-tal-75",
    "name": "Transportation Management"
  },
  {
    "id": "sub-tal-123",
    "section_id": "sec-tal-75",
    "name": "Safety, Security & Emergency Management"
  },
  {
    "id": "sub-tal-124",
    "section_id": "sec-tal-75",
    "name": "General"
  },
  {
    "id": "sub-tal-125",
    "section_id": "sec-tal-76",
    "name": "General"
  },
  {
    "id": "sub-tal-126",
    "section_id": "sec-tal-77",
    "name": "General"
  },
  {
    "id": "sub-tal-127",
    "section_id": "sec-tal-77",
    "name": "Basundhara House"
  },
  {
    "id": "sub-tal-128",
    "section_id": "sec-tal-77",
    "name": "Transport"
  },
  {
    "id": "sub-tal-129",
    "section_id": "sec-tal-77",
    "name": "Admin"
  },
  {
    "id": "sub-tal-130",
    "section_id": "sec-tal-78",
    "name": "Payroll"
  },
  {
    "id": "sub-tal-131",
    "section_id": "sec-tal-78",
    "name": "HR"
  },
  {
    "id": "sub-tal-132",
    "section_id": "sec-tal-78",
    "name": "OD & Training"
  },
  {
    "id": "sub-tal-133",
    "section_id": "sec-tal-79",
    "name": "HR"
  },
  {
    "id": "sub-tal-134",
    "section_id": "sec-tal-80",
    "name": "HR"
  },
  {
    "id": "sub-tal-135",
    "section_id": "sec-tal-80",
    "name": "General"
  },
  {
    "id": "sub-tal-136",
    "section_id": "sec-tal-80",
    "name": "Compliance"
  },
  {
    "id": "sub-tal-137",
    "section_id": "sec-tal-80",
    "name": "Payroll"
  },
  {
    "id": "sub-tal-138",
    "section_id": "sec-tal-80",
    "name": "Medical"
  },
  {
    "id": "sub-tal-139",
    "section_id": "sec-tal-81",
    "name": "Compliance"
  },
  {
    "id": "sub-tal-140",
    "section_id": "sec-tal-82",
    "name": "EMS"
  },
  {
    "id": "sub-tal-141",
    "section_id": "sec-tal-83",
    "name": "IE"
  },
  {
    "id": "sub-tal-142",
    "section_id": "sec-tal-83",
    "name": "Sewing"
  },
  {
    "id": "sub-tal-143",
    "section_id": "sec-tal-83",
    "name": "Technical"
  },
  {
    "id": "sub-tal-144",
    "section_id": "sec-tal-83",
    "name": "OPEX"
  },
  {
    "id": "sub-tal-145",
    "section_id": "sec-tal-83",
    "name": "Finishing"
  },
  {
    "id": "sub-tal-146",
    "section_id": "sec-tal-84",
    "name": "Sewing"
  },
  {
    "id": "sub-tal-147",
    "section_id": "sec-tal-84",
    "name": "Technical"
  },
  {
    "id": "sub-tal-148",
    "section_id": "sec-tal-85",
    "name": "Cluster-6"
  },
  {
    "id": "sub-tal-149",
    "section_id": "sec-tal-85",
    "name": "Cluster-9"
  },
  {
    "id": "sub-tal-150",
    "section_id": "sec-tal-85",
    "name": "Cluster-3"
  },
  {
    "id": "sub-tal-151",
    "section_id": "sec-tal-85",
    "name": "Cluster-8"
  },
  {
    "id": "sub-tal-152",
    "section_id": "sec-tal-85",
    "name": "Cluster-5"
  },
  {
    "id": "sub-tal-153",
    "section_id": "sec-tal-85",
    "name": "Cluster-1"
  },
  {
    "id": "sub-tal-154",
    "section_id": "sec-tal-85",
    "name": "Cluster-7"
  },
  {
    "id": "sub-tal-155",
    "section_id": "sec-tal-85",
    "name": "Cluster-2"
  },
  {
    "id": "sub-tal-156",
    "section_id": "sec-tal-85",
    "name": "Cluster-4"
  },
  {
    "id": "sub-tal-157",
    "section_id": "sec-tal-86",
    "name": "MIS"
  },
  {
    "id": "sub-tal-158",
    "section_id": "sec-tal-86",
    "name": "Internal Audit"
  },
  {
    "id": "sub-tal-159",
    "section_id": "sec-tal-87",
    "name": "Production"
  },
  {
    "id": "sub-tal-160",
    "section_id": "sec-tal-87",
    "name": "Sewing"
  },
  {
    "id": "sub-tal-161",
    "section_id": "sec-tal-88",
    "name": "Cutting"
  },
  {
    "id": "sub-tal-162",
    "section_id": "sec-tal-89",
    "name": "Finishing"
  },
  {
    "id": "sub-tal-163",
    "section_id": "sec-tal-90",
    "name": "Sample"
  },
  {
    "id": "sub-tal-164",
    "section_id": "sec-tal-91",
    "name": "Sewing"
  },
  {
    "id": "sub-tal-165",
    "section_id": "sec-tal-91",
    "name": "Pilot Line-01"
  },
  {
    "id": "sub-tal-166",
    "section_id": "sec-tal-92",
    "name": "Embroidery"
  },
  {
    "id": "sub-tal-167",
    "section_id": "sec-tal-93",
    "name": "Fabric"
  },
  {
    "id": "sub-tal-168",
    "section_id": "sec-tal-94",
    "name": "Wet Process"
  },
  {
    "id": "sub-tal-169",
    "section_id": "sec-tal-95",
    "name": "Planning & Controll"
  },
  {
    "id": "sub-tal-170",
    "section_id": "sec-tal-95",
    "name": "Planning"
  },
  {
    "id": "sub-tal-171",
    "section_id": "sec-tal-96",
    "name": "Planning"
  },
  {
    "id": "sub-tal-172",
    "section_id": "sec-tal-96",
    "name": "Planning & Controll"
  },
  {
    "id": "sub-tal-173",
    "section_id": "sec-tal-97",
    "name": "Quality"
  },
  {
    "id": "sub-tal-174",
    "section_id": "sec-tal-97",
    "name": "GPQ"
  },
  {
    "id": "sub-tal-175",
    "section_id": "sec-tal-97",
    "name": "Sewing"
  },
  {
    "id": "sub-tal-176",
    "section_id": "sec-tal-97",
    "name": "Sub Contract"
  },
  {
    "id": "sub-tal-177",
    "section_id": "sec-tal-97",
    "name": "Process Control"
  },
  {
    "id": "sub-tal-178",
    "section_id": "sec-tal-98",
    "name": "Sewing"
  },
  {
    "id": "sub-tal-179",
    "section_id": "sec-tal-99",
    "name": "Finishing"
  },
  {
    "id": "sub-tal-180",
    "section_id": "sec-tal-100",
    "name": "Fabric"
  },
  {
    "id": "sub-tal-181",
    "section_id": "sec-tal-101",
    "name": "Lab"
  },
  {
    "id": "sub-tal-182",
    "section_id": "sec-tal-102",
    "name": "Store"
  },
  {
    "id": "sub-tal-183",
    "section_id": "sec-tal-103",
    "name": "Warehouse"
  },
  {
    "id": "sub-tal-184",
    "section_id": "sec-tal-103",
    "name": "Trims"
  },
  {
    "id": "sub-tal-185",
    "section_id": "sec-tal-103",
    "name": "Fabric"
  },
  {
    "id": "sub-tal-186",
    "section_id": "sec-tal-104",
    "name": "Fabric"
  },
  {
    "id": "sub-tal-187",
    "section_id": "sec-tal-105",
    "name": "Supply Chain (Local Purchase)"
  },
  {
    "id": "sub-tal-188",
    "section_id": "sec-tal-105",
    "name": "Supply Chain (CAPEX)"
  },
  {
    "id": "sub-tal-189",
    "section_id": "sec-tal-106",
    "name": "Technical"
  },
  {
    "id": "sub-tal-190",
    "section_id": "sec-tal-107",
    "name": "Technical"
  },
  {
    "id": "sub-tal-191",
    "section_id": "sec-tal-108",
    "name": "Wet Process"
  },
  {
    "id": "sub-tal-192",
    "section_id": "sec-tal-108",
    "name": "Washing"
  },
  {
    "id": "sub-tal-193",
    "section_id": "sec-tal-108",
    "name": "Sample"
  },
  {
    "id": "sub-tal-194",
    "section_id": "sec-tal-108",
    "name": "Production"
  },
  {
    "id": "sub-tal-195",
    "section_id": "sec-tal-108",
    "name": "Dry Process"
  },
  {
    "id": "sub-tal-196",
    "section_id": "sec-tal-109",
    "name": "Wet Process"
  },
  {
    "id": "sub-tal-197",
    "section_id": "sec-tal-110",
    "name": "R & D"
  },
  {
    "id": "sub-tal-198",
    "section_id": "sec-tal-111",
    "name": "Dry Process"
  }
];
