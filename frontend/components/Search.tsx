import { SearchIcon, XCircleIcon } from "@heroicons/react/outline";

interface Props {
  onChange: (v: string) => void;
  placeholder: string;
  value: string;
}

export const Search: React.FC<Props> = ({ onChange, placeholder, value }) => (
  <div className="flex items-center justify-between bg-gray-600 px-4 py-3 ml-3 font-normal text-white text-sm rounded-lg">
    <SearchIcon className="h-4 w-4 mr-2" />
    <input
      className="bg-transparent mr-2 focus:outline-none"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
    <div className="cursor-pointer" onClick={() => onChange("")}>
      <XCircleIcon className="h-4 w-4" />
    </div>
  </div>
);
