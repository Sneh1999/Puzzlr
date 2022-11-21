import { Dispatch, SetStateAction, useState } from "react";
import { ChevronDownIcon } from "@heroicons/react/solid";

interface Props {
  items: string[];
  icon?: JSX.Element;
  currentValue: string;
  setValue: Dispatch<SetStateAction<string>>;
}

export const Select: React.FC<Props> = ({
  items,
  icon,
  currentValue,
  setValue,
}) => {
  const [displayDropdown, setDisplayDropdown] = useState<boolean>(false);

  const setCurrent = (index) => {
    setValue(items[index]);
    setDisplayDropdown(!displayDropdown);
  };

  return (
    <div className="relative inline-block z-10">
      <div>
        <button
          type="button"
          className="inline-flex w-64 rounded-lg shadow-sm px-4 py-2 text-sm font-medium focus:outline-none cursor-pointer border-2 border-transparent npd-border-gradient hover:npd-border-gradient"
          id="menu-button"
          aria-expanded="false"
          aria-haspopup="false"
          onClick={() => setDisplayDropdown(!displayDropdown)}
        >
          {icon ? <div className="mr-2">{icon}</div> : null}
          <div className="mr-2">{currentValue}</div>
          <ChevronDownIcon className="-mr-1 ml-2 h-5 w-5 absolute right-2" />
        </button>
      </div>
      {displayDropdown ? (
        <div
          className="origin-top-right absolute z-50 left-0 mt-2 w-64 rounded-md shadow-lg bg-npt-dark"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="menu-button"
        >
          <div
            role="none"
            className="rounded-md shadow-lg text-white filter brightness-150"
          >
            {items.map((item, index) => (
              <div
                className="text-left px-4 py-2 text-sm text-white bg-transparent focus:outline-none cursor-pointer hover:from-npt-dark  hover:bg-gray-700"
                key={index}
                onClick={() => setCurrent(index)}
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};
