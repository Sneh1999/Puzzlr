import { MouseEventHandler, useState } from "react";
import { ChevronDownIcon } from "@heroicons/react/solid";

interface Props {
  menu: React.ReactElement;
}

interface MenuItemProps {
  onClick?: MouseEventHandler;
}

export const Menu: React.FC = ({ children }) => (
  <div
    role="none"
    className="rounded-md shadow-lg text-white filter brightness-150"
  >
    {children}
  </div>
);

export const MenuItem: React.FC<MenuItemProps> = ({ children, onClick }) => (
  <div
    className="text-left px-4 py-2 text-sm text-white bg-transparent focus:outline-none cursor-pointer hover:from-npt-dark hover:bg-gray-700"
    onClick={onClick}
  >
    {children}
  </div>
);

export const Dropdown: React.FC<Props> = ({ children, menu }) => {
  const [show, setShow] = useState(false);

  return (
    <div
      className="relative inline-block z-30"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <div>
        <button
          type="button"
          className="inline-flex w-64 rounded-md shadow-sm px-4 py-2 text-sm font-medium focus:outline-none cursor-pointer border-2 border-transparent npd-border-gradient hover:npd-border-gradient"
          id="menu-button"
          aria-expanded="false"
          aria-haspopup="false"
          onClick={() => setShow(!show)}
        >
          <div className="mr-2">{children}</div>
          <ChevronDownIcon className="-mr-1 ml-2 h-5 w-5 absolute right-2" />
        </button>
      </div>
      {show ? (
        <div
          className="origin-top-right absolute z-50 left-0 py-2 w-64 rounded-md shadow-lg bg-npt-dark"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="menu-button"
        >
          {menu}
        </div>
      ) : null}
    </div>
  );
};
