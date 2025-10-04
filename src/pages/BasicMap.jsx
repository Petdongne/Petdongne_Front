import React, { useState, useEffect, useCallback } from "react";
import {
  Map,
  MapMarker,
  MapTypeControl,
  ZoomControl,
} from "react-kakao-maps-sdk";
import useKakaoLoader from "../components/UseKakaoLoader";

// API URL
const API_BASE_URL_DETAILS = "http://localhost:8080/api/v1/map/no-geohash";
const API_BASE_URL_CLUSTERS = "http://localhost:8080/api/v1/map/clusters";

export default function BasicMap() {
  useKakaoLoader();

  const [buildings, setBuildings] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapBounds, setMapBounds] = useState(null);
  const [mapCenter, setMapCenter] = useState({
    lat: 37.4905455151569,
    lng: 127.021239211715,
  });
  const [zoomLevel, setZoomLevel] = useState(3);

  // API URL 생성 함수
  const buildApiUrl = useCallback((bounds, level) => {
    if (!bounds || !bounds.sw || !bounds.ne) {
      console.log("bounds가 유효하지 않습니다:", bounds);
      return level < 4 ? API_BASE_URL_DETAILS : API_BASE_URL_CLUSTERS;
    }

    const { sw, ne } = bounds;
    console.log("SW 객체:", sw, "NE 객체:", ne);

    // Kakao Maps SDK의 좌표 객체 구조에 맞게 접근
    // sw와 ne 객체에서 La (lng), Ma (lat) 속성 사용
    const swLng = sw.La || sw.lng;
    const swLat = sw.Ma || sw.lat;
    const neLng = ne.La || ne.lng;
    const neLat = ne.Ma || ne.lat;

    console.log("추출된 좌표:", { swLng, swLat, neLng, neLat });

    // 좌표값 검증
    if (
      typeof swLng !== "number" ||
      typeof swLat !== "number" ||
      typeof neLng !== "number" ||
      typeof neLat !== "number"
    ) {
      console.log("좌표값이 유효하지 않습니다:", {
        swLng,
        swLat,
        neLng,
        neLat,
      });
      return level < 4 ? API_BASE_URL_DETAILS : API_BASE_URL_CLUSTERS;
    }

    const params = new URLSearchParams({
      minLon: swLng.toString(),
      minLat: swLat.toString(),
      maxLon: neLng.toString(),
      maxLat: neLat.toString(),
      level: level.toString(),
    });

    const baseUrl = level < 4 ? API_BASE_URL_DETAILS : API_BASE_URL_CLUSTERS;
    const url = `${baseUrl}?${params.toString()}`;
    console.log("생성된 API URL:", url);
    return url;
  }, []);

  // API 호출 함수
  const fetchInformations = useCallback(
    async (bounds, level) => {
      try {
        setLoading(true);
        setError(null);

        const apiUrl = buildApiUrl(bounds, level);
        console.log("API 호출 URL:", apiUrl);

        const response = await fetch(apiUrl);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.isSuccess) {
          level < 4 ? setBuildings(result.data) : setClusters(result.data);
        } else {
          throw new Error(result.message || "API 호출에 실패했습니다.");
        }
      } catch (err) {
        console.error("API 호출 중 오류 발생:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [buildApiUrl]
  );

  // 지도 bounds 변경 시 API 호출 (디바운싱 적용)
  useEffect(() => {
    if (!mapBounds) return;

    const timeoutId = setTimeout(() => {
      fetchInformations(mapBounds, zoomLevel);
    }, 300); // 300ms 디바운싱

    return () => clearTimeout(timeoutId);
  }, [mapBounds, zoomLevel, fetchInformations]);

  // 초기 로드 시 기본 bounds로 API 호출
  useEffect(() => {
    // 기본 서울 강남구 영역으로 초기 API 호출
    const defaultBounds = {
      sw: { lat: 37.4905425, lng: 127.0172249 },
      ne: { lat: 37.5024595, lng: 127.0386825 },
    };
    fetchInformations(defaultBounds, zoomLevel);
  }, [fetchInformations, zoomLevel]);

  // 지도 bounds 변경 핸들러
  const handleDragEnd = useCallback((map) => {
    try {
      const bounds = map.getBounds();

      console.log("원본 bounds 객체:", bounds);

      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();

      console.log("SW:", sw, "NE:", ne);

      // 지도 중심점 계산
      const centerLat = (sw.Ma + ne.Ma) / 2;
      const centerLng = (sw.La + ne.La) / 2;

      console.log("계산된 중심점:", { lat: centerLat, lng: centerLng });

      setMapCenter({
        lat: centerLat,
        lng: centerLng,
      });

      setMapBounds({
        sw: sw,
        ne: ne,
      });

      setZoomLevel(map.getLevel());
    } catch (error) {
      console.error("bounds 처리 중 오류:", error);
    }
  }, []);

  return (
    <div style={{ flex: 1, position: "relative" }}>
      <Map
        id="map"
        center={mapCenter}
        style={{ width: "100%", height: "100%" }} // 부모 컨테이너 크기 100% 차지
        level={zoomLevel}
        onDragEnd={handleDragEnd}
        onZoomChanged={(map) => {
          setZoomLevel(map.getLevel());
        }}
      >
        {zoomLevel < 4
          ? // 줌 레벨이 4 미만일 때 빌딩 마커들 렌더링
            buildings.map((building) => (
              <MapMarker
                key={building.id}
                position={{
                  lat: building.latitude,
                  lng: building.longitude,
                }}
                title={building.name || `빌딩 ID: ${building.id}`}
                clickable={true}
                onClick={() => {
                  console.log(`빌딩 클릭: ${building.name || building.id}`);
                }}
              />
            ))
          : clusters.map((c) => (
              <MapMarker
                key={c.id}
                position={{
                  lat: c.latitude,
                  lng: c.longitude,
                }}
                title={c.name || `빌딩 ID: ${c.id}`}
                clickable={true}
                onClick={() => {
                  console.log(`빌딩 클릭: ${c.name || c.id}`);
                }}
              />
            ))}

        <ZoomControl position={"RIGHT"} />
      </Map>

      {/* 로딩 상태 표시 */}
      {loading && (
        <div
          style={{
            position: "absolute",
            top: "20px",
            left: "20px",
            background: "rgba(255, 255, 255, 0.9)",
            padding: "10px 15px",
            borderRadius: "5px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            zIndex: 1000,
          }}
        >
          빌딩 데이터를 불러오는 중...
        </div>
      )}

      {/* 에러 상태 표시 */}
      {error && (
        <div
          style={{
            position: "absolute",
            top: "20px",
            left: "20px",
            background: "rgba(255, 77, 79, 0.9)",
            color: "white",
            padding: "10px 15px",
            borderRadius: "5px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            zIndex: 1000,
          }}
        >
          오류: {error}
        </div>
      )}

      {/* 빌딩 개수 표시 */}
      {!loading && !error && buildings.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            background: "rgba(255, 255, 255, 0.9)",
            padding: "10px 15px",
            borderRadius: "5px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            zIndex: 1000,
          }}
        >
          총 {buildings.length}개의 빌딩
        </div>
      )}
    </div>
  );
}
