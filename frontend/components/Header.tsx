import { MenuIcon } from "@heroicons/react/outline";
import clsx from "clsx";
import Account from "components/Account";
import { DropdownDos, Menu, MenuItem } from "components/DropdownDos";
import { ROUTES } from "constants/routes";
import useEagerConnect from "hooks/useEagerConnect";
import useGameConfig from "hooks/useGameConfig";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import logo from "public/logo.jpeg";

interface NavLinkProps {
  path: string;
  text: string;
  hoverStyle?: boolean;
}

const MobileNavMenu = () => {
  const config = useGameConfig();

  if (config) {
    return (
      <Menu>
        {config.dropConfig.packPurchasesEnabled && (
          <MenuItem>
            <NavLink path={ROUTES.PACKS} text="Packs" />
          </MenuItem>
        )}
        <MenuItem>
          <NavLink path={ROUTES.PUZZLES} text="Puzzles" />
        </MenuItem>
        <MenuItem>
          <NavLink path={ROUTES.MY_PIECES} text="My Pieces" />
        </MenuItem>
        <MenuItem>
          <NavLink path={ROUTES.WINNINGS} text="Winnings" />
        </MenuItem>
        <MenuItem>
          <NavLink path={ROUTES.MARKETPLACE} text="Marketplace" />
        </MenuItem>
      </Menu>
    );
  }

  return null;
};

const NavLink = ({ path, text, hoverStyle }: NavLinkProps) => {
  const router = useRouter();

  return (
    <Link
      href={{
        pathname: path,
        query: { game: router.query.game },
      }}
    >
      <a
        className={clsx({
          "text-white": router.pathname === path,
          "hover:text-gray-400": hoverStyle,
        })}
      >
        {text}
      </a>
    </Link>
  );
};

export const Header = () => {
  const router = useRouter();
  const triedToEagerConnect = useEagerConnect();

  const config = useGameConfig();

  return (
    <header className="border-b border-gray-700">
      <div className="flex h-24 px-12 justify-between items-center w-full mx-auto">
        <div className="flex items-center">
          <div className="mt-1 mr-0 cursor-pointer">
            <Link href={ROUTES.HOME}>
              <div className="cursor-pointer text-2xl mr-10 mb-2">Puzzlr</div>
            </Link>
          </div>
          {config ? (
            <nav className="hidden lg:flex space-x-6 text-gray-500 text-sm font-bold">
              {config.dropConfig.packPurchasesEnabled && (
                <NavLink hoverStyle path={ROUTES.PACKS} text="Packs" />
              )}
              <NavLink hoverStyle path={ROUTES.PUZZLES} text="Puzzles" />
              <NavLink hoverStyle path={ROUTES.MY_PIECES} text="My Pieces" />
              <NavLink hoverStyle path={ROUTES.WINNINGS} text="Winnings" />
              <NavLink
                hoverStyle
                path={ROUTES.MARKETPLACE}
                text="Marketplace"
              />
            </nav>
          ) : null}
        </div>
        <div className="flex items-center">
          <div className="flex space-x-4"></div>
          <Account triedToEagerConnect={triedToEagerConnect} />
          <div className="pl-8 cursor-pointer lg:hidden">
            <DropdownDos menu={<MobileNavMenu />}>
              <MenuIcon className="w-7 h-7" />
            </DropdownDos>
          </div>
        </div>
      </div>
    </header>
  );
};
