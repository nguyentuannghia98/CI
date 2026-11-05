'use client';

import { useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function ResetPasswordPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    if (password.length < 6) {
      setError('Mật khẩu phải ít nhất 6 ký tự.');
      return;
    }

    setLoading(true);

    // Supabase tự động nhận diện session từ URL khi người dùng click từ Email
    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage('Mật khẩu đã được cập nhật thành công!');
      // Chuyển hướng sau 2 giây
      setTimeout(() => {
        router.push('/'); 
      }, 2000);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 p-8 rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
          Thiết lập mật khẩu mới
        </h1>

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          {error && <div className="p-3 bg-red-100 text-red-600 text-sm rounded">{error}</div>}
          {message && <div className="p-3 bg-green-100 text-green-600 text-sm rounded">{message}</div>}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Mật khẩu mới
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Xác nhận mật khẩu mới
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 w-full px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg transition duration-200 disabled:opacity-50"
          >
            {loading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
          </button>
        </form>
      </div>
    </div>
  );
}