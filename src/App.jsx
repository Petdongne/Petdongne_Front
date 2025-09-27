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
import "./App.css";

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

  const isMapPage = location.pathname !== "/other";

  return (
    <Layout className="app-layout">
      {/* 헤더를 화면 상단에 고정 */}
      <Header className="app-header">
        <Menu
          theme="light"
          mode="horizontal"
          defaultSelectedKeys={["map"]}
          items={items.map((i) => ({ key: i.key, label: i.label }))}
          onClick={onMenuClick}
          className="app-menu"
        />
      </Header>

      {/* Content 영역에 margin-top 추가 */}
      <Content
        className={`app-content ${
          isMapPage ? "app-content--map" : "app-content--other"
        }`}
      >
        <Routes>
          <Route path="/map" element={<BasicMap />} />
          <Route path="/other" element={<BadReq />} />
          <Route path="*" element={<BasicMap />} />
        </Routes>
      </Content>

      {!isMapPage && (
        <Footer className="app-footer">
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
