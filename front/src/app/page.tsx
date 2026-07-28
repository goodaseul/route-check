import Desc from "@/components/common/desc/Desc";
import SelectionCard from "@/components/common/selection-card/SelectionCard";
import SelectionCardDesc from "@/components/common/selection-card/SelectionCardDesc";
import Title from "@/components/common/title/Title";

import Header from "@/components/layout/Header";
import Inner from "@/components/layout/Inner";
import DashboardEffect from "./_components/dashboard/DashboardEffect";

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
          <DashboardEffect />
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
