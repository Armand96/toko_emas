import { BeatLoader } from 'react-spinners';

const LoadingComponent = () => {
  return (
    <div className="flex justify-center items-center fixed z-[99999] bg-gray-200 opacity-80 inset-x-0 inset-y-0">
      <BeatLoader size={45} color="#4440A8" backColor="#4440A8" />
    </div>
  );
};

export default LoadingComponent;
