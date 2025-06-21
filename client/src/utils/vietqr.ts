// VietQR utility functions using Sepay API
// Using reliable third-party service for QR generation

// Bank codes for Sepay API
export const BANK_BINS: Record<string, string> = {
  'VCB': 'VCB',         // Vietcombank
  'VTB': 'VTB',         // Vietinbank  
  'BIDV': 'BIDV',       // BIDV
  'ACB': 'ACB',         // ACB
  'TCB': 'TCB',         // Techcombank
  'MB': 'MB',           // MB Bank
  'VPB': 'VPB',         // VPBank
  'TPB': 'TPB',         // TPBank
  'STB': 'STB',         // Sacombank
  'HDB': 'HDB',         // HDBank
  'OCB': 'OCB',         // OCB
  'MSB': 'MSB',         // MSB
  'AGRI': 'AGRI',       // Agribank
  'EIB': 'EIB',         // Eximbank
  'OJB': 'OJB',         // OceanBank
  'BVB': 'BVB',         // BaoViet Bank
  'SCB': 'SCB',         // SCB
  'SHB': 'SHB',         // SHB
  'VIB': 'VIB',         // VIB
  'LPB': 'LPB',         // LienVietPostBank
  'KLB': 'KLB',         // KienLongBank
  'SEAB': 'SEAB',       // SeABank
  'VCCB': 'VCCB',       // VietCapitalBank
  'ABB': 'ABB',         // ABBank
  'VAB': 'VAB',         // VietABank
  'NAB': 'NAB',         // NamABank
  'PGB': 'PGB',         // PGBank
  'GPB': 'GPB',         // GPBank
  'BAB': 'BAB',         // BacABank
  'DOB': 'DOB',         // DongABank
  'IVB': 'IVB',         // IndovinaBank
  'PVCB': 'PVCB',       // PVcomBank
  'VRB': 'VRB',         // VietRussiaBank
  'NCB': 'NCB',         // NCB
  'SHBVN': 'SHBVN',     // Shinhan Bank Vietnam
  'HLBVN': 'HLBVN',     // Hong Leong Bank Vietnam
  'SCVN': 'SCVN',       // Standard Chartered Vietnam
  'PBVN': 'PBVN',       // Public Bank Vietnam
  'UOB': 'UOB',         // UOB Vietnam
  'CIMB': 'CIMB',       // CIMB Vietnam
  'WVN': 'WVN',         // Woori Bank Vietnam
  'COOPBANK': 'COOPBANK', // Co-opBank
  'CBB': 'CBB',         // CBBank
  'SGICB': 'SGICB',     // SaigonBank
};

// Convert Vietnamese text for URL encoding
function encodeVietnamese(text: string): string {
  return encodeURIComponent(text);
}

// Generate VietQR using Sepay API
export function generateVietQR(params: {
  bankBin: string;
  accountNumber: string;
  accountName: string;
  amount?: number;
  description?: string;
}): string {
  const { bankBin, accountNumber, accountName, amount, description } = params;
  
  // Map bank BIN to bank code for Sepay
  const bankCode = BANK_BINS[getBankCodeFromBin(bankBin)] || 'VCB';
  
  // Default values
  const finalAmount = amount && amount > 0 ? amount : 0;
  const finalDescription = description || 'chuyen khoan';
  
  // Build Sepay QR URL
  const qrUrl = `https://qr.sepay.vn/img?acc=${accountNumber}&bank=${bankCode}&amount=${finalAmount}&des=${encodeVietnamese(finalDescription)}`;
  
  return qrUrl;
}

// Generate minimal VietQR
export function generateMinimalVietQR(params: {
  bankBin: string;
  accountNumber: string;
  accountName: string;
  amount?: number;
  description?: string;
}): string {
  return generateVietQR(params);
}

// Convert bank BIN to bank code
function getBankCodeFromBin(bankBin: string): string {
  const binToCodeMap: Record<string, string> = {
    '970436': 'VCB',      // Vietcombank
    '970415': 'VTB',      // Vietinbank  
    '970418': 'BIDV',     // BIDV
    '970416': 'ACB',      // ACB
    '970407': 'TCB',      // Techcombank
    '970422': 'MB',       // MB Bank
    '970432': 'VPB',      // VPBank
    '970423': 'TPB',      // TPBank
    '970403': 'STB',      // Sacombank
    '970437': 'HDB',      // HDBank
    '970448': 'OCB',      // OCB
    '970426': 'MSB',      // MSB
    '970405': 'AGRI',     // Agribank
    '970431': 'EIB',      // Eximbank
         '970444': 'OJB',      // OceanBank
     '970438': 'BVB',      // BaoViet Bank
     '970429': 'SCB',      // SCB
     '970443': 'SHB',      // SHB
     '970441': 'VIB',      // VIB
     '970449': 'LPB',      // LienVietPostBank
     '970452': 'KLB',      // KienLongBank
     '970440': 'SEAB',     // SeABank
     '970454': 'VCCB',     // VietCapitalBank
     '970425': 'ABB',      // ABBank
     '970427': 'VAB',      // VietABank
     '970428': 'NAB',      // NamABank
     '970430': 'PGB',      // PGBank
     '970408': 'GPB',      // GPBank
     '970409': 'BAB',      // BacABank
     '970406': 'DOB',      // DongABank
     '970434': 'IVB',      // IndovinaBank
     '970412': 'PVCB',     // PVcomBank
     '970421': 'VRB',      // VietRussiaBank
     '970419': 'NCB',      // NCB
     '970424': 'SHBVN',    // Shinhan Bank Vietnam
     '970442': 'HLBVN',    // Hong Leong Bank Vietnam
     '970410': 'SCVN',     // Standard Chartered Vietnam
     '970439': 'PBVN',     // Public Bank Vietnam
     '970458': 'UOB',      // UOB Vietnam
     '970459': 'CIMB',     // CIMB Vietnam
     '970457': 'WVN',      // Woori Bank Vietnam
     '970446': 'COOPBANK', // Co-opBank
     '970445': 'CBB',      // CBBank
     '970400': 'SGICB',    // SaigonBank
  };
  
  return binToCodeMap[bankBin] || 'VCB';
}

// Get bank name from BIN
export function getBankName(bankBin: string): string {
  const bankMap: Record<string, string> = {
    '970436': 'Vietcombank',
    '970415': 'VietinBank',
    '970418': 'BIDV',
    '970416': 'ACB',
    '970407': 'Techcombank',
    '970422': 'MB Bank',
    '970432': 'VPBank',
    '970423': 'TPBank',
    '970403': 'Sacombank',
    '970437': 'HDBank',
    '970448': 'OCB',
    '970426': 'MSB',
    '970405': 'Agribank',
         '970431': 'Eximbank',
     '970444': 'OceanBank',
     '970438': 'BaoViet Bank',
     '970429': 'SCB',
     '970443': 'SHB',
     '970441': 'VIB',
     '970449': 'LienVietPostBank',
     '970452': 'KienLongBank',
     '970440': 'SeABank',
     '970454': 'VietCapitalBank',
     '970425': 'ABBank',
     '970427': 'VietABank',
     '970428': 'NamABank',
     '970430': 'PGBank',
     '970408': 'GPBank',
     '970409': 'BacABank',
     '970406': 'DongABank',
     '970434': 'IndovinaBank',
     '970412': 'PVcomBank',
     '970421': 'VietRussiaBank',
     '970419': 'NCB',
     '970424': 'Shinhan Bank Vietnam',
     '970442': 'Hong Leong Bank Vietnam',
     '970410': 'Standard Chartered Vietnam',
     '970439': 'Public Bank Vietnam',
     '970458': 'UOB Vietnam',
     '970459': 'CIMB Vietnam',
     '970457': 'Woori Bank Vietnam',
     '970446': 'Co-opBank',
     '970445': 'CBBank',
     '970400': 'SaigonBank'
  };
  
  return bankMap[bankBin] || 'Unknown Bank';
} 