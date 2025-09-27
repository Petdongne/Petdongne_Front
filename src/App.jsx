import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { Layout, Menu } from "antd";
import BasicMap from "./pages/BasicMap";
import BadReq from "./pages/BadReq";

const { Header, Content, Footer } = Layout;

const items = [
  { key: "map", label: "Map", path: "/map" },
  { key: "other", label: "Other Page", path: "/other" },
];

const AppLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const onMenuClick = ({ key }) => {
    const item = items.find((i) => i.key === key);
    if (item) navigate(item.path);
  };

  const isMapPage = location.pathname === "/map";
  const headerHeight = 64; // Ant Design Header 기본 높이

  return (
    <Layout style={{ height: "100vh", margin: 0, padding: 0 }}>
      {/* 헤더를 화면 상단에 고정 */}
      <Header
        style={{
          display: "flex",
          alignItems: "center",
          padding: 0,
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          backgroundColor: "#ffffff",
          borderBottom: "1px solid #d9d9d9",
        }}
      >
        <Menu
          theme="light"
          mode="horizontal"
          defaultSelectedKeys={["map"]}
          items={items.map((i) => ({ key: i.key, label: i.label }))}
          onClick={onMenuClick}
          style={{ flex: 1, minWidth: 0 }}
        />
      </Header>

      {/* Content 영역에 margin-top 추가 */}
      <Content
        style={{
          padding: 0,
          margin: 0,
          marginTop: headerHeight,
          height: isMapPage
            ? `calc(100vh - ${headerHeight}px)`
            : `calc(100vh - ${headerHeight + 64}px)`, // Footer 포함시 64px 추가
          width: "100%",
          overflow: "auto", // 스크롤 가능
        }}
      >
        <Routes>
          <Route path="/map" element={<BasicMap />} />
          <Route path="/other" element={<BadReq />} />
          <Route path="*" element={<BasicMap />} />
        </Routes>
      </Content>

      {!isMapPage && (
        <Footer
          style={{
            textAlign: "center",
            height: "64px",
            lineHeight: "64px",
            padding: 0,
          }}
        >
          Ant Design ©{new Date().getFullYear()} Created by Ant UED
        </Footer>
      )}
    </Layout>
  );
};

const App = () => (
  <Router>
    <AppLayout />
  </Router>
);

export default App;
