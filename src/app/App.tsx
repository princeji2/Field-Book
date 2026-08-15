import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Smartphone, Monitor } from "lucide-react";
import { Toaster } from "sonner";
import { type Screen, ErrorBoundary } from "./shared";
import {
  LoginPage, SignupPage, ForgotPage,
} from "./shared";
import {
  StudentDashboard, ExploreScreen, EventDetailScreen,
  MyEventsScreen, ScannerScreen, CertificatesScreen, NotificationsScreen,
  StudentProfileScreen,
} from "./student";
import {
  LandingPage, OrganizerDashboard, EventsWorkspaceScreen,
  OrgAnalyticsScreen, OrgCertificatesScreen, OrgQRScreen,
  OrgAttendeesScreen, OrgProfileScreen,
} from "./organizer";
import {
  AdminDashboard, ApprovalsScreen, UsersScreen,
  CertificateTemplatesScreen, AdminAnalyticsScreen,
  AdminSettingsScreen, AdminNotifsScreen, AdminLoginScreen,
  AdminRoleConfirmScreen, AdminProfileScreen,
} from "./admin";

const ADMIN_SCREENS = new Set(["admin-login","admin-role-confirm","admin-dashboard","admin-approvals","admin-users","admin-templates","admin-analytics","admin-settings","admin-notifs"]);
const ORG_SCREENS   = new Set(["org-dashboard","org-events","org-qr","org-attendees","org-analytics","org-certs"]);
const STU_SCREENS   = new Set(["dashboard","explore","details","myevents","scanner","certs","notifs"]);

export default function App() {
  const [screen, setScreen]               = useState<Screen>("landing");
  const [detailEventId, setDetailEventId]   = useState("1");
  const [attendeeEventId, setAttendeeEventId] = useState("oe4");
  const [livePendingApprovals, setLivePendingApprovals] = useState(4);
  const [currentRole, setCurrentRole]     = useState<"admin" | "org" | "student">("admin");
  const [isGuest, setIsGuest]             = useState(false);
  const [pendingRole, setPendingRole]     = useState<"admin" | "org" | "student">("admin");
  const [mobilePreview, setMobilePreview] = useState(false);
  const [mobileScale,   setMobileScale]   = useState(1);
  // Detect when this instance is running inside the preview iframe
  const isEmbedded = window.self !== window.top;

  useEffect(() => {
    function calc() {
      const s = Math.min(1, (window.innerHeight - 80) / 844, (window.innerWidth - 80) / 390);
      setMobileScale(Math.round(s * 1000) / 1000);
    }
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  function navigateTo(s: Screen, eventId?: string) {
    if (eventId) {
      if (s === "org-attendees") setAttendeeEventId(eventId);
      else setDetailEventId(eventId);
    }
    if (ADMIN_SCREENS.has(s)) setCurrentRole("admin");
    else if (ORG_SCREENS.has(s)) setCurrentRole("org");
    else if (STU_SCREENS.has(s)) setCurrentRole("student");
    // Clear guest mode when logging out or leaving the admin area
    if (s === "admin-login" || s === "landing") setIsGuest(false);
    setScreen(s);
  }

  function handleGuestLogin() {
    setIsGuest(true);
    const role = pendingRole;
    setCurrentRole(role);
    setScreen(role === "admin" ? "admin-dashboard" : role === "org" ? "org-dashboard" : "dashboard");
  }

  return (
    <>
    {/* ── Dev-only: mobile preview toggle (suppressed inside the preview iframe) ── */}
    {!isEmbedded && (
      <button
        type="button"
        onClick={() => setMobilePreview(p => !p)}
        title={mobilePreview ? "Switch to desktop view" : "Simulate 390 px mobile viewport"}
        style={{
          position: "fixed", bottom: 16, left: 16, zIndex: 99999,
          display: "flex", alignItems: "center", gap: 5,
          padding: "5px 10px", borderRadius: 6, cursor: "pointer",
          background: mobilePreview ? "#1E1B16" : "#FCFAF3",
          border: `1px solid ${mobilePreview ? "rgba(255,255,255,0.10)" : "rgba(30,27,22,0.18)"}`,
          color: mobilePreview ? "#F6F1E7" : "#6B6355",
          fontSize: 11, fontFamily: "'Public Sans',system-ui,sans-serif",
          boxShadow: "0 1px 6px rgba(30,27,22,0.14)",
          letterSpacing: "0.02em", whiteSpace: "nowrap",
          transition: "background 0.15s, color 0.15s",
        }}
      >
        {mobilePreview
          ? <><Monitor    size={12} strokeWidth={1.5} style={{ marginRight: 4 }} />Desktop</>
          : <><Smartphone size={12} strokeWidth={1.5} style={{ marginRight: 4 }} />390px</>}
      </button>
    )}
    <ErrorBoundary key={screen}>
    <AnimatePresence mode="wait">
      {screen === "landing" && (
        <motion.div
          key="landing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <LandingPage onNavigate={navigateTo} />
        </motion.div>
      )}
      {screen === "login" && (
        <motion.div
          key="login"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <LoginPage onNavigate={navigateTo} />
        </motion.div>
      )}
      {screen === "signup" && (
        <motion.div
          key="signup"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <SignupPage onNavigate={navigateTo} />
        </motion.div>
      )}
      {screen === "forgot" && (
        <motion.div
          key="forgot"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <ForgotPage onNavigate={navigateTo} />
        </motion.div>
      )}
      {screen === "dashboard" && (
        <motion.div
          key="dashboard"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          <StudentDashboard onNavigate={navigateTo} isGuest={isGuest} />
        </motion.div>
      )}
      {screen === "explore" && (
        <motion.div
          key="explore"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          <ExploreScreen
            onNavigate={navigateTo}
            onViewDetail={id => navigateTo("details", id)}
            isGuest={isGuest}
          />
        </motion.div>
      )}
      {screen === "details" && (
        <motion.div
          key={`details-${detailEventId}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          <EventDetailScreen eventId={detailEventId} onNavigate={navigateTo} isGuest={isGuest} />
        </motion.div>
      )}
      {screen === "myevents" && (
        <motion.div
          key="myevents"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          <MyEventsScreen
            onNavigate={navigateTo}
            onScanEvent={id => navigateTo("scanner", id)}
            isGuest={isGuest}
          />
        </motion.div>
      )}
      {screen === "scanner" && (
        <motion.div
          key="scanner"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <ScannerScreen eventId={detailEventId} onNavigate={navigateTo} isGuest={isGuest} />
        </motion.div>
      )}
      {screen === "certs" && (
        <motion.div
          key="certs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          <CertificatesScreen
            onNavigate={navigateTo}
            onViewEventDetail={id => navigateTo("details", id)}
            isGuest={isGuest}
          />
        </motion.div>
      )}
      {screen === "notifs" && (
        <motion.div
          key="notifs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          <NotificationsScreen onNavigate={navigateTo} isGuest={isGuest} />
        </motion.div>
      )}
      {screen === "org-dashboard" && (
        <motion.div
          key="org-dashboard"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          <OrganizerDashboard onNavigate={navigateTo} isGuest={isGuest} />
        </motion.div>
      )}
      {screen === "org-events" && (
        <motion.div
          key="org-events"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          <EventsWorkspaceScreen onNavigate={navigateTo} isGuest={isGuest} />
        </motion.div>
      )}
      {screen === "org-events-create" && (
        <motion.div
          key="org-events-create"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          <EventsWorkspaceScreen onNavigate={navigateTo} initialView="create" isGuest={isGuest} />
        </motion.div>
      )}
      {screen === "org-qr" && (
        <motion.div
          key="org-qr"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          <OrgQRScreen onNavigate={navigateTo} isGuest={isGuest} />
        </motion.div>
      )}
      {screen === "org-attendees" && (
        <motion.div
          key="org-attendees"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          <OrgAttendeesScreen onNavigate={navigateTo} eventId={attendeeEventId} isGuest={isGuest} />
        </motion.div>
      )}
      {screen === "org-analytics" && (
        <motion.div
          key="org-analytics"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          <OrgAnalyticsScreen onNavigate={navigateTo} isGuest={isGuest} />
        </motion.div>
      )}
      {screen === "org-certs" && (
        <motion.div
          key="org-certs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          <OrgCertificatesScreen onNavigate={navigateTo} isGuest={isGuest} />
        </motion.div>
      )}
      {screen === "admin-dashboard" && (
        <motion.div
          key="admin-dashboard"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          <AdminDashboard onNavigate={navigateTo} livePendingApprovals={livePendingApprovals} isGuest={isGuest} />
        </motion.div>
      )}
      {screen === "admin-approvals" && (
        <motion.div
          key="admin-approvals"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          <ApprovalsScreen onNavigate={navigateTo} onPendingChange={setLivePendingApprovals} isGuest={isGuest} />
        </motion.div>
      )}
      {screen === "admin-users" && (
        <motion.div
          key="admin-users"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          <UsersScreen onNavigate={navigateTo} isGuest={isGuest} />
        </motion.div>
      )}
      {screen === "admin-templates" && (
        <motion.div
          key="admin-templates"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          <CertificateTemplatesScreen onNavigate={navigateTo} isGuest={isGuest} />
        </motion.div>
      )}
      {screen === "admin-analytics" && (
        <motion.div
          key="admin-analytics"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          <AdminAnalyticsScreen onNavigate={navigateTo} isGuest={isGuest} />
        </motion.div>
      )}
      {screen === "admin-settings" && (
        <motion.div
          key="admin-settings"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          <AdminSettingsScreen onNavigate={navigateTo} isGuest={isGuest} />
        </motion.div>
      )}
      {screen === "admin-notifs" && (
        <motion.div
          key="admin-notifs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          <AdminNotifsScreen onNavigate={navigateTo} isGuest={isGuest} />
        </motion.div>
      )}
      {screen === "admin-login" && (
        <motion.div
          key="admin-login"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          <AdminLoginScreen onNavigate={navigateTo} onGuestLogin={handleGuestLogin} selectedRole={pendingRole} />
        </motion.div>
      )}
      {screen === "admin-role-confirm" && (
        <motion.div
          key="admin-role-confirm"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
        >
          <AdminRoleConfirmScreen onNavigate={navigateTo} onRoleSelect={setPendingRole} onGuestLogin={handleGuestLogin} />
        </motion.div>
      )}
      {screen === "profile" && (
        <motion.div
          key="profile"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          style={{ height: "100vh", display: "flex", flexDirection: "column" }}
        >
          {currentRole === "admin"   && <AdminProfileScreen   onNavigate={navigateTo} isGuest={isGuest} />}
          {currentRole === "org"     && <OrgProfileScreen     onNavigate={navigateTo} isGuest={isGuest} />}
          {currentRole === "student" && <StudentProfileScreen onNavigate={navigateTo} isGuest={isGuest} />}
        </motion.div>
      )}
    </AnimatePresence>
    </ErrorBoundary>
    {/* ── Mobile preview: true 390 px iframe viewport ── */}
    {!isEmbedded && mobilePreview && (
      <div style={{
        position: "fixed", inset: 0, zIndex: 9990,
        background: "#19140F",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <iframe
          src={window.location.href}
          title="Mobile preview — 390 px viewport"
          style={{
            width: 390, height: 844,
            border: "none", display: "block", flexShrink: 0,
            borderRadius: 10,
            boxShadow: "0 0 0 1.5px rgba(255,255,255,0.08), 0 32px 90px rgba(0,0,0,0.6)",
            transform: `scale(${mobileScale})`,
            transformOrigin: "center center",
          }}
        />
      </div>
    )}
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: "#FCFAF3",
          color: "#1E1B16",
          border: "1px solid rgba(30,27,22,0.15)",
          fontFamily: "'Public Sans', system-ui, sans-serif",
          fontSize: "13px",
        },
      }}
    />
    </>
  );
}
