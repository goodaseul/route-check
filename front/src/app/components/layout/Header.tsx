import Image from "next/image";
import Inner from "./Inner";
import Link from "next/link";

export default function Header() {
  return (
    <Inner styles="center h-20">
      <h1>
        <Link href="/">
          <Image src="/logo.svg" width={84} height={24} alt="루트 체크 로고" />
        </Link>
      </h1>
    </Inner>
  );
}
