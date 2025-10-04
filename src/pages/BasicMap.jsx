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
  const [mapState, setMapState] = useState({
    bounds: null,
    zoomLevel: 3,
    center: {
      lat: 37.4905455151569,
      lng: 127.021239211715,
    },
  });

  // API URL 생성 함수
  const buildApiUrl = useCallback((bounds, level) => {
    console.log("buildApiUrl 호출 - bounds:", bounds, "level:", level);
    if (!bounds || !bounds.sw || !bounds.ne) {
      console.log("bounds가 유효하지 않습니다:", bounds);
      return level < 4 ? API_BASE_URL_DETAILS : API_BASE_URL_CLUSTERS;
    }

    const { sw, ne } = bounds;
    const swLng = sw.La || sw.lng;
    const swLat = sw.Ma || sw.lat;
    const neLng = ne.La || ne.lng;
    const neLat = ne.Ma || ne.lat;

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

  // 지도 상태 변경 시 API 호출 (디바운싱 적용)
  useEffect(() => {
    console.log("지도 상태 변경 감지 - bounds 또는 zoomLevel 변경:", mapState);
    if (!mapState.bounds) return;

    const timeoutId = setTimeout(() => {
      fetchInformations(mapState.bounds, mapState.zoomLevel);
    }, 300); // 300ms 디바운싱

    return () => clearTimeout(timeoutId);
  }, [mapState.bounds, mapState.zoomLevel]);

  // 초기 로드 시 기본 bounds로 API 호출
  useEffect(() => {
    console.log("초기 로드 시 기본 bounds로 API 호출");
    const defaultBounds = {
      sw: { lat: 37.4905425, lng: 127.0172249 },
      ne: { lat: 37.5024595, lng: 127.0386825 },
    };
    fetchInformations(defaultBounds, mapState.zoomLevel);
  }, []);

  // 지도 상태 변경 핸들러
  const handleMapStateChange = useCallback((map) => {
    console.log("지도 상태 변경 감지:", map);
    try {
      const bounds = map.getBounds();
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();

      const center = map.getCenter();

      setMapState({
        bounds: {
          sw: sw,
          ne: ne,
        },
        zoomLevel: map.getLevel(),
        center: {
          lat: center.getLat(),
          lng: center.getLng(),
        },
      });
    } catch (error) {
      console.error("지도 상태 변경 처리 중 오류:", error);
    }
  }, []);

  return (
    <div style={{ flex: 1, position: "relative" }}>
      <Map
        id="map"
        center={mapState.center}
        style={{ width: "100%", height: "100%" }}
        level={mapState.zoomLevel}
        onIdle={handleMapStateChange}
      >
        {mapState.zoomLevel < 4
          ? buildings.map((building) => (
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
                  console.log(`클러스터 클릭: ${c.name || c.id}`);
                }}
              />
            ))}

        <ZoomControl position={"RIGHT"} />
      </Map>

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
          데이터를 불러오는 중...
        </div>
      )}

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
    </div>
  );
}
