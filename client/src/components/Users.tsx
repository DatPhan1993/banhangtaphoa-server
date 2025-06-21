import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Users as UsersIcon, Shield, User, X, Eye, EyeOff } from 'lucide-react';

interface User {
  id: number;
  username: string;
  full_name: string;
  role: 'admin' | 'sales' | 'warehouse' | 'accountant' | 'delivery';
  is_active: boolean;
  created_at: string;
}

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data
    setUsers([
      {
        id: 1,
        username: 'admin',
        full_name: 'Quản trị viên',
        role: 'admin',
        is_active: true,
        created_at: new Date().toISOString()
      }
    ]);
    setLoading(false);
  }, []);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <UsersIcon className="w-8 h-8 text-blue-600" />
          Quản lý người dùng
        </h1>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-6">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Người dùng
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vai trò
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                        <div className="text-sm text-gray-500">@{user.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="bg-red-100 text-red-800 px-2 py-1 text-xs font-semibold rounded-full">
                      Quản trị viên
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="bg-green-100 text-green-800 px-2 py-1 text-xs font-semibold rounded-full">
                      Hoạt động
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Users;
 