import { useState, useEffect } from "react";
import { Id } from "../convex/_generated/dataModel";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { ReportSetup } from "./components/ReportSetup";
import { ReportDashboard } from "./components/ReportDashboard";

type Screen = "welcome" | "setup" | "dashboard";

function App() {
  const [screen, setScreen] = useState<Screen>("welcome");
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [reportId, setReportId] = useState<Id<"dailyReports"> | null>(null);

  // Persist user selection in localStorage
  useEffect(() => {
    const savedUserId = localStorage.getItem("userId");
    if (savedUserId) {
      setUserId(savedUserId as Id<"users">);
      setScreen("setup");
    }
  }, []);

  const handleSelectUser = (id: Id<"users">) => {
    setUserId(id);
    localStorage.setItem("userId", id);
    setScreen("setup");
  };

  const handleReportReady = (id: Id<"dailyReports">) => {
    setReportId(id);
    setScreen("dashboard");
  };

  const handleBackToWelcome = () => {
    setUserId(null);
    setReportId(null);
    localStorage.removeItem("userId");
    setScreen("welcome");
  };

  const handleBackToSetup = () => {
    setReportId(null);
    setScreen("setup");
  };

  switch (screen) {
    case "welcome":
      return <WelcomeScreen onSelectUser={handleSelectUser} />;

    case "setup":
      return userId ? (
        <ReportSetup
          userId={userId}
          onReportReady={handleReportReady}
          onBack={handleBackToWelcome}
        />
      ) : null;

    case "dashboard":
      return userId && reportId ? (
        <ReportDashboard
          reportId={reportId}
          userId={userId}
          onBack={handleBackToSetup}
        />
      ) : null;

    default:
      return null;
  }
}

export default App;
