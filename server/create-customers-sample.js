const XLSX = require('xlsx');
const path = require('path');

// Sample customer data
const sampleCustomers = [
  {
    'Mã khách hàng': 'KH001',
    'Tên khách hàng': 'Nguyễn Văn An',
    'Số điện thoại': '0901234567',
    'Email': 'nguyenvanan@email.com',
    'Địa chỉ': '123 Đường ABC, Quận 1, TP.HCM',
    'Ngày sinh': '1990-01-15',
    'Giới tính': 'Nam',
    'Loại khách hàng': 'Bán lẻ',
    'Hạn mức tín dụng': 5000000,
    'Số dư hiện tại': 0,
    'Điểm tích lũy': 100,
    'Ghi chú': 'Khách hàng thân thiết',
    'Trạng thái': 'Hoạt động'
  },
  {
    'Mã khách hàng': 'KH002',
    'Tên khách hàng': 'Trần Thị Bình',
    'Số điện thoại': '0912345678',
    'Email': 'tranthibinh@email.com',
    'Địa chỉ': '456 Đường XYZ, Quận 2, TP.HCM',
    'Ngày sinh': '1985-05-20',
    'Giới tính': 'Nữ',
    'Loại khách hàng': 'VIP',
    'Hạn mức tín dụng': 10000000,
    'Số dư hiện tại': 500000,
    'Điểm tích lũy': 250,
    'Ghi chú': 'Khách VIP',
    'Trạng thái': 'Hoạt động'
  },
  {
    'Mã khách hàng': 'KH003',
    'Tên khách hàng': 'Lê Văn Cường',
    'Số điện thoại': '0923456789',
    'Email': 'levancuong@email.com',
    'Địa chỉ': '789 Đường DEF, Quận 3, TP.HCM',
    'Ngày sinh': '1992-12-10',
    'Giới tính': 'Nam',
    'Loại khách hàng': 'Bán sỉ',
    'Hạn mức tín dụng': 15000000,
    'Số dư hiện tại': 1000000,
    'Điểm tích lũy': 500,
    'Ghi chú': 'Khách hàng bán sỉ',
    'Trạng thái': 'Hoạt động'
  },
  {
    'Mã khách hàng': 'KH004',
    'Tên khách hàng': 'Phạm Thị Dung',
    'Số điện thoại': '0934567890',
    'Email': 'phamthidung@email.com',
    'Địa chỉ': '321 Đường GHI, Quận 4, TP.HCM',
    'Ngày sinh': '1988-08-25',
    'Giới tính': 'Nữ',
    'Loại khách hàng': 'Thường xuyên',
    'Hạn mức tín dụng': 3000000,
    'Số dư hiện tại': 200000,
    'Điểm tích lũy': 150,
    'Ghi chú': 'Khách hàng thường xuyên',
    'Trạng thái': 'Hoạt động'
  },
  {
    'Mã khách hàng': 'KH005',
    'Tên khách hàng': 'Hoàng Văn Em',
    'Số điện thoại': '0945678901',
    'Email': 'hoangvanem@email.com',
    'Địa chỉ': '654 Đường JKL, Quận 5, TP.HCM',
    'Ngày sinh': '1995-03-18',
    'Giới tính': 'Nam',
    'Loại khách hàng': 'Bán lẻ',
    'Hạn mức tín dụng': 2000000,
    'Số dư hiện tại': 0,
    'Điểm tích lũy': 50,
    'Ghi chú': '',
    'Trạng thái': 'Hoạt động'
  }
];

// Create workbook and worksheet
const workbook = XLSX.utils.book_new();
const worksheet = XLSX.utils.json_to_sheet(sampleCustomers);

// Set column widths for better readability
const columnWidths = [
  { wch: 15 }, // Mã khách hàng
  { wch: 25 }, // Tên khách hàng
  { wch: 15 }, // Số điện thoại
  { wch: 25 }, // Email
  { wch: 35 }, // Địa chỉ
  { wch: 12 }, // Ngày sinh
  { wch: 10 }, // Giới tính
  { wch: 15 }, // Loại khách hàng
  { wch: 18 }, // Hạn mức tín dụng
  { wch: 15 }, // Số dư hiện tại
  { wch: 12 }, // Điểm tích lũy
  { wch: 25 }, // Ghi chú
  { wch: 15 }  // Trạng thái
];
worksheet['!cols'] = columnWidths;

// Add worksheet to workbook
XLSX.utils.book_append_sheet(workbook, worksheet, 'Khách hàng mẫu');

// Write file
const fileName = 'khach-hang-mau.xlsx';
const filePath = path.join(__dirname, fileName);

XLSX.writeFile(workbook, filePath);

console.log(`✅ Đã tạo file Excel mẫu: ${fileName}`);
console.log(`📁 Đường dẫn: ${filePath}`);
console.log(`📋 File chứa ${sampleCustomers.length} khách hàng mẫu`);
console.log(`\n🔧 Hướng dẫn sử dụng:`);
console.log(`1. Mở file ${fileName}`);
console.log(`2. Chỉnh sửa dữ liệu theo nhu cầu`);
console.log(`3. Lưu file và import vào hệ thống`);
console.log(`\n📝 Lưu ý:`);
console.log(`- Mã khách hàng phải duy nhất`);
console.log(`- Tên khách hàng là bắt buộc`);
console.log(`- Loại khách hàng: Bán lẻ, Bán sỉ, VIP, Thường xuyên`);
console.log(`- Giới tính: Nam, Nữ, Khác`);
console.log(`- Trạng thái: Hoạt động, Ngừng hoạt động`);
console.log(`- Ngày sinh định dạng: YYYY-MM-DD`); 