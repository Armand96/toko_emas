import { useState } from 'react';
import { useNavigate } from 'react-router';
import InputGroup from '../../components/FormElement/InputGroup';
import { showAlert } from '../../utils/showAlert';
import Logo from '../../assets/images/logo_login.png';
import AuthService from '../../Services/Auth.apis';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async () => {
    const newErrors = {};
    if (!formData.username.trim()) newErrors.username = 'Username wajib diisi';
    if (!formData.password) newErrors.password = 'Password wajib diisi';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setIsLoading(true);
    try {
      await AuthService.login(formData.username, formData.password);
      // Jangan setIsLoading(false) di sini — komponen akan segera unmount karena navigasi.
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const msg = 'Username atau password salah.';
      showAlert({ "icon": "error" , title: 'Login Gagal', message: msg, confirmText: 'OK' });
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.target.tagName !== 'BUTTON') handleSubmit();
  };

  const formFields = [
    {
      type: 'text',
      label: 'Username',
      name: 'username',
      value: formData.username,
      placeholder: 'Masukkan username',
      isRequired: true,
      onChange: handleChange,
    },
    {
      type: 'password',
      label: 'Password',
      name: 'password',
      value: formData.password,
      placeholder: '••••••••',
      isRequired: true,
      onChange: handleChange,
    },
  ];

  return (
    <div className="w-full min-h-screen bg-gray-50 flex justify-center items-center p-4" onKeyDown={handleKeyDown}>
      <div className="w-full max-w-[440px] bg-neutral-white rounded-2xl border border-gray-100 p-8 shadow-sm">
        <div className="flex flex-col items-center mb-8">
          <img src={Logo} alt="Logo" className="size-[100px] mb-4" />
          <h1 className="text-xl font-semibold text-gray-950 mb-1">Selamat Datang Kembali</h1>
          <p className="text-sm text-gray-500 text-center">Silakan masuk ke sistem untuk mengelola inventori, transaksi, dan operasional toko Anda.</p>
        </div>

        <div className="space-y-4">
          <InputGroup fields={formFields} onChange={handleChange} formData={formData} formError={errors} />

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full btn btn-primary font-medium py-2.5 px-4 rounded-lg text-sm shadow-md shadow-primary-500/10 focus:ring-2 focus:ring-primary-500/50 focus:ring-offset-2 transition-all duration-150 flex justify-center items-center gap-2 mt-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-neutral-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Memproses...</span>
              </>
            ) : (
              <span>Masuk Ke Akun</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
