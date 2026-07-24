import Image from "next/image";

export default function Header() {
  return (
    <h1>
      <Image src="/logo.svg" width={84} height={24} alt="루트 체크 로고" />
    </h1>
  );
}
