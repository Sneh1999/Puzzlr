import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/solid";
import clsx from "clsx";

const MAX_PAGE_COUNT = 9;
const BASE_PAGE_NUM_STYLE =
  "relative inline-flex justify-center items-center w-10 py-2 text-sm font-medium";

interface PageNumberProps {
  pageNum: number;
  isSelected: boolean;
  onClick: (n: number) => void;
}

interface PageButtonProps {
  className?: string;
  onClick: () => void;
}

interface Props {
  pageCount: number;
  onPageChange: (n: number) => void;
  value: number;
}

const PageNumber: React.FC<PageNumberProps> = ({
  pageNum,
  isSelected,
  onClick,
}) => {
  return (
    <a
      role="button"
      onClick={() => onClick(pageNum)}
      className={clsx(BASE_PAGE_NUM_STYLE, "hover:text-white", {
        "text-gray-500": !isSelected,
        "bg-gray-700": isSelected,
        "text-gray-300": isSelected,
        "rounded-full": isSelected,
      })}
    >
      {pageNum}
    </a>
  );
};

const Dots: React.FC = ({}) => {
  return (
    <a role="button" className={clsx(BASE_PAGE_NUM_STYLE, "text-gray-500")}>
      ...
    </a>
  );
};

const PageButton: React.FC<PageButtonProps> = ({
  children,
  className,
  onClick,
}) => (
  <a
    role="button"
    onClick={onClick}
    className={clsx(
      "px-4 py-2 border border-gray-700 text-sm font-medium rounded-md text-gray-500 hover:text-white",
      { [className]: !!className }
    )}
  >
    {children}
  </a>
);

const PageArrow: React.FC<PageButtonProps> = ({
  children,
  className,
  onClick,
}) => (
  <a
    role="button"
    onClick={onClick}
    className={clsx(
      "relative inline-flex items-center px-2 py-2 rounded-full text-sm font-medium text-gray-500 hover:text-white",
      { [className]: !!className }
    )}
  >
    {children}
  </a>
);

export const Pagination: React.FC<Props> = ({
  pageCount,
  onPageChange,
  value,
}) => {
  const renderPages = (totalPageCount: number): React.FC<PageNumberProps>[] => {
    let pages = [];
    for (let i = 1; i <= totalPageCount; i++) {
      if (totalPageCount < MAX_PAGE_COUNT) {
        pages.push(
          <PageNumber
            pageNum={i}
            isSelected={value === i}
            onClick={onPageChange}
          />
        );
      } else {
        // always show the first and last page
        if (i === 1 || i === totalPageCount) {
          pages.push(
            <PageNumber
              pageNum={i}
              isSelected={value === i}
              onClick={onPageChange}
            />
          );
        } else if (value <= MAX_PAGE_COUNT - 2) {
          if (i <= MAX_PAGE_COUNT - 2) {
            pages.push(
              <PageNumber
                pageNum={i}
                isSelected={value === i}
                onClick={onPageChange}
              />
            );
          } else if (i === totalPageCount - 1) {
            pages.push(<Dots />);
          }
        } else if (value >= totalPageCount - MAX_PAGE_COUNT + 3) {
          if (i >= totalPageCount - MAX_PAGE_COUNT + 3) {
            pages.push(
              <PageNumber
                pageNum={i}
                isSelected={value === i}
                onClick={onPageChange}
              />
            );
          } else if (i === 2) {
            pages.push(<Dots />);
          }
        } else {
          if (i === 2 || i === totalPageCount - 1) {
            pages.push(<Dots />);
          } else if (i > value - 3 && i < value + 3) {
            pages.push(
              <PageNumber
                pageNum={i}
                isSelected={value === i}
                onClick={onPageChange}
              />
            );
          }
        }
      }
    }
    return pages;
  };
  const previousPage = () => {
    if (value > 1) {
      onPageChange(value - 1);
    }
  };
  const nextPage = () => {
    if (value < pageCount) {
      onPageChange(value + 1);
    }
  };

  return (
    <div className="py-3 flex items-center justify-between">
      <div className="flex-1 flex justify-center sm:hidden">
        <PageButton onClick={previousPage}>Previous</PageButton>
        <PageButton className="ml-3" onClick={nextPage}>
          Next
        </PageButton>
      </div>
      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-center">
        <div>
          <nav
            className="relative inline-flex rounded-md shadow-sm -space-x-px z-10"
            aria-label="Pagination"
          >
            <PageArrow onClick={previousPage}>
              <span className="sr-only">Previous</span>
              <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
            </PageArrow>
            {renderPages(pageCount)}
            <PageArrow onClick={nextPage}>
              <span className="sr-only">Next</span>
              <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
            </PageArrow>
          </nav>
        </div>
      </div>
    </div>
  );
};
