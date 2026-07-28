import Image from "next/image";
import styles from "./DashboardEffect.module.css";

export default function DashboardEffect() {
  return (
    <section
      className="
            relative mt-4 aspect-4/3 w-full
            bg-[url('/images/dashboard/bg.png')]
            bg-size-[100%_auto]
            bg-center
            bg-no-repeat
        "
    >
      <div className="absolute left-[11.667%] top-[13.333%] w-[20.833%]">
        <Image
          className={`${styles.leftText} h-auto w-full rounded-2xl shadow-[0_0_30px_0_rgba(0,46,101,0.1)]`}
          src="/images/dashboard/txt-obj-left.svg"
          alt="대시보드 왼쪽 텍스트 오브젝트"
          width={100}
          height={90}
        />
      </div>

      <div className="absolute bottom-[30%] left-[16.667%] w-[10.833%]">
        <Image
          className={`${styles.leftIcon} h-auto w-full rounded-full shadow-[0_0_30px_0_rgba(0,46,101,0.1)]`}
          src="/images/dashboard/icon-obj-left.svg"
          alt="대시보드 왼쪽 아이콘 오브젝트"
          width={52}
          height={52}
        />
      </div>

      <div className="absolute left-1/2 top-1/2 w-[39.167%] -translate-1/2">
        <Image
          className={`${styles.centerObject} h-auto w-full`}
          src="/images/dashboard/obj-center.svg"
          alt="대시보드 가운데 오브젝트"
          width={188}
          height={223}
        />
      </div>

      <div className="absolute right-[7.917%] top-[22.222%] w-1/4">
        <Image
          className={`${styles.rightText} h-auto w-full rounded-2xl shadow-[0_0_30px_0_rgba(0,46,101,0.1)]`}
          src="/images/dashboard/txt-obj-right.svg"
          alt="대시보드 오른쪽 텍스트 오브젝트"
          width={120}
          height={90}
        />
      </div>

      <div className="absolute right-[15%] bottom-[23.333%] w-[10.833%]">
        <Image
          className={`${styles.rightIcon} h-auto w-full rounded-full shadow-[0_0_30px_0_rgba(0,46,101,0.1)]`}
          src="/images/dashboard/icon-obj-right.svg"
          alt="대시보드 오른쪽 아이콘 오브젝트"
          width={52}
          height={52}
        />
      </div>
    </section>
  );
}
