import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { UserIcon, EyeIcon, EyeSlashIcon, LockKeyIcon } from '@phosphor-icons/react';
import InputGroup from '../../components/FormElement/InputGroup';
import { showAlert } from '../../utils/showAlert';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username atau Email wajib diisi';
    }
    if (!formData.password) {
      newErrors.password = 'Password wajib diisi';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showAlert({
        title: 'Validasi Gagal',
        message: 'Mohon periksa kembali username dan password Anda.',
        icon: 'danger'
      });
      return;
    }

    setIsLoading(true);

    setTimeout(async () => {
      setIsLoading(false);
     navigate('/table');
    }, 1500);
  };

  const formFields = [
    {
      type: 'text',
      label: 'Username / Email',
      name: 'username',
      value: formData.username,
      placeholder: 'Masukkan username atau email',
      isRequired: true,
      error: errors.username,
      onChange: handleChange,
      icon: <UserIcon size={18} />
    },
    {
      type: 'password',
      label: 'Password',
      name: 'password',
      value: formData.password,
      placeholder: '••••••••',
      isRequired: true,
      error: errors.password,
      onChange: handleChange,
      icon: <LockKeyIcon size={18} />,
      showPassword: showPassword,
      onTogglePassword: () => setShowPassword(!showPassword),
      toggleIcon: showPassword ? <EyeSlashIcon size={18} /> : <EyeIcon size={18} />
    }
  ];

  return (
    <div className="min-h-screen w-full flex bg-[#F8FAFC]">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#1E293B] to-[#0F172A] p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#f3810d_1px,transparent_1px)] [background-size:16px_16px]"></div>

        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#f3810d] to-[#d75e08] flex items-center justify-center shadow-lg shadow-orange-500/20">
            <span className="text-white font-bold text-xl">G</span>
          </div>
          <span className="text-white font-bold text-xl tracking-wider">GOLD SYSTEM</span>
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Kelola Aset Dan Transaksi Emas Lebih Efisien.
          </h1>
          <p className="text-slate-400 text-lg">
            Sistem pergudangan dan kasir terintegrasi khusus untuk ekosistem toko perhiasan modern.
          </p>
        </div>

        <div className="relative z-10 text-slate-500 text-sm">
          &copy; 2026 Proyek Toko Emas. All rights reserved.
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-white">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-[#121212] tracking-tight">
              Selamat Datang
            </h2>
            <p className="text-sm text-slate-500">
              Silakan masukkan akun Anda untuk mengakses sistem dashboard
            </p>
          </div>

          <div
            className="space-y-6"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSubmit();
              }
            }}
          >
            <div className="space-y-4">
              <InputGroup fields={formFields} formData={formData} formError={errors} onChange={handleChange} isDisable={isLoading} />
            </div>


            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full btn-primary  text-white font-medium py-2.5 px-4 rounded-lg text-sm shadow-md shadow-orange-500/10 focus:outline-none focus:ring-2 focus:ring-[#f3810d]/50 focus:ring-offset-2 transition-all duration-150 flex justify-center items-center gap-2 cursor-pointer disabled:from-slate-300 disabled:to-slate-400 disabled:text-slate-200 disabled:cursor-no-drop disabled:shadow-none"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                'Masuk ke Akun'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
