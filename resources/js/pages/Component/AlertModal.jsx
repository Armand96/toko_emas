import { showAlert } from '@/utils/showAlert';
import React from 'react';

const AlertModalPage = () => {
  const handleClick = async () => {
    await showAlert({
      title: 'Yakin mau keluar?',
      message: 'Semua perubahan belum disimpan.',
      confirmText: 'Keluar',
      cancelText: 'Batal',
    }).then((result) => {
      if (result) {
        console.log('Keluar');
      } else {
        console.log('Dibatalkan');
      }
    });
  };

  const alertClick = async () => {
    await showAlert({
      icon: 'success',
      title: 'Keluar Berhasil ',
      message: 'simpan data berhasil.',
    });
  };

    const alertAutoClose = async () => {
    await showAlert({
      icon: 'success',
      title: 'Keluar Berhasil ',
      message: 'simpan data berhasil.',
      isAutoClose: true
    });
  };

  const alertIcon = async (icon) => {
    await showAlert({
      icon: icon,
      title: 'isi teserah',
      message: 'alert dengan icon',
    })
  }



  return (
    <div className="flex flex-col justify-center gap-x-6">
      <h1 className="text-2xl font-bold mb-4">Alert Modal Example</h1>
      <div className="flex justify-center items-center flex-col">
        <p className="text-xl mb-4">Alert dengan tombol</p>
        <button onClick={handleClick} className="px-4 py-2 mt-4 btn-primary rounded">
          Tampilkan Modal
        </button>
      </div>
      <div className="flex justify-center items-center flex-col">
        <p className="text-xl mb-4 mt-6">Alert nya doang tanpa tombol</p>
        <button onClick={alertClick} className="px-4 py-2 mt-4 btn-primary rounded">
          Modal Alert
        </button>
      </div>
       <div className="flex justify-center items-center flex-col">
        <p className="text-xl mb-4 mt-6">Alert nya doang tanpa tombol Auto</p>
        <button onClick={alertAutoClose} className="px-4 py-2 mt-4 btn-primary rounded">
          Modal Alert
        </button>
      </div>
      <div className="flex justify-center items-center flex-col">
        <p className="text-xl mb-4 mt-6">Alert dengan icon</p>

      <div className="flex gap-x-5">
          <button onClick={() => alertIcon('success')} className="px-4 py-2 mt-4 btn-primary rounded">
          success Alert
        </button>
          <button  onClick={() => alertIcon('warning')}  className="px-4 py-2 mt-4 btn-primary rounded">
          warning Alert
        </button>
          <button onClick={() => alertIcon('error')} className="px-4 py-2 mt-4 btn-danger rounded">
          gagal Alert
        </button>
      </div>
      </div>
    </div>
  );
};

export default AlertModalPage;
