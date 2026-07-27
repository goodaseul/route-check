import Desc from "@/components/common/desc/Desc";
import SelectionCard from "@/components/common/selection-card/SelectionCard";
import SelectionCardDesc from "@/components/common/selection-card/SelectionCardDesc";
import Title from "@/components/common/title/Title";
import Image from "next/image";
import styles from "./page.module.css";
import Header from "@/components/layout/Header";
import Inner from "@/components/layout/Inner";

export default function page() {
  return (
    <>
      <Header />
      <Inner>
        <main className="pt-16 pb-10">
          <section className="text-center flex flex-col gap-3">
            <Title>
              내 여행 계획, <br />
              어디까지 준비 되셨나요
            </Title>
            <Desc>
              루트체크가 일정 분석부터
              <br />
              개선까지 도와드릴게요
            </Desc>
          </section>
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
          <section className="flex flex-col gap-3">
            <SelectionCard type="plan">
              <SelectionCardDesc
                title="여행 계획이 있어요"
                desc="계획한 일정을 분석해드릴게요"
              />
            </SelectionCard>
            <SelectionCard toastMessage="준비 중이에요" type="date">
              <SelectionCardDesc
                title="여행 날짜만 정했어요"
                desc="날짜를 기준으로 일정을 구성할게요"
              />
            </SelectionCard>
          </section>
        </main>
      </Inner>
    </>
  );
}
