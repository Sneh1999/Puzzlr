import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/solid";
import { Context, useCallback, useContext, useRef } from "react";

interface ContextProps {
  selected: string;
  toggleItem: (id: string) => () => void;
}

interface AccordionProps {
  selected: string;
  children?: React.ReactNode;
  className?: string;
  context: Context<ContextProps>;
  setSelected: React.Dispatch<React.SetStateAction<string>>;
}

export function Accordion({
  children,
  className,
  context,
  selected,
  setSelected,
}: AccordionProps) {
  const toggleItem = useCallback(
    (id: string) => () => {
      setSelected((prevState) => (prevState !== id ? id : ""));
    },
    []
  );
  return (
    <context.Provider value={{ selected, toggleItem }}>
      <div className={className}>{children}</div>
    </context.Provider>
  );
}

interface AccordionItemProps {
  toggle: string;
  context: Context<ContextProps>;
  children?: React.ReactNode;
}

export function AccordionItem({
  toggle,
  context,
  children,
}: AccordionItemProps) {
  const { selected, toggleItem } = useContext(context);
  return (
    <div
      role="button"
      onClick={toggleItem(toggle)}
      className="flex px-4 items-center justify-between h-14 bg-gray-900 border-b border-gray-800 rounded-md"
    >
      {children}
      <span className="float-right">
        {selected === toggle ? (
          <ChevronUpIcon height={16} />
        ) : (
          <ChevronDownIcon height={16} />
        )}
      </span>
    </div>
  );
}

interface AccordionPanelProps {
  children?: React.ReactNode;
  id: string;
  context: Context<ContextProps>;
}
export function AccordionPanel({ children, id, context }: AccordionPanelProps) {
  const { selected } = useContext(context);
  const ref = useRef<HTMLDivElement>(null);
  const inlineStyle =
    selected === id ? { height: ref.current?.scrollHeight } : { height: 0 };

  return (
    <div
      ref={ref}
      id={id}
      className="overflow-hidden md:overflow-x-hidden transition-height ease duration-300 text-gray-600"
      style={inlineStyle}
    >
      {children}
    </div>
  );
}
