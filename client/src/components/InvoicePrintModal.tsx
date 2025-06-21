import React, { useEffect, useState } from 'react';
import { X, Printer } from 'lucide-react';
import { generateMinimalVietQR, BANK_BINS } from '../utils/vietqr';
import { api, QRPaymentAccount } from '../services/api';

interface InvoicePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderData: {
    order_number: string;
    customer_name?: string;
    customer_phone?: string;
    items: Array<{
      product_name: string;
      quantity: number;
      unit_price: number;
      total: number;
    }>;
    subtotal: number;
    discount_amount: number;
    total_amount: number;
    payment_method: string;
    created_at: string;
  };
}

const InvoicePrintModal: React.FC<InvoicePrintModalProps> = ({
  isOpen,
  onClose,
  orderData
}) => {
  const [qrCode, setQrCode] = useState<string>('');
  const [storeSettings, setStoreSettings] = useState({
    store_name: 'CỬA HÀNG TIỆN LỢI',
    store_address: '123 Đường ABC, Quận XYZ, TP. Hồ Chí Minh',
    store_phone: '0123 456 789',
    store_email: ''
  });

  // Load store settings
  useEffect(() => {
    const loadStoreSettings = async () => {
      try {
        const response = await api.getStoreSettings();
        if (response.data.success) {
          const settings: any = {};
          response.data.data.forEach((setting: any) => {
            settings[setting.setting_key] = setting.setting_value || '';
          });
          
          setStoreSettings({
            store_name: settings.store_name || 'CỬA HÀNG TIỆN LỢI',
            store_address: settings.store_address || '123 Đường ABC, Quận XYZ, TP. Hồ Chí Minh',
            store_phone: settings.store_phone || '0123 456 789',
            store_email: settings.store_email || ''
          });
        }
      } catch (error) {
        console.error('Error loading store settings:', error);
        // Keep default values if loading fails
      }
    };

    if (isOpen) {
      loadStoreSettings();
    }
  }, [isOpen]);

  // Fetch QR account and generate QR code for transfer payments
  useEffect(() => {
    const setupQRCode = async () => {
      if (!orderData || orderData.payment_method !== 'transfer') {
        setQrCode('');
        return;
      }

      try {
        // Fetch QR accounts
        const response = await api.getQRPaymentAccounts();
        let account: QRPaymentAccount | null = null;

        if (response.data.success && response.data.data && response.data.data.length > 0) {
          account = response.data.data[0]; // Use first account
        } else {
          // Fallback account
          account = {
            id: 1,
            provider_id: '970436',
            provider_name: 'Vietcombank',
            provider_type: 'bank',
            account_number: '9356877889',
            account_owner: 'PHAN VAN HUONG',
            phone_number: '',
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
        }

        // Generate QR code using Sepay API
        const qrUrl = generateMinimalVietQR({
          bankBin: account.provider_id,
          accountNumber: account.account_number,
          accountName: account.account_owner,
          amount: orderData.total_amount || 0,
          description: `Thanh toan hoa don ${orderData.order_number || ''}`
        });

        setQrCode(qrUrl);
      } catch (error) {
        console.error('Error generating QR code:', error);
        // Fallback QR code using Sepay API
        const fallbackQRUrl = generateMinimalVietQR({
          bankBin: '970436',
          accountNumber: '9356877889',
          accountName: 'PHAN VAN HUONG',
          amount: orderData.total_amount || 0,
          description: `Thanh toan hoa don ${orderData.order_number || ''}`
        });

        setQrCode(fallbackQRUrl);
      }
    };

    if (isOpen) {
      setupQRCode();
    }
  }, [isOpen, orderData]);

  const handlePrint = () => {
    // Tạo một cửa sổ mới để in
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      // Fallback nếu không thể mở cửa sổ mới
      window.print();
      return;
    }

    // Lấy nội dung HTML của hóa đơn
    const invoiceContent = document.querySelector('.invoice-content')?.innerHTML || '';
    
    // Tạo HTML hoàn chỉnh cho việc in
    const printHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Hóa đơn ${orderData.order_number}</title>
        <style>
          @media print {
            @page {
              size: A4;
              margin: 0.5in;
            }
          }
          
          body {
            font-family: 'Times New Roman', serif;
            font-size: 14px;
            line-height: 1.4;
            color: #000;
            margin: 0;
            padding: 20px;
          }
          
          .invoice-header {
            text-align: center;
            margin-bottom: 30px;
          }
          
          .store-name {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          
          .store-info {
            font-size: 14px;
            margin-bottom: 5px;
          }
          
          .invoice-details {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
          }
          
          .invoice-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          
          .items-table th,
          .items-table td {
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
          }
          
          .items-table th {
            background-color: #f5f5f5;
            font-weight: bold;
          }
          
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          
          .totals {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 30px;
          }
          
          .totals-content {
            width: 300px;
          }
          
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
          }
          
          .total-final {
            border-top: 2px solid #000;
            font-weight: bold;
            font-size: 16px;
            padding-top: 10px;
          }
          
          .thank-you {
            text-align: center;
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 20px;
          }
          
          .qr-code {
            text-align: center;
          }
          
          .qr-code img {
            width: 120px;
            height: 120px;
          }
        </style>
      </head>
      <body>
        <div class="invoice-header">
          <div class="store-name">${storeSettings.store_name}</div>
          <div class="store-info">${storeSettings.store_address}</div>
          <div class="store-info">Điện thoại: ${storeSettings.store_phone}</div>
        </div>

        <div class="invoice-details">
          <div>
            <div class="invoice-title">HÓA ĐƠN BÁN HÀNG</div>
            <div><strong>Số hóa đơn:</strong> ${orderData.order_number || ''}</div>
            <div><strong>Ngày:</strong> ${orderData.created_at ? new Date(orderData.created_at).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN')}</div>
          </div>
          <div class="text-right">
            ${orderData.customer_name ? `
              <div><strong>Khách hàng:</strong> ${orderData.customer_name}</div>
              ${orderData.customer_phone ? `<div><strong>Điện thoại:</strong> ${orderData.customer_phone}</div>` : ''}
            ` : ''}
          </div>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>STT</th>
              <th>Tên sản phẩm</th>
              <th class="text-center">SL</th>
              <th class="text-right">Đơn giá</th>
              <th class="text-right">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            ${(orderData.items || []).map((item, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${item.product_name || ''}</td>
                <td class="text-center">${item.quantity || 0}</td>
                <td class="text-right">${(item.unit_price || 0).toLocaleString('vi-VN')} đ</td>
                <td class="text-right">${(item.total || 0).toLocaleString('vi-VN')} đ</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <div class="totals-content">
            <div class="total-row">
              <span>Tạm tính:</span>
              <span>${(orderData.subtotal || 0).toLocaleString('vi-VN')} đ</span>
            </div>
            ${(orderData.discount_amount || 0) > 0 ? `
              <div class="total-row">
                <span>Giảm giá:</span>
                <span>-${(orderData.discount_amount || 0).toLocaleString('vi-VN')} đ</span>
              </div>
            ` : ''}
            <div class="total-row total-final">
              <span>Tổng cộng:</span>
              <span>${(orderData.total_amount || 0).toLocaleString('vi-VN')} đ</span>
            </div>
            <div class="total-row">
              <span>Phương thức thanh toán:</span>
              <span>
                ${orderData.payment_method === 'cash' ? 'Tiền mặt' : 
                  orderData.payment_method === 'card' ? 'Thẻ' :
                  orderData.payment_method === 'transfer' ? 'Chuyển khoản' :
                  orderData.payment_method === 'e_wallet' ? 'Ví điện tử' : ''}
              </span>
            </div>
          </div>
        </div>

        <div class="thank-you">
          Cảm ơn và hẹn gặp lại!
        </div>

        ${orderData.payment_method === 'transfer' && qrCode ? `
          <div class="qr-code">
            <img src="${qrCode}" alt="QR Code thanh toán" />
          </div>
        ` : ''}
      </body>
      </html>
    `;

    // Ghi nội dung vào cửa sổ mới
    printWindow.document.write(printHTML);
    printWindow.document.close();

    // Đợi hình ảnh tải xong (nếu có QR code)
    printWindow.onload = () => {
      // In ngay lập tức
      printWindow.print();
      
      // Đóng cửa sổ sau khi in
      printWindow.onafterprint = () => {
        printWindow.close();
      };
    };
  };

  if (!isOpen || !orderData) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 print:hidden">
          <h2 className="text-xl font-semibold text-gray-900">Xem trước hóa đơn</h2>
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <Printer className="h-4 w-4" />
              <span>In hóa đơn</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Invoice Content */}
        <div className="p-8 print:p-6 invoice-content">
          {/* Store Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{storeSettings.store_name}</h1>
            <p className="text-gray-600">{storeSettings.store_address}</p>
            <p className="text-gray-600">Điện thoại: {storeSettings.store_phone}</p>
          </div>

          {/* Invoice Details */}
          <div className="flex justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold mb-2">HÓA ĐƠN BÁN HÀNG</h2>
              <p><strong>Số hóa đơn:</strong> {orderData.order_number || ''}</p>
              <p><strong>Ngày:</strong> {orderData.created_at ? new Date(orderData.created_at).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN')}</p>
            </div>
            <div className="text-right">
              {orderData.customer_name && (
                <>
                  <p><strong>Khách hàng:</strong> {orderData.customer_name}</p>
                  {orderData.customer_phone && (
                    <p><strong>Điện thoại:</strong> {orderData.customer_phone}</p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full mb-6 border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="text-left py-2 px-1">STT</th>
                <th className="text-left py-2 px-1">Tên sản phẩm</th>
                <th className="text-center py-2 px-1">SL</th>
                <th className="text-right py-2 px-1">Đơn giá</th>
                <th className="text-right py-2 px-1">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {(orderData.items || []).map((item, index) => (
                <tr key={index} className="border-b border-gray-200">
                  <td className="py-2 px-1">{index + 1}</td>
                  <td className="py-2 px-1">{item.product_name || ''}</td>
                  <td className="py-2 px-1 text-center">{item.quantity || 0}</td>
                  <td className="py-2 px-1 text-right">{(item.unit_price || 0).toLocaleString('vi-VN')} đ</td>
                  <td className="py-2 px-1 text-right">{(item.total || 0).toLocaleString('vi-VN')} đ</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end mb-6">
            <div className="w-64">
              <div className="flex justify-between py-1">
                <span>Tạm tính:</span>
                <span>{(orderData.subtotal || 0).toLocaleString('vi-VN')} đ</span>
              </div>
              {(orderData.discount_amount || 0) > 0 && (
                <div className="flex justify-between py-1">
                  <span>Giảm giá:</span>
                  <span>-{(orderData.discount_amount || 0).toLocaleString('vi-VN')} đ</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-t border-gray-300 font-bold text-lg">
                <span>Tổng cộng:</span>
                <span>{(orderData.total_amount || 0).toLocaleString('vi-VN')} đ</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Phương thức thanh toán:</span>
                <span>
                  {orderData.payment_method === 'cash' && 'Tiền mặt'}
                  {orderData.payment_method === 'card' && 'Thẻ'}
                  {orderData.payment_method === 'transfer' && 'Chuyển khoản'}
                  {orderData.payment_method === 'e_wallet' && 'Ví điện tử'}
                </span>
              </div>
            </div>
          </div>

          {/* Thank you message */}
          <div className="text-center mb-4">
            <p className="text-lg font-medium">Cảm ơn và hẹn gặp lại!</p>
          </div>

          {/* QR Code for transfer payments */}
          {orderData.payment_method === 'transfer' && qrCode && (
            <div className="text-center">
              <img 
                src={qrCode} 
                alt="QR Code thanh toán" 
                className="mx-auto print:w-32 w-32"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoicePrintModal; 