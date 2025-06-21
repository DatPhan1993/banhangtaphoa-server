import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { generateMinimalVietQR, BANK_BINS } from '../utils/vietqr';
import { api, QRPaymentAccount } from '../services/api';

interface QRPaymentDisplayProps {
  amount: number;
  onAmountChange: (amount: number) => void;
}

const QRPaymentDisplay: React.FC<QRPaymentDisplayProps> = ({ 
  amount, 
  onAmountChange 
}) => {
  const [qrCode, setQrCode] = useState<string>('');
  const [accounts, setAccounts] = useState<QRPaymentAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<QRPaymentAccount | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Automatically set received amount equal to total amount
  useEffect(() => {
    onAmountChange(amount);
  }, [amount, onAmountChange]);

  // Fetch QR accounts and generate QR code
  useEffect(() => {
    const setupQRCode = async () => {
      try {
        console.log('Fetching QR payment accounts...');
        // Fetch QR accounts
        const response = await api.getQRPaymentAccounts();
        console.log('QR payment accounts response:', response);
        
        let account: QRPaymentAccount | null = null;

        if (response.data.success && response.data.data && response.data.data.length > 0) {
          console.log('Using accounts from database:', response.data.data);
          setAccounts(response.data.data);
          account = response.data.data[0]; // Use first account as default
          setSelectedAccount(account);
        } else {
          console.log('No accounts from database, using fallback');
          // Fallback account
          account = {
            id: 1,
            provider_id: '970436', // Vietcombank
            provider_name: 'Vietcombank',
            provider_type: 'bank',
            account_number: '9356877889',
            account_owner: 'PHAN VAN HUONG',
            phone_number: '',
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          setAccounts([account]);
          setSelectedAccount(account);
        }

        // Generate QR code using Sepay API
        if (account) {
          console.log('Generating QR code with account:', account);
          const qrUrl = generateMinimalVietQR({
            bankBin: account.provider_id,
            accountNumber: account.account_number,
            accountName: account.account_owner,
            amount: amount > 0 ? amount : undefined,
            description: amount > 0 ? `Thanh toan don hang ${amount}` : undefined
          });

          setQrCode(qrUrl);
        }
      } catch (error) {
        console.error('Error setting up QR code:', error);
        console.log('Using fallback QR code due to error');
        
        // Use accounts from database if the error is not authentication related
        // This handles cases where API call fails but we want to show real accounts
        try {
          const response = await api.getQRPaymentAccounts();
          if (response.data.success && response.data.data && response.data.data.length > 0) {
            console.log('Successfully got accounts on retry:', response.data.data);
            setAccounts(response.data.data);
            setSelectedAccount(response.data.data[0]);
            
            const qrUrl = generateMinimalVietQR({
              bankBin: response.data.data[0].provider_id,
              accountNumber: response.data.data[0].account_number,
              accountName: response.data.data[0].account_owner,
              amount: amount > 0 ? amount : undefined
            });
            setQrCode(qrUrl);
            return;
          }
        } catch (retryError) {
          console.error('Retry also failed:', retryError);
        }
        
        // Set fallback QR code using Sepay API
        const fallbackQRUrl = generateMinimalVietQR({
          bankBin: '970436',
          accountNumber: '9356877889', 
          accountName: 'PHAN VAN HUONG',
          amount: amount > 0 ? amount : undefined
        });

        setQrCode(fallbackQRUrl);
        
        // Set fallback account for display
        const fallbackAccount = {
          id: 1,
          provider_id: '970436',
          provider_name: 'Vietcombank',
          provider_type: 'bank' as const,
          account_number: '9356877889',
          account_owner: 'PHAN VAN HUONG',
          phone_number: '',
          status: 'active' as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setAccounts([fallbackAccount]);
        setSelectedAccount(fallbackAccount);
      }
    };

    setupQRCode();
  }, [amount]);

  // Handle account selection
  const handleAccountSelect = async (account: QRPaymentAccount) => {
    setSelectedAccount(account);
    setShowDropdown(false);

    try {
      const qrUrl = generateMinimalVietQR({
        bankBin: account.provider_id,
        accountNumber: account.account_number,
        accountName: account.account_owner,
        amount: amount > 0 ? amount : undefined,
        description: amount > 0 ? `Thanh toan don hang ${amount}` : undefined
      });

      setQrCode(qrUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* Account Selection */}
      {accounts.length > 1 && (
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <div className="flex-1 text-left">
              {selectedAccount ? (
                <div>
                  <div className="font-medium text-gray-900">
                    {selectedAccount.account_owner}
                  </div>
                  <div className="text-sm text-gray-500">
                    {selectedAccount.account_number} - {selectedAccount.provider_name}
                  </div>
                </div>
              ) : (
                <span className="text-gray-500">Chọn tài khoản</span>
              )}
            </div>
            <ChevronDown className="h-5 w-5 text-gray-400" />
          </button>

          {showDropdown && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
              {accounts.map((account) => (
                <button
                  key={account.id}
                  onClick={() => handleAccountSelect(account)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg focus:outline-none focus:bg-gray-50"
                >
                  <div className="font-medium text-gray-900">
                    {account.account_owner}
                  </div>
                  <div className="text-sm text-gray-500">
                    {account.account_number} - {account.provider_name}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* QR Code Display */}
      <div className="flex flex-col items-center space-y-4">
        {qrCode && (
          <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
            <img src={qrCode} alt="QR Code thanh toán" className="w-48 h-48" />
          </div>
        )}

        {selectedAccount && (
          <div className="text-center">
            <div className="font-semibold text-lg text-gray-800">
              {selectedAccount.account_owner}
            </div>
            <div className="text-gray-600">
              {selectedAccount.account_number} - {selectedAccount.provider_name}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRPaymentDisplay; 