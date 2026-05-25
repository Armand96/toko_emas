import ReactDOM from 'react-dom';
import { useEffect, useState } from 'react';
import clsx from 'clsx';
import WarningIcon from '../assets/images/modal_icon/warning_icon.svg';
import SuccessIcon from '../assets/images/modal_icon/success_icon.svg';
import ErrorIcon from '../assets/images/modal_icon/error_icon.svg';
import CameraIconError from '../assets/images/modal_icon/camera_error_icon.svg';
import BlockIcon from '../assets/images/modal_icon/block_icon.svg';
import WaitingIcon from '../assets/images/modal_icon/waiting_icon.svg';
import TextArea from './FormElement/SingleElement/TextArea';

export default function AlertModal({ title, isAutoClose, message, icon, confirmText, cancelText, onClose, handleCancel, handleConfirm, classNameCustom = '', isDisable = false, textarea, placeholder }) {
  const [show, setShow] = useState(false);
  const [value, setValue] = useState('');

  useEffect(() => {
    setTimeout(() => setShow(true), 10);
    const handleEsc = (e) => {
      if (e.key === 'Escape') handleClose(false);
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, []);

  useEffect(() => {
    if (isAutoClose) {
      setTimeout(() => {
        onClose();
      }, [1800]);
    }
  }, [isAutoClose]);

  const handleClose = (result) => {
    setShow(false);
    if (handleCancel) {
      handleCancel();
    }
    setTimeout(() => {
      onClose(result, value);
    }, 200);
  };

  return ReactDOM.createPortal(
    <div className={clsx('fixed p-6 inset-0 z-2000 flex items-center justify-center transition-opacity overflow-y-auto duration-200', show ? 'opacity-100' : 'opacity-0')}>
      {<div onClick={() => handleClose(false)} className={clsx('fixed inset-0 bg-[#0006] z-0', show ? 'opacity-50' : 'opacity-0')}></div>}
      <div className={clsx('bg-white max-w-[334px] p-8 rounded-lg transform transition-all duration-200', show ? 'opacity-100 scale-100' : 'opacity-0 scale-90', classNameCustom)}>
        <div className="flex flex-col gap-4">
          {icon === 'warning' && <img src={WarningIcon} alt="Warning" className="w-[60px] h-[60px] mx-auto" />}
          {icon === 'success' && <img src={SuccessIcon} alt="success" className="w-[60px] h-[60px] mx-auto" />}
          {icon === 'error' && <img src={ErrorIcon} alt="error" className="w-[60px] h-[60px] mx-auto" />}
          {icon === 'error-camera' && <img src={CameraIconError} alt="error" className="w-[60px] h-[60px] mx-auto" />}
          {icon === 'blocked' && <img src={BlockIcon} alt="blocked" className="w-[60px] h-[60px] mx-auto" />}
          {icon === 'waiting' && <img src={WaitingIcon} alt="waiting" className="w-[60px] h-[60px] mx-auto" />}
          <h2 className="text-lg text-center font-bold">{title}</h2>
          <div className="text-[#5A5A66] mx-auto text-center">{message}</div>
          {textarea && <TextArea placeholder={placeholder} onChange={(e) => setValue(e)} value={value} />}
        </div>
        {(confirmText || cancelText) && (
          <div className="flex justify-center mt-6 space-x-2">
            {cancelText && (
              <button className="px-4 py-2 btn-outline rounded-[50px] w-3/6" onClick={() => handleClose(false)}>
                {cancelText}
              </button>
            )}
            {confirmText && (
              <button
                className={`px-4 py-2 btn-primary rounded-[50px] text-nowrap text-white ${cancelText ? 'w-3/6' : 'w-full'}  hover:bg-red-600 transition-colors`}
                disabled={isDisable || (textarea && !value)}
                onClick={() => {
                  handleClose(true);
                  if (handleConfirm) {
                    textarea ? handleConfirm(value) : handleConfirm();
                  }
                }}
              >
                {confirmText}
              </button>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
