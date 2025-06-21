import React, { useState, useEffect, useRef } from 'react';

interface PrintTemplateManagerProps {
  onBack?: () => void;
  orderId?: string;
}

interface TemplateField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'image' | 'table';
  required: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
  style: {
    fontSize: number;
    fontWeight: 'normal' | 'bold';
    textAlign: 'left' | 'center' | 'right';
    color: string;
  };
}

interface PrintTemplate {
  id: string;
  name: string;
  type: 'invoice' | 'receipt' | 'order';
  fields: TemplateField[];
  pageSize: 'A4' | 'A5' | '80mm' | '58mm';
  orientation: 'portrait' | 'landscape';
}

interface PrintData {
  store: {
    logo?: string;
    name: string;
    address: string;
    phone: string;
    email?: string;
    qr_code?: string;
  };
  order: {
    order_number: string;
    order_date: string;
    status: string;
    subtotal: number;
    tax_amount: number;
    discount_amount: number;
    total_amount: number;
    payment_method: string;
    notes?: string;
  };
  customer: {
    name: string;
    phone?: string;
    address?: string;
    email?: string;
  };
  items: Array<{
    product_name: string;
    quantity: number;
    unit_price: number;
    discount_amount: number;
    total_price: number;
    unit?: string;
  }>;
  datetime: {
    day: string;
    month: string;
    year: string;
    hour: string;
    minute: string;
    second: string;
    full_date: string;
    full_time: string;
  };
}

type TabType = 'order' | 'invoice' | 'delivery' | 'return' | 'exchange' | 'purchase_order' | 'import' | 'return_import' | 'transfer' | 'receipt' | 'payment' | 'comment';

const PrintTemplateManager: React.FC<PrintTemplateManagerProps> = ({ onBack, orderId }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<PrintTemplate | null>(null);
  const [templates, setTemplates] = useState<PrintTemplate[]>([]);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [templateContent, setTemplateContent] = useState('');
  const [paperSize, setPaperSize] = useState<'80mm' | '57mm'>('80mm');
  const [printData, setPrintData] = useState<PrintData | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>(orderId ? 'invoice' : 'order');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  const fetchPrintData = async () => {
    try {
      const endpoint = orderId 
        ? `/api/print/data/${orderId}` 
        : '/api/print/sample-data';
      
      const response = await fetch(`http://localhost:3001${endpoint}`);
      const result = await response.json();
      
      if (result.success) {
        setPrintData(result.data);
      } else {
        console.error('Error fetching print data:', result.error);
        fetchSampleData();
      }
    } catch (error) {
      console.error('Error fetching print data:', error);
      fetchSampleData();
    }
  };

  const fetchSampleData = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/print/sample-data');
      const result = await response.json();
      
      if (result.success) {
        setPrintData(result.data);
      }
    } catch (error) {
      console.error('Error fetching sample data:', error);
    }
  };

  const replacePlaceholders = (content: string, data: PrintData): string => {
    if (!data) return content;

    const placeholders: { [key: string]: string } = {
      'Logo_Cua_Hang': data.store.logo || '',
      'Ten_Cua_Hang': data.store.name,
      'Dia_Chi_Chi_Nhanh': data.store.address,
      'Phuong_Xa_Chi_Nhanh': '',
      'Khu_Vuc_Chi_Nhanh_QH_TP': '',
      'Dien_Thoai_Chi_Nhanh': data.store.phone,
      'Ma_Don_Hang': data.order.order_number,
      'Tieu_De_In': 'HÓA ĐƠN ĐẶT HÀNG',
      'Ngay': data.datetime.day,
      'Thang': data.datetime.month,
      'Nam': data.datetime.year,
      'Gio': data.datetime.hour,
      'Phut': data.datetime.minute,
      'Giay': data.datetime.second,
      'Khach_Hang': data.customer.name,
      'So_Dien_Thoai': data.customer.phone || '',
      'Dia_Chi_Khach_Hang': data.customer.address || '',
      'Phuong_Xa_Khach_Hang': '',
      'Khu_Vuc_Khach_Hang_QH_TP': '',
      'Ten_Hang_Hoa': data.items.length > 0 ? data.items[0].product_name : '',
      'So_Luong': data.items.length > 0 ? data.items[0].quantity.toString() : '',
      'Don_Gia_Chiet_Khau': data.items.length > 0 ? data.items[0].unit_price.toLocaleString('vi-VN') : '',
      'Thanh_Tien': data.items.length > 0 ? data.items[0].total_price.toLocaleString('vi-VN') : '',
      'Tong_Tien_Hang': data.order.subtotal.toLocaleString('vi-VN'),
      'Chiet_Khau_Hoa_Don': data.order.discount_amount.toLocaleString('vi-VN'),
      'Chiet_Khau_Hoa_Don_Phan_Tram': data.order.discount_amount > 0 ? `${((data.order.discount_amount / data.order.subtotal) * 100).toFixed(1)}%` : '0%',
      'Tong_Cong': data.order.total_amount.toLocaleString('vi-VN'),
      'Tong_Cong_Bang_Chu': convertNumberToWords(data.order.total_amount),
      'Ma_QR': data.store.qr_code || '***'
    };

    let processedContent = content;
    Object.entries(placeholders).forEach(([key, value]) => {
      const regex = new RegExp(`\\(${key}\\)`, 'g');
      processedContent = processedContent.replace(regex, value);
    });

    return processedContent;
  };

  const convertNumberToWords = (num: number): string => {
    if (num === 0) return 'Không đồng';
    
    const ones = ['', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
    const tens = ['', '', 'hai mươi', 'ba mươi', 'bốn mươi', 'năm mươi', 'sáu mươi', 'bảy mươi', 'tám mươi', 'chín mươi'];
    const scales = ['', 'nghìn', 'triệu', 'tỷ'];
    
    if (num < 1000) {
      return `${ones[Math.floor(num / 100)]} trăm ${tens[Math.floor((num % 100) / 10)]} ${ones[num % 10]} đồng`.trim();
    } else if (num < 1000000) {
      return `${Math.floor(num / 1000)} nghìn ${Math.floor((num % 1000) / 100)} trăm đồng`.trim();
    } else {
      return `${Math.floor(num / 1000000)} triệu ${Math.floor((num % 1000000) / 1000)} nghìn đồng`.trim();
    }
  };

  useEffect(() => {
    const defaultTemplates: PrintTemplate[] = [
      {
        id: '1',
        name: activeTab === 'order' ? 'Mẫu in đặt hàng' : 'Mẫu in hóa đơn',
        type: activeTab === 'order' ? 'order' : 'invoice',
        pageSize: 'A4',
        orientation: 'portrait',
        fields: [
          {
            id: 'logo',
            label: 'Logo',
            type: 'text',
            required: false,
            position: { x: 200, y: 100 },
            size: { width: 100, height: 60 },
            style: { fontSize: 12, fontWeight: 'normal', textAlign: 'left', color: '#000000' }
          },
          {
            id: 'phone',
            label: 'Điện thoại',
            type: 'text',
            required: true,
            position: { x: 200, y: 100 },
            size: { width: 300, height: 20 },
            style: { fontSize: 12, fontWeight: 'normal', textAlign: 'left', color: '#000000' }
          },
          {
            id: 'title',
            label: 'Tiêu đề hóa đơn 1',
            type: 'text',
            required: true,
            position: { x: 50, y: 150 },
            size: { width: 500, height: 30 },
            style: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', color: '#000000' }
          },
          {
            id: 'orderNumber',
            label: 'Mã đơn hàng',
            type: 'text',
            required: true,
            position: { x: 50, y: 200 },
            size: { width: 200, height: 20 },
            style: { fontSize: 12, fontWeight: 'normal', textAlign: 'left', color: '#000000' }
          },
          {
            id: 'date',
            label: 'Ngày',
            type: 'date',
            required: true,
            position: { x: 350, y: 200 },
            size: { width: 200, height: 20 },
            style: { fontSize: 12, fontWeight: 'normal', textAlign: 'right', color: '#000000' }
          },
          {
            id: 'customerInfo',
            label: 'Thông tin khách hàng',
            type: 'text',
            required: true,
            position: { x: 50, y: 240 },
            size: { width: 500, height: 40 },
            style: { fontSize: 12, fontWeight: 'normal', textAlign: 'left', color: '#000000' }
          },
          {
            id: 'itemsTable',
            label: 'Bảng sản phẩm',
            type: 'table',
            required: true,
            position: { x: 50, y: 300 },
            size: { width: 500, height: 200 },
            style: { fontSize: 12, fontWeight: 'normal', textAlign: 'left', color: '#000000' }
          },
          {
            id: 'total',
            label: 'Tổng tiền',
            type: 'text',
            required: true,
            position: { x: 350, y: 520 },
            size: { width: 200, height: 60 },
            style: { fontSize: 14, fontWeight: 'bold', textAlign: 'right', color: '#000000' }
          }
        ]
      }
    ];
    setTemplates(defaultTemplates);
    setSelectedTemplate(defaultTemplates[0]);
    
    fetchPrintData();
  }, [orderId, activeTab]);

  // Thêm useEffect để thay đổi template content khi chuyển tab
  useEffect(() => {
    const getTemplateContent = () => {
      if (activeTab === 'invoice') {
        // Template cho hóa đơn bán hàng (giống hình đầu tiên)
        return `<div style="text-align: center;">
<div>(Logo_Cua_Hang)</div>
<div><strong>(Ten_Cua_Hang)</strong></div>
<div>Địa chỉ: (Dia_Chi_Chi_Nhanh) - (Phuong_Xa_Chi_Nhanh) - (Khu_Vuc_Chi_Nhanh_QH_TP)</div>
<div><strong>Điện thoại: (Dien_Thoai_Chi_Nhanh)</strong></div>
</div>

<div style="text-align: center; margin: 20px 0;">
<h2><strong>HÓA ĐƠN BÁN HÀNG</strong></h2>
<div>Số HD: (Ma_Don_Hang)</div>
<div>Ngày (Ngay) tháng (Thang) năm (Nam)</div>
</div>

<div style="margin: 20px 0;">
<div>Khách hàng: (Khach_Hang)</div>
<div>SĐT: (So_Dien_Thoai)</div>
<div>Địa chỉ: (Dia_Chi_Khach_Hang) - (Phuong_Xa_Khach_Hang) - (Khu_Vuc_Khach_Hang_QH_TP)</div>
</div>

<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
<tr>
<th style="border: 1px solid black; padding: 8px; text-align: left;">Đơn giá</th>
<th style="border: 1px solid black; padding: 8px; text-align: center;">SL</th>
<th style="border: 1px solid black; padding: 8px; text-align: right;">Thành tiền</th>
</tr>
<tr>
<td style="border: 1px solid black; padding: 8px;">(Ten_Hang_Hoa)</td>
<td style="border: 1px solid black; padding: 8px; text-align: center;">(So_Luong)</td>
<td style="border: 1px solid black; padding: 8px; text-align: right;">(Thanh_Tien)</td>
</tr>
<tr>
<td colspan="3" style="border: 1px solid black; padding: 8px; text-align: right;">
<div>Tổng tiền hàng: (Tong_Tien_Hang)</div>
<div>Chiết khấu (Chiet_Khau_Hoa_Don_Phan_Tram): (Chiet_Khau_Hoa_Don)</div>
<div><strong>Tổng thanh toán: (Tong_Cong)</strong></div>
</td>
</tr>
</table>

<div style="text-align: center; margin: 20px 0;">
<div>(Tong_Cong_Bang_Chu)</div>
<div style="margin: 10px 0;">(Ma_QR)</div>
<div><em>Cảm ơn và hẹn gặp lại!</em></div>
<div style="font-size: 10px; margin-top: 10px;"><em>Powered by KIOTVIET</em></div>
</div>`;
      } else {
        // Template mặc định cho đặt hàng
        return `<div style="text-align: center;">
<div>(Logo_Cua_Hang)</div>
<div>(Ten_Cua_Hang)</div>
<div>Địa chỉ: (Dia_Chi_Chi_Nhanh) - (Phuong_Xa_Chi_Nhanh) - (Khu_Vuc_Chi_Nhanh_QH_TP)</div>
<div><strong>Điện thoại: (Dien_Thoai_Chi_Nhanh)</strong></div>
</div>

<div style="text-align: center; margin: 20px 0;">
<h2>(Tieu_De_In HÓA ĐƠN ĐẶT HÀNG|HÓA ĐƠN ĐẶT HÀNG TẠM TÍNH)</h2>
<div>Mã đơn hàng: (Ma_Don_Hang)</div>
<div>Ngày (Ngay) tháng (Thang) năm (Nam)</div>
</div>

<div style="margin: 20px 0;">
<div>Khách hàng: (Khach_Hang)</div>
<div>SĐT: (So_Dien_Thoai)</div>
<div>Địa chỉ: (Dia_Chi_Khach_Hang) - (Phuong_Xa_Khach_Hang) - (Khu_Vuc_Khach_Hang_QH_TP)</div>
</div>

<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
<tr>
<th style="border: 1px solid black; padding: 8px; text-align: left;">Đơn giá</th>
<th style="border: 1px solid black; padding: 8px; text-align: center;">SL</th>
<th style="border: 1px solid black; padding: 8px; text-align: right;">T.Tiền</th>
</tr>
<tr>
<td style="border: 1px solid black; padding: 8px;">(Ten_Hang_Hoa)</td>
<td style="border: 1px solid black; padding: 8px; text-align: center;"></td>
<td style="border: 1px solid black; padding: 8px; text-align: right;"></td>
</tr>
<tr>
<td style="border: 1px solid black; padding: 8px;">(Don_Gia_Chiet_Khau)</td>
<td style="border: 1px solid black; padding: 8px; text-align: center;">(So_Luong)</td>
<td style="border: 1px solid black; padding: 8px; text-align: right;">(Thanh_Tien)</td>
</tr>
<tr>
<td colspan="3" style="border: 1px solid black; padding: 8px; text-align: right;">
<div>Tổng tiền hàng: (Tong_Tien_Hang)</div>
<div>Chiết khấu (Chiet_Khau_Hoa_Don_Phan_Tram): (Chiet_Khau_Hoa_Don)</div>
<div><strong>Tổng thanh toán: (Tong_Cong)</strong></div>
</td>
</tr>
</table>

<div style="text-align: center; margin: 20px 0;">
<div>(Tong_Cong_Bang_Chu)</div>
<div style="margin: 10px 0;">(Ma_QR)</div>
<div>Cảm ơn và hẹn gặp lại!</div>
</div>`;
      }
    };

    setTemplateContent(getTemplateContent());
  }, [activeTab]);

  const handleFieldUpdate = (fieldId: string, updates: Partial<TemplateField>) => {
    if (!selectedTemplate) return;
    
    const updatedFields = selectedTemplate.fields.map(field =>
      field.id === fieldId ? { ...field, ...updates } : field
    );
    
    const updatedTemplate = {
      ...selectedTemplate,
      fields: updatedFields
    };
    
    setSelectedTemplate(updatedTemplate);
    
    setTemplates(prev => prev.map(t => 
      t.id === selectedTemplate.id ? updatedTemplate : t
    ));
  };

  const handleSaveField = () => {
    setEditingField(null);
  };

  const handleSaveTemplate = () => {
    setShowTemplateEditor(false);
  };

  const execCommand = (command: string, value?: string) => {
    if (!editorRef.current) return;
    
    editorRef.current.focus();
    document.execCommand(command, false, value);
    
    setTimeout(() => {
      if (editorRef.current) {
        setTemplateContent(editorRef.current.innerHTML);
      }
    }, 0);
  };

  const handleBold = () => execCommand('bold');
  const handleItalic = () => execCommand('italic');
  const handleUnderline = () => execCommand('underline');
  const handleSuperscript = () => execCommand('superscript');
  const handleSubscript = () => execCommand('subscript');

  const handleUndo = () => execCommand('undo');
  const handleRedo = () => execCommand('redo');

  const handleCopy = () => execCommand('copy');
  const handlePaste = () => execCommand('paste');

  const handlePrint = () => {
    handleExportPDF();
  };

  const handleBulletList = () => execCommand('insertUnorderedList');
  const handleNumberedList = () => execCommand('insertOrderedList');

  const handleAlignLeft = () => execCommand('justifyLeft');
  const handleAlignCenter = () => execCommand('justifyCenter');
  const handleAlignRight = () => execCommand('justifyRight');

  const handleFontSize = (size: string) => execCommand('fontSize', size);
  const handleFontName = (font: string) => execCommand('fontName', font);

  const handleEditorInput = () => {
    if (editorRef.current) {
      setTemplateContent(editorRef.current.innerHTML);
    }
  };

  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Mẫu in đặt hàng</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            font-size: 12px;
          }
          .header { text-align: center; margin-bottom: 20px; }
          .title { text-align: center; margin: 30px 0; font-size: 18px; font-weight: bold; }
          .customer-info { margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid black; padding: 8px; text-align: left; }
          th { background-color: #f5f5f5; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .footer { text-align: center; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>(Logo_Cua_Hang)</div>
          <div>(Ten_Cua_Hang)</div>
          <div>Địa chỉ: (Dia_Chi_Chi_Nhanh) - (Phuong_Xa_Chi_Nhanh) - (Khu_Vuc_Chi_Nhanh_QH_TP)</div>
          <div><strong>Điện thoại: (Dien_Thoai_Chi_Nhanh)</strong></div>
        </div>
        
        <div style="text-align: center; margin: 20px 0;">
          <h2>(Tieu_De_In HÓA ĐƠN ĐẶT HÀNG|HÓA ĐƠN ĐẶT HÀNG TẠM TÍNH)</h2>
          <div>Mã đơn hàng: (Ma_Don_Hang)</div>
          <div>Ngày (Ngay) tháng (Thang) năm (Nam)</div>
        </div>
        
        <div style="margin: 20px 0;">
          <div>Khách hàng: (Khach_Hang)</div>
          <div>SĐT: (So_Dien_Thoai)</div>
          <div>Địa chỉ: (Dia_Chi_Khach_Hang) - (Phuong_Xa_Khach_Hang) - (Khu_Vuc_Khach_Hang_QH_TP)</div>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <th style="border: 1px solid black; padding: 8px; text-align: left;">Đơn giá</th>
            <th style="border: 1px solid black; padding: 8px; text-align: center;">SL</th>
            <th style="border: 1px solid black; padding: 8px; text-align: right;">T.Tiền</th>
          </tr>
          <tr>
            <td style="border: 1px solid black; padding: 8px;">(Ten_Hang_Hoa)</td>
            <td style="border: 1px solid black; padding: 8px; text-align: center;"></td>
            <td style="border: 1px solid black; padding: 8px; text-align: right;"></td>
          </tr>
          <tr>
            <td style="border: 1px solid black; padding: 8px;">(Don_Gia_Chiet_Khau)</td>
            <td style="border: 1px solid black; padding: 8px; text-align: center;">(So_Luong)</td>
            <td style="border: 1px solid black; padding: 8px; text-align: right;">(Thanh_Tien)</td>
          </tr>
          <tr>
            <td colspan="3" style="border: 1px solid black; padding: 8px; text-align: right;">
              <div>Tổng tiền hàng: (Tong_Tien_Hang)</div>
              <div>Chiết khấu (Chiet_Khau_Hoa_Don_Phan_Tram): (Chiet_Khau_Hoa_Don)</div>
              <div><strong>Tổng thanh toán: (Tong_Cong)</strong></div>
            </td>
          </tr>
        </table>
        
        <div style="text-align: center; margin: 20px 0;">
          <div>(Tong_Cong_Bang_Chu)</div>
          <div style="margin: 10px 0;">(Ma_QR)</div>
          <div>Cảm ơn và hẹn gặp lại!</div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const handleThermalPrint = () => {
    if (!printData) {
      alert('Chưa có dữ liệu để in. Vui lòng thử lại.');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Không thể mở cửa sổ in. Vui lòng kiểm tra popup blocker.');
      return;
    }

    const thermalCSS = `
      <style>
        @media print {
          @page {
            size: ${paperSize === '80mm' ? '80mm' : '57mm'} auto;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 2mm;
            font-family: 'Courier New', monospace;
            font-size: ${paperSize === '80mm' ? '10px' : '8px'};
            line-height: 1.2;
            color: #000;
            -webkit-print-color-adjust: exact;
          }
        }
        
        body {
          width: ${paperSize === '80mm' ? '76mm' : '53mm'};
          margin: 0 auto;
          padding: 2mm;
          font-family: 'Courier New', monospace;
          font-size: ${paperSize === '80mm' ? '10px' : '8px'};
          line-height: 1.2;
          color: #000;
          background: white;
        }
        
        .header {
          text-align: center;
          margin-bottom: 8px;
          border-bottom: 1px dashed #000;
          padding-bottom: 4px;
        }
        
        .title {
          text-align: center;
          margin: 8px 0;
          font-weight: bold;
          font-size: ${paperSize === '80mm' ? '12px' : '10px'};
        }
        
        .customer-info {
          margin-bottom: 8px;
          border-bottom: 1px dashed #000;
          padding-bottom: 4px;
        }
        
        table {
          width: 100%;
          margin-bottom: 8px;
          border-collapse: collapse;
        }
        
        th, td {
          padding: 2px;
          text-align: left;
          border-bottom: 1px dotted #000;
        }
        
        th {
          font-weight: bold;
          border-bottom: 1px solid #000;
        }
        
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-left { text-align: left; }
        
        .total-section {
          border-top: 1px solid #000;
          padding-top: 4px;
          margin-top: 8px;
        }
        
        .footer {
          text-align: center;
          margin-top: 8px;
          border-top: 1px dashed #000;
          padding-top: 4px;
        }
        
        .bold { font-weight: bold; }
        
        div {
          margin: 2px 0;
        }
        
        /* Ẩn các phần tử không cần thiết khi in */
        .no-print { display: none !important; }
      </style>
    `;

    // Lấy nội dung template và thay thế placeholder
    const defaultTemplate = `
      <div style="text-align: center;">
        <div class="bold">(Ten_Cua_Hang)</div>
        <div>(Dia_Chi_Chi_Nhanh)</div>
        <div>Điện thoại: (Dien_Thoai_Chi_Nhanh)</div>
      </div>
      
      <div style="text-align: center; margin: 8px 0;">
        <div class="bold">(Tieu_De_In)</div>
        <div>Mã đơn hàng: (Ma_Don_Hang)</div>
        <div>Ngày (Ngay)/(Thang)/(Nam) (Gio):(Phut)</div>
      </div>
      
      <div style="margin: 8px 0;">
        <div>Khách hàng: (Khach_Hang)</div>
        <div>SĐT: (So_Dien_Thoai)</div>
        <div>Địa chỉ: (Dia_Chi_Khach_Hang)</div>
      </div>
      
      <table style="width: 100%; margin: 8px 0;">
        <thead>
          <tr>
            <th style="width: 50%;">Tên hàng</th>
            <th style="width: 15%; text-align: center;">SL</th>
            <th style="width: 35%; text-align: right;">T.Tiền</th>
          </tr>
        </thead>
        <tbody>
          ${printData.items.map(item => `
            <tr>
              <td>${item.product_name}</td>
              <td style="text-align: center;">${item.quantity}</td>
              <td style="text-align: right;">${item.total_price.toLocaleString('vi-VN')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div style="text-align: right; margin: 8px 0;">
        <div>Tổng tiền hàng: (Tong_Tien_Hang)</div>
        <div>Chiết khấu: (Chiet_Khau_Hoa_Don)</div>
        <div class="bold">Tổng thanh toán: (Tong_Cong)</div>
      </div>
      
      <div style="text-align: center; margin: 8px 0;">
        <div>(Tong_Cong_Bang_Chu)</div>
        <div>(Ma_QR)</div>
        <div>Cảm ơn và hẹn gặp lại!</div>
      </div>
    `;

    // Sử dụng template từ editor hoặc template mặc định
    const contentToProcess = templateContent || defaultTemplate;
    
    // Thay thế placeholder bằng dữ liệu thật
    const processedContent = replacePlaceholders(contentToProcess, printData)
      .replace(/class="bold"/g, 'style="font-weight: bold;"')
      .replace(/style="text-align: center;"/g, 'class="text-center"')
      .replace(/style="text-align: right;"/g, 'class="text-right"')
      .replace(/style="text-align: left;"/g, 'class="text-left"');

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Hóa đơn ${printData.order.order_number} - ${paperSize}</title>
        ${thermalCSS}
      </head>
      <body>
        ${processedContent}
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 1000);
  };

  const renderPreview = () => {
    if (!selectedTemplate) return null;

    return (
      <div className="bg-gray-100 h-full w-full" style={{ 
        position: 'relative',
        padding: '4px'
      }}>
        <div className="absolute top-2 right-2 z-10">
          <button className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 transition-colors">
            Sửa mẫu in
          </button>
        </div>

        <div className="bg-white shadow-lg border h-full w-full" style={{ 
          height: 'calc(100% - 8px)',
          padding: '30px',
          fontFamily: 'Arial, sans-serif',
          fontSize: '16px',
          lineHeight: '1.6'
        }}>
          <div className="text-center mb-8">
            <div className="text-lg font-semibold">{printData?.store.logo || '(Logo_Cua_Hang)'}</div>
            <div className="text-lg font-semibold">{printData?.store.name || '(Ten_Cua_Hang)'}</div>
            <div className="text-base">Địa chỉ: {printData?.store.address || '(Dia_Chi_Chi_Nhanh) - (Phuong_Xa_Chi_Nhanh) - (Khu_Vuc_Chi_Nhanh_QH_TP)'}</div>
            <div className="text-base">Điện thoại: {printData?.store.phone || '(Dien_Thoai_Chi_Nhanh)'}</div>
          </div>

          <div className="text-center mb-10 mt-12">
            <div className="text-2xl font-bold">
              {activeTab === 'invoice' ? 'HÓA ĐƠN BÁN HÀNG' : 'HÓA ĐƠN ĐẶT HÀNG'}
            </div>
            <div className="text-base mt-4">
              {activeTab === 'invoice' ? 'Số HD:' : 'Mã đơn hàng:'} {printData?.order.order_number || '(Ma_Don_Hang)'}
            </div>
            <div className="text-base">Ngày {printData?.datetime.day || '(Ngay)'} tháng {printData?.datetime.month || '(Thang)'} năm {printData?.datetime.year || '(Nam)'}</div>
          </div>

          <div className="mb-8 text-base">
            <div className="mb-2">Khách hàng: {printData?.customer.name || '(Khach_Hang)'}</div>
            <div className="mb-2">SĐT: {printData?.customer.phone || '(So_Dien_Thoai)'}</div>
            <div>Địa chỉ: {printData?.customer.address || '(Dia_Chi_Khach_Hang) - (Phuong_Xa_Khach_Hang) - (Khu_Vuc_Khach_Hang_QH_TP)'}</div>
          </div>

          <table className="w-full border-collapse border border-black mb-8 text-base">
            <thead>
              <tr>
                <th className="border border-black p-4 text-left">Đơn giá</th>
                <th className="border border-black p-4 text-center">SL</th>
                <th className="border border-black p-4 text-right">
                  {activeTab === 'invoice' ? 'Thành tiền' : 'T.Tiền'}
                </th>
              </tr>
            </thead>
            <tbody>
              {printData?.items.map((item, index) => (
                <tr key={index}>
                  <td className="border border-black p-4">{item.product_name}</td>
                  <td className="border border-black p-4 text-center">{item.quantity}</td>
                  <td className="border border-black p-4 text-right">{item.total_price.toLocaleString('vi-VN')}</td>
                </tr>
              )) || (
                <tr>
                  <td className="border border-black p-4">(Ten_Hang_Hoa)</td>
                  <td className="border border-black p-4 text-center">(So_Luong)</td>
                  <td className="border border-black p-4 text-right">(Thanh_Tien)</td>
                </tr>
              )}
              <tr>
                <td className="border border-black p-4" colSpan={3}>
                  <div className="text-right space-y-2">
                    <div>Tổng tiền hàng: {printData?.order.subtotal.toLocaleString('vi-VN') || '(Tong_Tien_Hang)'}</div>
                    <div>Chiết khấu {printData?.order.discount_amount && printData.order.discount_amount > 0 ? `${((printData.order.discount_amount / printData.order.subtotal) * 100).toFixed(1)}%` : '(Chiet_Khau_Hoa_Don_Phan_Tram)'}: {printData?.order.discount_amount.toLocaleString('vi-VN') || '(Chiet_Khau_Hoa_Don)'}</div>
                    <div className="font-bold">Tổng thanh toán: {printData?.order.total_amount.toLocaleString('vi-VN') || '(Tong_Cong)'}</div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div className="text-center text-base mt-12">
            <div className="mb-6">{printData ? convertNumberToWords(printData.order.total_amount) : '(Tong_Cong_Bang_Chu)'}</div>
            <div className="mb-6">{printData?.store.qr_code || '(Ma_QR)'}</div>
            <div>{activeTab === 'invoice' ? <em>Cảm ơn và hẹn gặp lại!</em> : 'Cảm ơn và hẹn gặp lại!'}</div>
            {activeTab === 'invoice' && (
              <div style={{ fontSize: '10px', marginTop: '10px' }}>
                <em>Powered by KIOTVIET</em>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const editingFieldData = selectedTemplate?.fields.find(f => f.id === editingField);

  // Tự động chuyển sang tab invoice khi có orderId
  useEffect(() => {
    if (orderId) {
      setActiveTab('invoice');
    }
  }, [orderId]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <span>←</span>
              <span>Quay lại</span>
            </button>
            <div className="h-6 w-px bg-gray-300"></div>
            <h1 className="text-2xl font-bold text-gray-900">Mẫu in</h1>
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200">
        <div className="px-6">
          <div className="flex space-x-8">
            <button 
              onClick={() => setActiveTab('order')}
              className={`py-3 px-1 border-b-2 font-medium ${
                activeTab === 'order' 
                  ? 'border-green-500 text-green-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Đặt hàng
            </button>
            <button 
              onClick={() => setActiveTab('invoice')}
              className={`py-3 px-1 border-b-2 font-medium ${
                activeTab === 'invoice' 
                  ? 'border-green-500 text-green-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Hóa đơn
            </button>
            <button 
              onClick={() => setActiveTab('delivery')}
              className={`py-3 px-1 border-b-2 font-medium ${
                activeTab === 'delivery' 
                  ? 'border-green-500 text-green-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Giao hàng
            </button>
            <button 
              onClick={() => setActiveTab('return')}
              className={`py-3 px-1 border-b-2 font-medium ${
                activeTab === 'return' 
                  ? 'border-green-500 text-green-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Trả hàng
            </button>
            <button 
              onClick={() => setActiveTab('exchange')}
              className={`py-3 px-1 border-b-2 font-medium ${
                activeTab === 'exchange' 
                  ? 'border-green-500 text-green-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Đổi trả hàng
            </button>
            <button 
              onClick={() => setActiveTab('purchase_order')}
              className={`py-3 px-1 border-b-2 font-medium ${
                activeTab === 'purchase_order' 
                  ? 'border-green-500 text-green-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Đặt hàng nhập
            </button>
            <button 
              onClick={() => setActiveTab('import')}
              className={`py-3 px-1 border-b-2 font-medium ${
                activeTab === 'import' 
                  ? 'border-green-500 text-green-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Nhập hàng
            </button>
            <button 
              onClick={() => setActiveTab('return_import')}
              className={`py-3 px-1 border-b-2 font-medium ${
                activeTab === 'return_import' 
                  ? 'border-green-500 text-green-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Trả hàng nhập
            </button>
            <button 
              onClick={() => setActiveTab('transfer')}
              className={`py-3 px-1 border-b-2 font-medium ${
                activeTab === 'transfer' 
                  ? 'border-green-500 text-green-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Chuyển hàng
            </button>
            <button 
              onClick={() => setActiveTab('receipt')}
              className={`py-3 px-1 border-b-2 font-medium ${
                activeTab === 'receipt' 
                  ? 'border-green-500 text-green-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Phiếu thu
            </button>
            <button 
              onClick={() => setActiveTab('payment')}
              className={`py-3 px-1 border-b-2 font-medium ${
                activeTab === 'payment' 
                  ? 'border-green-500 text-green-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Phiếu chi
            </button>
            <button 
              onClick={() => setActiveTab('comment')}
              className={`py-3 px-1 border-b-2 font-medium ${
                activeTab === 'comment' 
                  ? 'border-green-500 text-green-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Bình luận
            </button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-140px)]">
        <div className="w-1/2 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Mẫu in</h2>
              <select
                value={selectedTemplate?.name || ''}
                className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option>
                  {activeTab === 'order' && 'Mẫu in đặt hàng'}
                  {activeTab === 'invoice' && 'Mẫu in hóa đơn'}
                  {activeTab === 'delivery' && 'Mẫu in giao hàng'}
                  {activeTab === 'return' && 'Mẫu in trả hàng'}
                  {activeTab === 'exchange' && 'Mẫu in đổi trả hàng'}
                  {activeTab === 'purchase_order' && 'Mẫu in đặt hàng nhập'}
                  {activeTab === 'import' && 'Mẫu in nhập hàng'}
                  {activeTab === 'return_import' && 'Mẫu in trả hàng nhập'}
                  {activeTab === 'transfer' && 'Mẫu in chuyển hàng'}
                  {activeTab === 'receipt' && 'Mẫu in phiếu thu'}
                  {activeTab === 'payment' && 'Mẫu in phiếu chi'}
                  {activeTab === 'comment' && 'Mẫu in bình luận'}
                </option>
              </select>
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowTemplateEditor(true)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  ✏️
                </button>
                <button className="p-1 text-gray-400 hover:text-gray-600">
                  ➕
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {selectedTemplate?.fields.map(field => (
                <button
                  key={field.id}
                  onClick={() => setEditingField(editingField === field.id ? null : field.id)}
                  className={`w-full flex items-center justify-between p-3 rounded border text-left transition-colors ${
                    editingField === field.id
                      ? 'bg-blue-50 border-blue-500'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {field.label} - {field.type} - {field.required ? 'Bắt buộc' : 'Tùy chọn'}
                    </div>
                  </div>
                  <div className="text-sm text-gray-400">
                    {field.position.x}, {field.position.y}
                  </div>
                </button>
              ))}
            </div>

            {editingFieldData && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-medium text-gray-900 mb-3">Thuộc tính trường</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nhãn
                    </label>
                    <input
                      type="text"
                      value={editingFieldData.label}
                      onChange={(e) => handleFieldUpdate(editingField!, { label: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        X
                      </label>
                      <input
                        type="number"
                        value={editingFieldData.position.x}
                        onChange={(e) => handleFieldUpdate(editingField!, {
                          position: { ...editingFieldData.position, x: parseInt(e.target.value) || 0 }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Y
                      </label>
                      <input
                        type="number"
                        value={editingFieldData.position.y}
                        onChange={(e) => handleFieldUpdate(editingField!, {
                          position: { ...editingFieldData.position, y: parseInt(e.target.value) || 0 }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rộng
                      </label>
                      <input
                        type="number"
                        value={editingFieldData.size.width}
                        onChange={(e) => handleFieldUpdate(editingField!, {
                          size: { ...editingFieldData.size, width: parseInt(e.target.value) || 0 }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cao
                      </label>
                      <input
                        type="number"
                        value={editingFieldData.size.height}
                        onChange={(e) => handleFieldUpdate(editingField!, {
                          size: { ...editingFieldData.size, height: parseInt(e.target.value) || 0 }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cỡ chữ
                    </label>
                    <input
                      type="number"
                      value={editingFieldData.style.fontSize}
                      onChange={(e) => handleFieldUpdate(editingField!, {
                        style: { ...editingFieldData.style, fontSize: parseInt(e.target.value) || 12 }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Căn chỉnh
                    </label>
                    <select
                      value={editingFieldData.style.textAlign}
                      onChange={(e) => handleFieldUpdate(editingField!, {
                        style: { ...editingFieldData.style, textAlign: e.target.value as any }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="left">Trái</option>
                      <option value="center">Giữa</option>
                      <option value="right">Phải</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Độ đậm
                    </label>
                    <select
                      value={editingFieldData.style.fontWeight}
                      onChange={(e) => handleFieldUpdate(editingField!, {
                        style: { ...editingFieldData.style, fontWeight: e.target.value as any }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="normal">Bình thường</option>
                      <option value="bold">Đậm</option>
                    </select>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setEditingField(null)}
                      className="px-3 py-2 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleSaveField}
                      className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      Lưu
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 bg-gray-100 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Xem trước mẫu in</h2>
              <div className="flex items-center gap-2">
                <select 
                  value={paperSize}
                  onChange={(e) => setPaperSize(e.target.value as '80mm' | '57mm')}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 transition-colors"
                >
                  <option value="80mm">Khổ 80mm</option>
                  <option value="57mm">Khổ 57mm</option>
                </select>
                <button 
                  onClick={handleThermalPrint}
                  className="px-3 py-2 text-sm bg-green-600 text-white border border-green-600 rounded-md hover:bg-green-700 transition-colors"
                >
                  In thử
                </button>
                <button 
                  onClick={handleExportPDF}
                  className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Xuất PDF
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-auto">
            {renderPreview()}
          </div>
        </div>
      </div>

      {showTemplateEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-[95%] h-[95%] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <span className="text-lg font-semibold">Thêm mẫu in đặt hàng</span>
                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">i</span>
                </div>
              </div>
              <button
                onClick={() => setShowTemplateEditor(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
              <div className="w-1/2 border-r border-gray-200 flex flex-col">
                <div className="p-3 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">Tên mẫu in</span>
                      <input
                        type="text"
                        value="Mẫu in đặt hàng"
                        className="px-3 py-1 border border-gray-300 rounded text-sm w-40"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">Mẫu in gợi ý</span>
                      <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                        <option>Khổ K80</option>
                      </select>
                    </div>
                    <div className="text-sm font-medium text-blue-600">
                      Xem trước mẫu in
                    </div>
                  </div>
                </div>

                <div className="p-2 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center gap-1">
                    <button onClick={handleUndo} className="p-1 hover:bg-gray-200 rounded" title="Undo">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd"/>
                      </svg>
                    </button>
                    <button onClick={handleRedo} className="p-1 hover:bg-gray-200 rounded" title="Redo">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"/>
                      </svg>
                    </button>
                    <button onClick={handleCopy} className="p-1 hover:bg-gray-200 rounded" title="Copy">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"/>
                        <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"/>
                      </svg>
                    </button>
                    <button onClick={handlePaste} className="p-1 hover:bg-gray-200 rounded" title="Paste">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z"/>
                        <path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11.586l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L11 11.586V16a1 1 0 102 0v-4.414l2.293 2.293A1 1 0 0016.707 12.5L15 11.586z"/>
                      </svg>
                    </button>
                    <button onClick={handlePrint} className="p-1 hover:bg-gray-200 rounded" title="Print">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zM5 14H4v-3h1v3zm1 0v2h8v-2H6z" clipRule="evenodd"/>
                      </svg>
                    </button>

                    <div className="w-px h-4 bg-gray-300 mx-1"></div>

                    <button onClick={handleBold} className="p-1 hover:bg-gray-200 rounded font-bold text-sm" title="Bold">B</button>
                    <button onClick={handleItalic} className="p-1 hover:bg-gray-200 rounded italic text-sm" title="Italic">I</button>
                    <button onClick={handleUnderline} className="p-1 hover:bg-gray-200 rounded underline text-sm" title="Underline">U</button>
                    <button onClick={handleSubscript} className="p-1 hover:bg-gray-200 rounded text-sm" title="Subscript">X₂</button>
                    <button onClick={handleSuperscript} className="p-1 hover:bg-gray-200 rounded text-sm" title="Superscript">X²</button>

                    <div className="w-px h-4 bg-gray-300 mx-1"></div>

                    <button onClick={handleBulletList} className="p-1 hover:bg-gray-200 rounded" title="Bullet List">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 100 2 1 1 0 000-2zM6 4a1 1 0 011-1h10a1 1 0 110 2H7a1 1 0 01-1-1zM3 9a1 1 0 100 2 1 1 0 000-2zM6 9a1 1 0 011-1h10a1 1 0 110 2H7a1 1 0 01-1-1zM3 14a1 1 0 100 2 1 1 0 000-2zM6 14a1 1 0 011-1h10a1 1 0 110 2H7a1 1 0 01-1-1z" clipRule="evenodd"/>
                      </svg>
                    </button>
                    <button onClick={handleNumberedList} className="p-1 hover:bg-gray-200 rounded" title="Numbered List">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 000 2v1a1 1 0 001 1h1a1 1 0 100-2v-1a1 1 0 00-1-1H3zM3 13v-1a1 1 0 011-1h1a1 1 0 110 2H4a1 1 0 00-1 1v1a1 1 0 001 1h1a1 1 0 110 2H4a1 1 0 01-1-1zM8 4a1 1 0 011-1h8a1 1 0 110 2H9a1 1 0 01-1-1zM8 8a1 1 0 011-1h8a1 1 0 110 2H9a1 1 0 01-1-1zM8 12a1 1 0 011-1h8a1 1 0 110 2H9a1 1 0 01-1-1zM8 16a1 1 0 011-1h8a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd"/>
                      </svg>
                    </button>

                    <div className="w-px h-4 bg-gray-300 mx-1"></div>

                    <button onClick={handleAlignLeft} className="p-1 hover:bg-gray-200 rounded" title="Align Left">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
                      </svg>
                    </button>
                    <button onClick={handleAlignCenter} className="p-1 hover:bg-gray-200 rounded" title="Align Center">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm2 4a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm-2 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm2 4a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd"/>
                      </svg>
                    </button>
                    <button onClick={handleAlignRight} className="p-1 hover:bg-gray-200 rounded" title="Align Right">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm6 4a1 1 0 011-1h6a1 1 0 110 2h-6a1 1 0 01-1-1zm-6 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm6 4a1 1 0 011-1h6a1 1 0 110 2h-6a1 1 0 01-1-1z" clipRule="evenodd"/>
                      </svg>
                    </button>

                    <div className="w-px h-4 bg-gray-300 mx-1"></div>

                    <select 
                      className="px-2 py-1 border border-gray-300 rounded text-xs bg-white"
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === 'h1') execCommand('formatBlock', '<h1>');
                        else if (value === 'h2') execCommand('formatBlock', '<h2>');
                        else if (value === 'p') execCommand('formatBlock', '<p>');
                      }}
                    >
                      <option value="">Styles</option>
                      <option value="h1">Heading 1</option>
                      <option value="h2">Heading 2</option>
                      <option value="p">Normal</option>
                    </select>
                    <select className="px-2 py-1 border border-gray-300 rounded text-xs bg-white">
                      <option>Format</option>
                      <option>Paragraph</option>
                      <option>Quote</option>
                      <option>Code</option>
                    </select>
                    <select 
                      className="px-2 py-1 border border-gray-300 rounded text-xs bg-white"
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value) handleFontName(value);
                      }}
                    >
                      <option value="">Font</option>
                      <option value="Arial">Arial</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Courier New">Courier New</option>
                    </select>
                    <select 
                      className="px-2 py-1 border border-gray-300 rounded text-xs bg-white"
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value) handleFontSize(value);
                      }}
                    >
                      <option value="">Size</option>
                      <option value="1">10px</option>
                      <option value="2">12px</option>
                      <option value="3">14px</option>
                      <option value="4">16px</option>
                      <option value="5">18px</option>
                    </select>
                  </div>
                </div>

                <div className="flex-1 p-4">
                  <div
                    ref={editorRef}
                    contentEditable
                    onInput={handleEditorInput}
                    className="w-full h-full border-2 border-blue-500 rounded p-3 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none overflow-auto"
                    style={{ 
                      fontFamily: 'Arial, sans-serif',
                      lineHeight: '1.5',
                      minHeight: '100%'
                    }}
                    dangerouslySetInnerHTML={{ __html: templateContent }}
                    suppressContentEditableWarning={true}
                  />
                </div>
              </div>

              <div className="w-1/2 bg-gray-100 flex flex-col">
                <div className="p-3 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Xem trước mẫu in</span>
                  </div>
                </div>
                <div className="flex-1 p-2 overflow-auto">
                  <div className="bg-white shadow-lg border h-full w-full" style={{ 
                    padding: '30px',
                    fontFamily: 'Arial, sans-serif',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    minHeight: 'calc(100% - 4px)'
                  }}>
                    <div 
                      className="text-gray-800 h-full"
                      dangerouslySetInnerHTML={{ __html: templateContent }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowTemplateEditor(false)}
                className="px-6 py-2 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
              >
                Bỏ qua
              </button>
              <button
                onClick={handleSaveTemplate}
                className="px-6 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrintTemplateManager; 