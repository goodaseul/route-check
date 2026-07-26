"use client";

import Image from "next/image";
import type { FormEvent } from "react";
import Input, { type InputProps } from "@/components/common/input/Input";

type SearchBoxProps = Omit<
  InputProps,
  | "type"
  | "value"
  | "onChange"
  | "onClear"
  | "leftIcon"
  | "rightIcon"
  | "rightAction"
> & {
  value: string;
  onChange: (value: string) => void;
  onSearch?: (value: string) => void;
};

export default function SearchBox({
  value,
  onChange,
  onSearch,
  placeholder = "검색어를 입력해 주세요",
  className = "",
  ...props
}: SearchBoxProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearch?.(value.trim());
  };

  const handleSearch = () => {
    onSearch?.(value.trim());
  };

  return (
    <form role="search" onSubmit={handleSubmit}>
      <Input
        {...props}
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        onClear={() => onChange("")}
        rightAction={{
          icon: (
            <Image
              src="/images/icons/search.svg"
              width={24}
              height={24}
              alt=""
              aria-hidden="true"
            />
          ),
          label: "검색",
          onClick: handleSearch,
        }}
        className={`[&::-webkit-search-cancel-button]:appearance-none ${className}`}
      />
    </form>
  );
}
