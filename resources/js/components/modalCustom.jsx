
import { CheckCircleIcon, XIcon } from '@phosphor-icons/react';
import React, { useEffect, useRef, useState } from 'react';
import ReactModal from 'react-modal';

// counter global untuk melacak urutan modal
let modalStackCounter = 1000;

const ModalCustom = ({
  isOpen,
  disabledBtn,
  onClose,
  title,
  size = '',
  children,
  footer = true,
  customFooter = React.ReactNode,
  header = true,
  handleOnSubmit,
  confirmTextButton,
  cancelTextButton,
  singleButton,
  labelSelected,
  customSize,
  customPadding,
  showCloseIcon = true,
  closeOnOverlayClick = true,
  customHeader = null,
}) => {
  const [zIndex, setZIndex] = useState(1000);
  const scrollContainerRef = useRef(null);
  const savedScrollPositionRef = useRef(0);

  useEffect(() => {
    if (isOpen) {
      modalStackCounter += 2;
      setZIndex(modalStackCounter);

      // Tunggu 2 frame render sebelum restore scroll
      const raf = requestAnimationFrame(() => {
        const raf2 = requestAnimationFrame(() => {
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = savedScrollPositionRef.current;
          }
        });
        return () => cancelAnimationFrame(raf2);
      });

      return () => cancelAnimationFrame(raf);
    }
  }, [isOpen]);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      savedScrollPositionRef.current = scrollContainerRef.current.scrollTop;
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <ReactModal
      isOpen={isOpen}
      onRequestClose={handleClose}
      overlayClassName="overlay"
      shouldCloseOnOverlayClick={closeOnOverlayClick}
      shouldCloseOnEsc={closeOnOverlayClick}
      className={`modal ${customSize} ${size === 'xl' ? 'modal-xl' : ''} ${size === 'lg' ? 'modal-lg' : ''} ${size === 'md' ? 'modal-md' : ''} ${size === 'sm' ? 'modal-sm' : ''} ${size === 'xs' ? 'modal-xs' : ''} max-w-4xl`}
      closeTimeoutMS={100}
      style={{
        overlay: { zIndex },
        content: { zIndex: zIndex + 1 },
      }}
    >
      <div className="flex flex-col">
        {header && (
          <>
            {customHeader ? (
              customHeader
            ) : (
              <div className="flex items-center justify-between border-b border-border-default py-4 px-6">
                <h2 className="text-lg font-semibold text-text-title">{title}</h2>

                {showCloseIcon && <XIcon className="w-6 h-6 text-text-subtitle cursor-pointer" onClick={onClose} />}
              </div>
            )}
          </>
        )}
        <div>
          <div ref={scrollContainerRef} onScroll={handleScroll} className={`max-h-[60vh] lg:max-h-[70vh] overflow-y-auto ${customPadding || 'ps-6 pe-6 py-4'}`}>{children}</div>
        </div>
        {footer ? (
          <div className="border-t border-border-default">
            {customFooter ? (
              customFooter
            ) : (
              <div className="flex justify-between flex-row-reverse items-center px-6 py-4">
                <div className="flex flex-col gap-3 md:flex-row justify-start md:justify-end w-full">
                  {singleButton ? (
                      <button className="btn-primary !w-full  rounded-lg py-2 px-6 order-1 md:order-0" disabled={!!disabledBtn} onClick={() => { savedScrollPositionRef.current = 0; handleOnSubmit()}}>
                      {confirmTextButton}
                    </button>
                  ) : (
                    <>
                      <button className={`btn-outline px-4 mr-2  rounded-lg py-2 order-2 md:order-0 ${size === 'sm' ? 'w-full!' : 'md:w-fit!'}`} onClick={handleClose}>
                        {cancelTextButton || 'Batal'}
                      </button>

                      {confirmTextButton && (
                            <button className={`btn-primary rounded-lg py-2 px-6 ${size === 'sm' ? 'w-full!' : 'md:w-fit!'}`} disabled={!!disabledBtn} onClick={() => { savedScrollPositionRef.current = 0; handleOnSubmit()}}>
                          {confirmTextButton}
                        </button>
                      )}
                    </>
                  )}
                </div>

                {labelSelected && (
                  <div className="flex items-center gap-2">
                    <CheckCircleIcon className="w-6 h-6 text-primary-default" />
                    <p className="text-text-title font-medium">{labelSelected} dipilih</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <></>
        )}
      </div>
    </ReactModal>
  );
};

export default ModalCustom;
