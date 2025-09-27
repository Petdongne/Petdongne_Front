import { Map } from "react-kakao-maps-sdk";
import useKakaoLoader from "../components/UseKakaoLoader";
import { MapMarker } from "react-kakao-maps-sdk";

export default function BasicMap() {
  useKakaoLoader();

  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <Map
        id="map"
        center={{ lat: 33.450701, lng: 126.570667 }}
        style={{ width: "100%", height: "100%" }}
        level={1}
      ></Map>
    </div>
  );
}
