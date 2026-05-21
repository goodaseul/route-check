import KakaoMapScriptProvider from "../components/KakaoMapScriptProvider";
import Map from "./components/Map";

export default function page() {
  return (
    <KakaoMapScriptProvider>
      <Map />
    </KakaoMapScriptProvider>
  );
}
