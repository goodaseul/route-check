"use client";

import Button from "@/components/common/buttons/Button";
import RadioCard from "@/components/common/radio-card/RadioCard";
import SelectionCard from "@/components/common/selection-card/SelectionCard";
import SelectionCardDesc from "@/components/common/selection-card/SelectionCardDesc";
import Tab from "@/components/common/tab/Tab";
import GoogleLogin from "@/components/features/login/GoogleLogin";
import NaverLogin from "@/components/features/login/NaverLogin";
import { useState } from "react";

export default function Common() {
  // Button start
  const [clicked, setClicked] = useState(false);

  const handleClick = () => {
    setClicked((prev) => !prev);
  };

  // Button end

  // RadioCard start
  const [selectedTransport, setSelectedTransport] = useState("car");
  // RadioCard end

  // Tab start
  const totalDays = 3;
  const [selectedDay, setSelectedDay] = useState("day1");
  const dayTabItmes = Array.from({ length: totalDays }, (_, index) => {
    const dayNum = index + 1;
    return {
      label: `Day ${dayNum}`,
      value: `day${dayNum}`,
    };
  });
  // Tab end

  return (
    <div className="">
      <div className="flex flex-col gap-4 p-6">
        {/* Button start */}
        <Button onClick={handleClick}>버튼 텍스트</Button>
        <Button buttonBg="blue" onClick={handleClick}>
          버튼 텍스트
        </Button>
        <Button buttonBg="blue" onClick={handleClick} disabled>
          버튼 텍스트
        </Button>

        {/* Button end */}

        {/* RadioCard start */}
        <RadioCard
          name="transport"
          value="car"
          checked={selectedTransport === "car"}
          onChange={setSelectedTransport}
        >
          자동차
        </RadioCard>
        <RadioCard
          name="transport"
          value="public"
          checked={selectedTransport === "public"}
          onChange={setSelectedTransport}
        >
          자차
        </RadioCard>
        {/* RadioCard end */}

        {/* Tab start */}

        <Tab
          items={dayTabItmes}
          value={selectedDay}
          onChange={setSelectedDay}
        />
        {/* Tab end */}

        {/* SelectionCard start */}
        <SelectionCard type="plan">
          <SelectionCardDesc
            title="여행 계획이 있어요"
            desc="계획한 일정을 분석해드릴게요"
          />
        </SelectionCard>

        <SelectionCard type="date">
          <SelectionCardDesc
            title="여행 날짜만 정했어요"
            desc="날짜를 기준으로 일정을 구성할게요"
          />
        </SelectionCard>

        {/* SelectionCard end */}
      </div>

      {/* SNS Login start */}
      <div className="flex items-center gap-2">
        <GoogleLogin />
        <NaverLogin
          onLoginSuccess={(result) => {
            console.log("메인 화면에서 로그인 결과 받음:", result);
            // 여기서 로그인 상태 저장 (전역 상태, localStorage에 토큰 저장 등)
            // 화면도 "로그인됨" 상태로 바뀌게
          }}
        />
      </div>
      {/* SNS Login end */}
    </div>
  );
}
