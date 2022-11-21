import { MouseEventHandler, useState } from "react";

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
    className="text-right px-4 py-2 text-sm text-white bg-transparent focus:outline-none cursor-pointer hover:from-npt-dark hover:bg-gray-700"
    onClick={onClick}
  >
    {children}
  </div>
);

export const DropdownDos: React.FC<Props> = ({ children, menu }) => {
  const [show, setShow] = useState(false);

  return (
    <div
      className="relative inline-block z-30"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <div onClick={() => setShow(!show)}>{children}</div>
      {show ? (
        <div
          className="origin-top-right absolute z-50 right-0 py-2 rounded-md shadow-lg bg-npt-dark"
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
