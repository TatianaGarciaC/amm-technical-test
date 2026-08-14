import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ApprovePage } from "./pages/ApprovePage";
import { DashboardPage } from "./pages/DashboardPage";
import { MockMailPage } from "./pages/MockMailPage";
import { NewRequestPage } from "./pages/NewRequestPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { RequestDetailPage } from "./pages/RequestDetailPage";
import { LanguageProvider } from "./i18n";

export default function App() {
  return <LanguageProvider><BrowserRouter><Routes><Route element={<Layout />}>
    <Route path="/" element={<DashboardPage />} />
    <Route path="/requests/new" element={<NewRequestPage />} />
    <Route path="/requests/:id" element={<RequestDetailPage />} />
    <Route path="/approve" element={<ApprovePage />} />
    <Route path="/mock-mail" element={<MockMailPage />} />
    <Route path="*" element={<NotFoundPage />} />
  </Route></Routes></BrowserRouter></LanguageProvider>;
}
