export type FarmerTableRecord = {
  farmer: string
  address: string
  gatePassNumber: number
  date: string
  variety: string
  bags: number
  netWeight: number
  status: 'GRADED' | 'NOT_GRADED'
}

export const farmerTableData: FarmerTableRecord[] = [
  { farmer: 'Ramesh Kumar', address: 'Village Rampur, Haryana', gatePassNumber: 1001, date: '2026-04-01', variety: 'Basmati', bags: 12, netWeight: 612, status: 'GRADED' },
  { farmer: 'Suresh Patel', address: 'Kheda, Gujarat', gatePassNumber: 1002, date: '2026-04-02', variety: 'IR-64', bags: 10, netWeight: 508, status: 'NOT_GRADED' },
  { farmer: 'Mahesh Yadav', address: 'Sitapur, Uttar Pradesh', gatePassNumber: 1003, date: '2026-04-03', variety: 'Sona Masoori', bags: 15, netWeight: 748, status: 'GRADED' },
  { farmer: 'Anil Verma', address: 'Neemuch, Madhya Pradesh', gatePassNumber: 1004, date: '2026-04-04', variety: 'Sharbati', bags: 8, netWeight: 402, status: 'NOT_GRADED' },
  { farmer: 'Deepak Singh', address: 'Ludhiana, Punjab', gatePassNumber: 1005, date: '2026-04-05', variety: 'PR-126', bags: 14, netWeight: 699, status: 'GRADED' },
  { farmer: 'Gopal Das', address: 'Nadia, West Bengal', gatePassNumber: 1006, date: '2026-04-06', variety: 'Gobindobhog', bags: 9, netWeight: 451, status: 'NOT_GRADED' },
  { farmer: 'Harish Choudhary', address: 'Sikar, Rajasthan', gatePassNumber: 1007, date: '2026-04-07', variety: 'Basmati', bags: 11, netWeight: 552, status: 'GRADED' },
  { farmer: 'Iqbal Sheikh', address: 'Jalgaon, Maharashtra', gatePassNumber: 1008, date: '2026-04-08', variety: 'Kolam', bags: 13, netWeight: 653, status: 'NOT_GRADED' },
  { farmer: 'Jitendra Meena', address: 'Kota, Rajasthan', gatePassNumber: 1009, date: '2026-04-09', variety: 'Sona Masoori', bags: 7, netWeight: 351, status: 'GRADED' },
  { farmer: 'Kiran Rao', address: 'Raichur, Karnataka', gatePassNumber: 1010, date: '2026-04-10', variety: 'IR-64', bags: 16, netWeight: 799, status: 'NOT_GRADED' },
  { farmer: 'Lokesh Bairwa', address: 'Bundi, Rajasthan', gatePassNumber: 1011, date: '2026-04-11', variety: 'PR-121', bags: 10, netWeight: 500, status: 'GRADED' },
  { farmer: 'Mohan Naik', address: 'Ganjam, Odisha', gatePassNumber: 1012, date: '2026-04-12', variety: 'Swarna', bags: 12, netWeight: 603, status: 'NOT_GRADED' },
  { farmer: 'Naveen Reddy', address: 'Nizamabad, Telangana', gatePassNumber: 1013, date: '2026-04-13', variety: 'BPT-5204', bags: 9, netWeight: 456, status: 'GRADED' },
  { farmer: 'Omprakash Mali', address: 'Ujjain, Madhya Pradesh', gatePassNumber: 1014, date: '2026-04-14', variety: 'Sharbati', bags: 6, netWeight: 301, status: 'NOT_GRADED' },
  { farmer: 'Prakash Gowda', address: 'Mandya, Karnataka', gatePassNumber: 1015, date: '2026-04-15', variety: 'RNR-15048', bags: 14, netWeight: 705, status: 'GRADED' },
]
