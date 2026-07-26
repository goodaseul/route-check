"use client";

import Button from "@/components/common/buttons/Button";
import Checkbox from "@/components/common/checkbox/Checkbox";
import DateInput from "@/components/common/date-input/DateInput";
import Input from "@/components/common/input/Input";
import PlaceCard from "@/components/common/place-card/PlaceCard";
import RadioCard from "@/components/common/radio-card/RadioCard";
import SearchBox from "@/components/common/search-box/SearchBox";
import SelectionCard from "@/components/common/selection-card/SelectionCard";
import SelectionCardDesc from "@/components/common/selection-card/SelectionCardDesc";
import Tab from "@/components/common/tab/Tab";
import GoogleLogin from "@/components/features/login/GoogleLogin";
import NaverLogin from "@/components/features/login/NaverLogin";
import { useState } from "react";

// Placehoder start
const places = [
  {
    id: "1",
    title: "여행지명",
    desc: "여행지위치",
    imageSrc: null,
  },
  {
    id: "2",
    title: "여행지명여행지명여행지명",
    desc: "여행지위치여행지위치여행지위치",
    imageSrc: null,
  },
];
export default function Common() {
  // Placehoder start

  const [selectedId, setSeletedId] = useState<string | null>(null);
  // Placehoder end

  // Input start
  const [value, setValue] = useState<string>("");
  const [date, setDate] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  // Input end

  // Checkbox start
  const [checked, setChecked] = useState(false);
  // Checkbox end

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
        {/* PlaceCard start */}
        <div className="flex justify-between">
          {places.map((place) => (
            <PlaceCard
              key={place.id}
              title={place.title}
              desc={place.desc}
              imageSrc={place.imageSrc}
              selected={selectedId === place.id}
              onClick={() => setSeletedId(place.id)}
            />
          ))}
        </div>
        {/* PlaceCard end */}

        {/* Input start */}
        <Input label="내용" required placeholder="내용을 입력해 주세요" />

        <Input
          label="내용"
          required
          value={value}
          helperMessage="메세지를 입력해주세요."
          onChange={(e) => setValue(e.target.value)}
          onClear={() => setValue("")}
        />
        <Input
          label="내용"
          required
          value={value}
          onChange={(e) => setValue(e.target.value)}
          errorMessage="메시지를 입력해 주세요"
        />
        <Input label="내용" required disabled placeholder="내용" />
        {/* Date */}
        <DateInput label="기간" required value={date} onChange={setDate} />
        {/* Input end */}
        {/* SearchBox start */}
        <SearchBox
          value={searchKeyword}
          onChange={setSearchKeyword}
          onSearch={(keyword) => console.log("검색:", keyword)}
        />
        {/* SearchBox end */}
        {/* Checkbox start */}
        <Checkbox
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
        />
        {/* Checkbox end */}
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
