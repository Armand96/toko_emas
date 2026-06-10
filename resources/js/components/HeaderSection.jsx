
const HeaderSection = ({ title, description, icon: Icon, onClick, textButton }) => {
  return (
    <div className="flex flex-col lg:flex-row gap-y-3 lg:items-center justify-between p-4">
      <div className="flex flex-col gap-0.5">
        <span className="text-[24px] font-semibold text-gray-950">{title}</span>
        <span className="text-[13px] text-gray-500">{description}</span>
      </div>

      {onClick && (
        <button
          type="button"
          onClick={onClick}
          className="flex items-center gap-x-1 justify-center p-2 btn-primary rounded-lg hover:bg-[#FDE6D4] transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#f3810d]/50"
        >
          <Icon size={28} weight="regular" /> {textButton}
        </button>
      )}
    </div>
  );
};

export default HeaderSection;
