import React, { useEffect, useMemo, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import InventoryManager from "./InventoryManager";
import EquipmentDispatch from "./EquipmentDispatch";

const rolePermissions = {
  MIC: ["dashboard", "team", "events", "attendance", "inventory", "dispatch"],
  President: ["dashboard", "team", "events", "attendance", "inventory", "dispatch"],
  "Vice President": ["dashboard", "team", "events", "attendance", "dispatch"],
  Coordinator: ["dashboard", "team", "events", "attendance", "dispatch"],
  Editor: ["dashboard", "team", "events", "attendance", "dispatch"],
  "Head of Announcing": ["dashboard", "team", "events", "attendance", "dispatch"],
  Photographer: ["dashboard", "team", "events", "attendance", "dispatch"],
};

const navItems = [
  { id: "dashboard", label: "Dashboard" },
  { id: "team", label: "Our Team" },
  { id: "events", label: "Event Calendar" },
  { id: "attendance", label: "Event Attendance" },
  { id: "inventory", label: "Inventory" },
  { id: "dispatch", label: "Dispatch" },
];

const canAccess = (role, section) => {
  return (rolePermissions[role] || rolePermissions.Photographer).includes(section);
};

const teamMembers = [
  {
    name: "Rev. Bro. Dilshan Vimukthi F.S.C.",
    role: "Sub Director",
    meta: "Sports Coordinator",
    group: "MIC / Mentor",
    featured: true,
  },
  {
    name: "Master Yemith Senitha",
    role: "President",
    meta: "Student Leadership",
    group: "Executive Board",
  },
  {
    name: "Master Ashen Nilaksha",
    role: "Vice President",
    meta: "Student Leadership",
    group: "Executive Board",
  },
  {
    name: "Master Jovel Adisha",
    role: "Coordinator",
    meta: "Operations Coordination",
    group: "Executive Board",
  },
  {
    name: "Master Ovin Dias",
    role: "Head of Announcing",
    meta: "Announcements",
    group: "Operations",
  },
  {
    name: "Master Thisum Lithsara",
    role: "Photographer",
    meta: "Media Coverage",
    group: "Photography Team",
  },
  {
    name: "Master Mihinula Randira",
    role: "Photographer",
    meta: "Media Coverage",
    group: "Photography Team",
  },
  {
    name: "Master Dhanusha Dabare",
    role: "Photographer",
    meta: "Media Coverage",
    group: "Photography Team",
  },
  {
    name: "Master Thashen Niklesha",
    role: "Photographer",
    meta: "Media Coverage",
    group: "Photography Team",
  },
  {
    name: "Master Nethula Silva",
    role: "Photographer",
    meta: "Media Coverage",
    group: "Photography Team",
  },
];

const accessMembers = teamMembers.map((member) => ({
  ...member,
  accessRole:
    member.group === "MIC / Mentor"
      ? "MIC"
      : rolePermissions[member.role]
        ? member.role
        : member.role === "Coordinator"
          ? "Coordinator"
          : "Photographer",
}));

const calendarMonths = [
  { index: 4, label: "May" },
  { index: 5, label: "June" },
  { index: 6, label: "July" },
  { index: 7, label: "August" },
  { index: 8, label: "September" },
  { index: 9, label: "October" },
  { index: 10, label: "November" },
  { index: 11, label: "December" },
];

const emptyEvent = {
  title: "",
  date: "2026-05-01",
  venue: "",
  dutyTeam: "",
  assignedMembers: [],
  mic: "Rev. Bro. Dilshan Vimukthi F.S.C.",
  status: "Planned",
  note: "",
};

const normalizeText = (value = "") =>
  value.toLowerCase().replace(/rev\.|bro\.|master|f\.s\.c\.|[^a-z0-9]/g, "");

// const inferRoleForUser = (displayName = "", email = "") => {
//   const emailLower = (email || "").toLowerCase();
//   if (emailLower.includes("revdilshan")) return "MIC";
//   if (emailLower.includes("senitha")) return "President";
//   if (emailLower.includes("ashen")) return "Vice President";
//   if (emailLower.includes("jovel")) return "Coordinator";
//   if (emailLower.includes("ovin")) return "Head of Announcing";
//   
//   // All other specified members are photographers
//   const photographers = ["thisum", "dabare", "mihinula", "nethula"];
//   if (photographers.some(p => emailLower.includes(p))) return "Photographer";
// 
//   return "Photographer";
// };

const getProfileMember = (profile) => {
  const identity = normalizeText(`${profile?.displayName || ""} ${profile?.email || ""}`);
  return accessMembers.find((member) => {
    const normalizedName = normalizeText(member.name);
    return normalizedName && identity.includes(normalizedName.slice(0, Math.min(10, normalizedName.length)));
  });
};

const getMonthKey = (date = new Date()) => date.toISOString().slice(0, 7);

function AuthGate({ onLogin }) {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailAuth = async (event) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const cleanEmail = email.trim();
      const response = await fetch(`/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      let data;
      try {
        data = await response.json();
      } catch {
        alert("සර්වර් එකෙන් නිවැරදි පිළිතුරක් ලැබුණේ නැත!");
        return;
      }

      if (data.success) {
        localStorage.setItem('userRole', data.role);
        localStorage.setItem('userName', data.name);
        onLogin({ role: data.role, displayName: data.name, email: cleanEmail });
      } else {
        alert(data.message || "ලොගින් වීමට නොහැක!");
      }
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <main className="mumm-main-layout auth-layout">
      <div className="ambient-orb ambient-orb-one" />
      <div className="ambient-orb ambient-orb-two" />
      <section className="hero-shell auth-card">
        <div>
          <div className="brand-lockup">
            <img src="/media-logo.png" alt="St. Benedict's College Media logo" />
            <div>
              <strong>St. Benedict&apos;s College Media</strong>
              <small>Media Unit Management</small>
            </div>
          </div>
          <span className="mumm-tag">MUMMS</span>
          <h1 className="main-title">St. Benedict&apos;s College Media Member Management System</h1>
          <p className="hero-copy">
            The home screen for the current Media Unit team and MIC to manage
            event duties, smart alerts, attendance, and equipment operations.
          </p>
        </div>

        <form className="mumm-panel auth-form" onSubmit={handleEmailAuth}>
          <div className="panel-eyebrow">{mode === "signup" ? "Create Account" : "Sign In"}</div>
          <h2 className="neon-title">Welcome Back</h2>
          <input
            className="cyber-input"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            required
            type="email"
            value={email}
          />
          <input
            className="cyber-input"
            minLength="6"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            required
            type="password"
            value={password}
          />
          <button className="btn-dispatch" disabled={isLoading} type="submit">
            {isLoading ? "CONNECTING..." : mode === "signup" ? "CREATE ACCOUNT" : "SIGN IN"}
          </button>
          <button
            className="link-button"
            onClick={() => setMode((current) => (current === "signin" ? "signup" : "signin"))}
            type="button"
          >
            {mode === "signin" ? "Need an account? Create one" : "Already have an account? Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}

function SmartDutyAlerts({ events, notifications = [], profile }) {
  const [notificationStatus, setNotificationStatus] = useState(
    typeof Notification === "undefined" ? "unsupported" : Notification.permission,
  );
  const [shownNotificationIds, setShownNotificationIds] = useState([]);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const alertWindow = new Date(today);
  alertWindow.setDate(alertWindow.getDate() + 14);
  const profileMember = getProfileMember(profile);
  const currentMemberName = profileMember?.name || profile?.displayName;

  const upcomingEvents = events
    .filter((event) => {
      if (!event.date) return false;
      const eventDate = new Date(`${event.date}T00:00:00`);
      const isAssigned =
        !currentMemberName ||
        event.assignedMembers?.includes(currentMemberName) ||
        event.dutyTeam?.includes(currentMemberName);
      return eventDate >= today && eventDate <= alertWindow && isAssigned;
    })
    .slice(0, 5);
  const unreadNotifications = notifications.filter(
    (notification) => notification.memberName === currentMemberName && !notification.read,
  );
  const needsDutyDetails = events.filter(
    (event) => event.date && (!event.assignedMembers?.length || !event.mic),
  );

  useEffect(() => {
    if (
      (!Capacitor.isNativePlatform() &&
        (typeof Notification === "undefined" || Notification.permission !== "granted")) ||
      unreadNotifications.length === 0
    ) {
      return;
    }

    unreadNotifications.forEach((notification) => {
      if (shownNotificationIds.includes(notification.id)) return;
      if (Capacitor.isNativePlatform()) {
        LocalNotifications.schedule({
          notifications: [
            {
              id: Date.now(),
              title: notification.title || "Duty assignment",
              body: notification.message,
              schedule: { at: new Date(Date.now() + 1000) },
            },
          ],
        });
      } else {
        new Notification(notification.title || "Duty assignment", {
          body: notification.message,
        });
      }
      setShownNotificationIds((current) => [...current, notification.id]);
    });
  }, [shownNotificationIds, unreadNotifications]);

  const requestNotifications = async () => {
    if (Capacitor.isNativePlatform()) {
      const permission = await LocalNotifications.requestPermissions();
      setNotificationStatus(permission.display === "granted" ? "granted" : "denied");
      return;
    }

    if (typeof Notification === "undefined") {
      setNotificationStatus("unsupported");
      return;
    }

    const permission = await Notification.requestPermission();
    setNotificationStatus(permission);
  };

  const sendTestAlerts = () => {
    if (Capacitor.isNativePlatform() && notificationStatus === "granted") {
      LocalNotifications.schedule({
        notifications: upcomingEvents.map((event, index) => ({
          id: Date.now() + index,
          title: `Duty alert: ${event.title}`,
          body: `${event.date} at ${event.venue || "venue TBA"} - ${event.assignedMembers?.length ? event.assignedMembers.join(", ") : event.dutyTeam || "duty team TBA"
            }`,
          schedule: { at: new Date(Date.now() + 1000 + index * 500) },
        })),
      });
      return;
    }

    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;

    upcomingEvents.forEach((event) => {
      new Notification(`Duty alert: ${event.title}`, {
        body: `${event.date} at ${event.venue || "venue TBA"} - ${event.assignedMembers?.length ? event.assignedMembers.join(", ") : event.dutyTeam || "duty team TBA"
          }`,
      });
    });
  };

  return (
    <div className="mumm-panel alerts-panel">
      <div className="panel-eyebrow">Smart Notifications</div>
      <h3 className="card-title">Automated Duty Alerts</h3>
      <p className="small-info">
        Upcoming event duties are detected from the calendar and assignment
        notifications are shown to the assigned member when they log in.
      </p>

      <div className="alert-stack">
        {upcomingEvents.map((event) => (
          <div className="alert-card" key={event.id}>
            <strong>{event.title}</strong>
            <span>{event.date} - {event.venue || "Venue TBA"}</span>
            <small>
              {event.assignedMembers?.length
                ? event.assignedMembers.join(", ")
                : event.dutyTeam || "Duty team not assigned"}
            </small>
          </div>
        ))}
        {upcomingEvents.length === 0 && (
          <div className="alert-card muted-alert">
            <strong>No duties in the next 14 days</strong>
            <span>Add events to activate the alert queue.</span>
          </div>
        )}
      </div>

      <div className="button-row">
        <button className="btn-ghost" onClick={requestNotifications} type="button">
          {notificationStatus === "granted" ? "Notifications On" : "Enable Alerts"}
        </button>
        <button
          className="btn-mini"
          disabled={notificationStatus !== "granted" || upcomingEvents.length === 0}
          onClick={sendTestAlerts}
          type="button"
        >
          Send Now
        </button>
      </div>
      {unreadNotifications.length > 0 && (
        <p className="small-info">
          {unreadNotifications.length} unread assignment notification(s) for {currentMemberName}.
        </p>
      )}
      {needsDutyDetails.length > 0 && (
        <p className="scanner-error">
          {needsDutyDetails.length} event(s) need duty team or MIC details.
        </p>
      )}
    </div>
  );
}

function Dashboard({ events, profile, role }) {
  const [myEquipment, setMyEquipment] = useState([]);
  const [isLoadingEquip, setIsLoadingEquip] = useState(false);
  const [logs, setLogs] = useState([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  const currentMemberName = profile?.displayName || profile?.email || "";

  useEffect(() => {
    const fetchMyEquipment = async () => {
      setIsLoadingEquip(true);
      try {
        const response = await fetch(`/api/equipment`);
        if (response.ok) {
          const data = await response.json();
          const myItems = data.filter(item => 
            item.assignedTo === currentMemberName || 
            item.assignedTo === profile?.email
          );
          setMyEquipment(myItems);
        }
      } catch (err) {
        console.error("Error fetching my equipment:", err);
      } finally {
        setIsLoadingEquip(false);
      }
    };

    const fetchLogs = async () => {
      setIsLoadingLogs(true);
      try {
        const response = await fetch(`/api/logs`);
        if (response.ok) {
          const data = await response.json();
          setLogs(data);
        }
      } catch (err) {
        console.error("Error fetching logs:", err);
      } finally {
        setIsLoadingLogs(false);
      }
    };

    if (currentMemberName) {
      fetchMyEquipment();
      fetchLogs();
    }
  }, [currentMemberName, profile]);

  const myEvents = events.filter((event) =>
    event.assignedMembers?.includes(currentMemberName) ||
    event.dutyTeam?.includes(currentMemberName)
  );

  const upcomingMyEvents = myEvents.filter(e => new Date(e.date) >= new Date()).sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <section className="hub-section">
      <div className="modern-grid dashboard-grid">
        {/* Premium Profile Card */}
        <div className="mumm-panel glass-card profile-premium-card">
          <div className="profile-header">
            <div className="profile-avatar">
              {currentMemberName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div className="profile-info">
              <h2 className="profile-name">{currentMemberName}</h2>
              <span className="profile-role-badge">{role}</span>
            </div>
          </div>
          
          <div className="active-equipment-status">
            <h4>💼 Active Equipment</h4>
            {isLoadingEquip ? (
              <p>Loading equipment...</p>
            ) : myEquipment.length > 0 ? (
              <div className="equipment-alert overdue">
                <span>⚠️ You have {myEquipment.length} item(s) checked out: {myEquipment.map(i => i.name).join(", ")}. (Not Returned)</span>
              </div>
            ) : (
              <div className="equipment-alert clear">
                <span>No items checked out. All clear!</span>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Duties Timeline */}
        <div className="mumm-panel glass-card timeline-panel">
          <div className="panel-eyebrow">Duty Schedule</div>
          <h3 className="neon-title">📅 Upcoming Duties</h3>
          
          <div className="timeline-container">
            {upcomingMyEvents.length > 0 ? (
              upcomingMyEvents.map((event) => (
                <div className="timeline-item" key={event.id}>
                  <div className="timeline-dot" />
                  <div className="timeline-content">
                    <span className="timeline-date">{event.date}</span>
                    <h4 className="timeline-title">{event.title}</h4>
                    <p className="timeline-venue">{event.venue}</p>
                    <button className="btn-mini action-btn">Confirm Attendance</button>
                  </div>
                </div>
              ))
            ) : (
              <p className="empty-state">No upcoming duties assigned to you.</p>
            )}
          </div>
        </div>

        {/* Role-Based Metrics */}
        <div className="mumm-panel glass-card metrics-premium-panel">
          <div className="panel-eyebrow">Your Metrics</div>
          <h3 className="neon-title">Activity</h3>
          
          <div className="metrics-rings">
            <div className="metric-ring-container">
              <div className="progress-ring" style={{ '--progress': '70%' }}>
                <span className="ring-value">{myEvents.length}</span>
              </div>
              <span className="ring-label">My Events</span>
            </div>
            
            <div className="metric-ring-container">
              <div className="progress-ring" style={{ '--progress': '100%' }}>
                <span className="ring-value">{myEquipment.length}</span>
              </div>
              <span className="ring-label">Items Held</span>
            </div>
          </div>
        </div>

        {/* Recent Activity Card */}
        <div className="mumm-panel glass-card activity-panel" style={{ gridColumn: '1 / -1' }}>
          <div className="panel-eyebrow">Recent Activity</div>
          <h3 className="neon-title">Checkouts & Returns</h3>
          
          <div className="activity-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
            {isLoadingLogs ? (
              <p>Loading activity...</p>
            ) : logs.length > 0 ? (
              logs.map((log) => (
                <div className="activity-item" key={log._id} style={{ display: 'flex', gap: '15px', alignItems: 'center', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                  <span className="activity-icon" style={{ fontSize: '1.5rem' }}>{log.returnTime ? "📥" : "📤"}</span>
                  <div className="activity-details" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <strong>{log.equipmentName}</strong>
                    <span style={{ fontSize: '0.9rem', color: 'rgba(236, 255, 246, 0.7)' }}>{log.returnTime ? "Returned" : "Checked out"} by {log.memberDetails}</span>
                    <small style={{ fontSize: '0.75rem', color: '#00ff88' }}>{new Date(log.returnTime || log.checkoutTime).toLocaleString()}</small>
                  </div>
                </div>
              ))
            ) : (
              <p className="empty-state">No recent activity found.</p>
            )}
          </div>
        </div>

      </div>
    </section>
  );
}

function OurTeam() {
  const featuredMember = teamMembers.find((member) => member.featured);
  const studentMembers = teamMembers.filter((member) => !member.featured);

  return (
    <section className="hub-section">
      <div className="mumm-panel admin-glow team-hero-card">
        <div>
          <div className="panel-eyebrow">Our Team</div>
          <h2 className="neon-title">MUMMS Media Unit Leadership</h2>
          <p className="small-info">
            The St. Benedict&apos;s College Media Unit team behind member
            management, sports coverage, announcements, and photography.
          </p>
        </div>
        <div className="team-count-card">
          <strong>{teamMembers.length}</strong>
          <span>Team + MIC Access</span>
        </div>
      </div>

      {featuredMember && (
        <div className="team-feature-card">
          <div className="team-avatar mentor-avatar">FSC</div>
          <div>
            <span className="mumm-tag">{featuredMember.group}</span>
            <h3>{featuredMember.name}</h3>
            <p>{featuredMember.role}</p>
            <small>{featuredMember.meta}</small>
          </div>
        </div>
      )}

      <div className="team-grid">
        {studentMembers.map((member) => (
          <article className="team-card" key={`${member.name}-${member.role}`}>
            <div className="team-avatar">
              {member.name
                .replace("Master ", "")
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)}
            </div>
            <div className="team-card-body">
              <span>{member.group}</span>
              <h3>{member.name}</h3>
              <p>{member.role}</p>
              <small>{member.meta} - App access enabled</small>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function EventCalendar({ canManage, events, profile, refreshEvents }) {
  const [form, setForm] = useState(emptyEvent);
  const [editingId, setEditingId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const currentMonthEvents = events.filter((event) => {
    if (!event.date) return false;
    return new Date(`${event.date}T00:00:00`).getMonth() === selectedMonth;
  });

  const renderCalendarGrid = () => {
    const year = 2026;
    const days = daysInMonth(year, selectedMonth);
    const startDay = firstDayOfMonth(year, selectedMonth);
    const grid = [];

    // Fill empty days at start
    for (let i = 0; i < startDay; i++) {
      grid.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // Fill actual days
    for (let d = 1; d <= days; d++) {
      const dateStr = `2026-${String(selectedMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dayEvents = currentMonthEvents.filter(e => e.date === dateStr);
      
      grid.push(
        <div key={d} className={`calendar-day ${dayEvents.length > 0 ? 'has-events' : ''}`}>
          <span className="day-number">{d}</span>
          <div className="day-events-dots">
            {dayEvents.map((e, idx) => (
              <div key={idx} className="event-dot" title={e.title}></div>
            ))}
          </div>
        </div>
      );
    }

    return grid;
  };

  const saveEvent = async (event) => {
    event.preventDefault();
    if (!canManage) return;

    setIsSaving(true);
    const assignedMembers = form.assignedMembers || [];
    const payload = {
      ...form,
      assignedMembers,
      dutyTeam: assignedMembers.join(", "),
      createdBy: profile?.displayName || profile?.email || "Unknown user",
      updatedAt: new Date(),
    };

    try {
      if (editingId) {
        await fetch(`/api/events/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        await fetch(`/api/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }
      setForm(emptyEvent);
      setEditingId("");
      if (refreshEvents) refreshEvents();
    } catch (err) {
      alert("Error saving event: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="hub-section">
      <div className="modern-grid event-workspace-grid">
        <div className="mumm-panel calendar-visual-panel">
          <div className="panel-eyebrow">Visual Schedule</div>
          <div className="calendar-header-nav">
            <h3 className="neon-title">{calendarMonths.find(m => m.index === selectedMonth)?.label} 2026</h3>
            <div className="nav-controls">
              <button className="btn-mini" onClick={() => setSelectedMonth(m => Math.max(4, m - 1))}>←</button>
              <button className="btn-mini" onClick={() => setSelectedMonth(m => Math.min(11, m + 1))}>→</button>
            </div>
          </div>
          <div className="calendar-grid-header">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
          </div>
          <div className="calendar-grid-body">
            {renderCalendarGrid()}
          </div>
        </div>

        <form className="mumm-panel member-form" onSubmit={saveEvent}>
          <div className="panel-eyebrow">{editingId ? "Update Duty" : "Add New Duty"}</div>
          <div className="form-grid">
            <input className="cyber-input" onChange={e => setForm({...form, title: e.target.value})} placeholder="Event title" required value={form.title} />
            <input className="cyber-input" type="date" onChange={e => setForm({...form, date: e.target.value})} required value={form.date} />
            <input className="cyber-input" onChange={e => setForm({...form, venue: e.target.value})} placeholder="Venue" value={form.venue} />
            <select className="cyber-input" onChange={e => setForm({...form, status: e.target.value})} value={form.status}>
              <option>Planned</option>
              <option>Confirmed</option>
              <option>Completed</option>
            </select>
          </div>
          
          <div className="members-selection" style={{ marginTop: '15px', marginBottom: '15px' }}>
            <label style={{ color: 'rgba(236, 255, 246, 0.7)', fontSize: '0.9rem', marginBottom: '5px', display: 'block' }}>Assign Members:</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
              {teamMembers.filter(m => m.group !== "MIC / Mentor").map(member => (
                <label key={member.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '4px' }}>
                  <input
                    type="checkbox"
                    checked={form.assignedMembers?.includes(member.name)}
                    onChange={e => {
                      const name = member.name;
                      const currentAssigned = form.assignedMembers || [];
                      if (e.target.checked) {
                        setForm({...form, assignedMembers: [...currentAssigned, name]});
                      } else {
                        setForm({...form, assignedMembers: currentAssigned.filter(n => n !== name)});
                      }
                    }}
                    style={{ accentColor: '#00ff88' }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.9rem' }}>{member.name.replace("Master ", "")}</span>
                    <small style={{ fontSize: '0.75rem', color: 'rgba(236, 255, 246, 0.5)' }}>{member.role}</small>
                  </div>
                </label>
              ))}
            </div>
          </div>
          
          <button className="btn-dispatch" disabled={isSaving} type="submit">{isSaving ? "SAVING..." : "SAVE EVENT"}</button>
        </form>
      </div>

      <div className="mumm-panel event-list-panel">
        <div className="panel-eyebrow">Upcoming List</div>
        <div className="calendar-event-list">
          {currentMonthEvents.map(event => (
            <div className="calendar-event-card" key={event.id}>
              <div>
                <strong>{event.title}</strong>
                <span>{event.date} - {event.venue}</span>
              </div>
              <button className="btn-mini" onClick={() => { setEditingId(event.id); setForm(event); }}>Edit</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DutyAppeals({ appeals, events, profile, role }) {
  const [selectedEventId, setSelectedEventId] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const profileMember = getProfileMember(profile);
  const currentMemberName = profileMember?.name || profile?.displayName || profile?.email || "";
  const currentMonthKey = getMonthKey();
  const isApprover = ["MIC", "President"].includes(role);
  const assignedEvents = events.filter(
    (event) =>
      event.assignedMembers?.includes(currentMemberName) ||
      (currentMemberName && event.dutyTeam?.includes(currentMemberName)),
  );
  const myMonthlyAppeals = appeals.filter(
    (appeal) => appeal.memberName === currentMemberName && appeal.monthKey === currentMonthKey,
  );
  const overLimit = myMonthlyAppeals.length >= 3;

  const submitAppeal = async (event) => {
    event.preventDefault();
    if (!selectedEventId || !reason.trim() || overLimit) return;

        const selectedEvent = events.find((item) => item.id === selectedEventId);
        setIsSubmitting(true);
        try {
          await fetch(`/api/duty_appeals`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              eventId: selectedEventId,
              eventTitle: selectedEvent?.title || "Untitled event",
              eventDate: selectedEvent?.date || "",
              memberName: currentMemberName,
              memberEmail: profile?.email || "",
              reason: reason.trim(),
              status: "Pending",
              monthKey: currentMonthKey
            })
          });
          setSelectedEventId("");
          setReason("");
        } finally {
      setIsSubmitting(false);
    }
  };

  const reviewAppeal = async (appeal, status) => {
    await fetch(`/api/duty_appeals/${appeal.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status,
        reviewedBy: profile?.displayName || profile?.email || "Approver",
        reviewedAt: new Date()
      })
    });
  };

  return (
    <div className="appeal-grid">
      <form className="mumm-panel appeal-panel" onSubmit={submitAppeal}>
        <div className="panel-eyebrow">Appeal System</div>
        <h2 className="neon-title">Duty Appeal Request</h2>
        <p className="small-info">
          If a member cannot attend an assigned event, the appeal is valid only
          after MIC or President approval.
        </p>
        <select
          className="cyber-input"
          onChange={(event) => setSelectedEventId(event.target.value)}
          value={selectedEventId}
        >
          <option value="">Select assigned event</option>
          {assignedEvents.map((event) => (
            <option key={event.id} value={event.id}>
              {event.title} - {event.date}
            </option>
          ))}
        </select>
        <textarea
          className="cyber-input event-note"
          onChange={(event) => setReason(event.target.value)}
          placeholder="Reason for appeal"
          value={reason}
        />
        <div className={overLimit ? "policy-warning danger-policy" : "policy-warning"}>
          <strong>{myMonthlyAppeals.length}/3 appeals used this month</strong>
          <span>
            More than 3 monthly appeals may trigger a one-week Media Unit ban
            and school-level disciplinary review according to unit policy.
          </span>
        </div>
        <button
          className="btn-dispatch"
          disabled={isSubmitting || overLimit || !assignedEvents.length}
          type="submit"
        >
          {isSubmitting ? "SUBMITTING..." : overLimit ? "APPEAL LIMIT REACHED" : "SUBMIT APPEAL"}
        </button>
      </form>

      <div className="mumm-panel appeal-panel">
        <div className="panel-eyebrow">MIC / President Approval</div>
        <h2 className="neon-title">Appeal Queue</h2>
        <div className="alert-stack">
          {appeals.map((appeal) => (
            <div className="appeal-card" key={appeal.id}>
              <div>
                <strong>{appeal.memberName}</strong>
                <span>{appeal.eventTitle} - {appeal.eventDate}</span>
                <small>{appeal.reason}</small>
                <em>{appeal.status}</em>
              </div>
              {isApprover && appeal.status === "Pending" && (
                <div className="table-actions">
                  <button className="btn-mini" onClick={() => reviewAppeal(appeal, "Approved")} type="button">
                    Approve
                  </button>
                  <button className="btn-mini danger" onClick={() => reviewAppeal(appeal, "Rejected")} type="button">
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
          {appeals.length === 0 && <p className="empty-month">No appeal requests yet.</p>}
        </div>
      </div>
    </div>
  );
}

function EventAttendance({ events, profile }) {
  const [selectedEventId, setSelectedEventId] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState("");

  const handleAttendance = async (type) => {
    if (!selectedEventId) {
      alert("Please select an event first");
      return;
    }
    setIsProcessing(true);
    setMessage("");
    try {
      const response = await fetch(`/api/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: selectedEventId,
          eventTitle: events.find(e => e.id === selectedEventId)?.title,
          userId: profile.id,
          userName: profile.displayName,
          type: type, // 'check-in' or 'check-out'
        })
      });
      if (!response.ok) throw new Error('Network response was not ok');
      setMessage(`Successfully ${type === 'check-in' ? 'checked in' : 'checked out'}!`);
    } catch (err) {
      setMessage("Error: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <section className="hub-section">
      <div className="mumm-panel admin-glow">
        <div className="panel-eyebrow">Live Workflow</div>
        <h2 className="neon-title">Event Attendance</h2>
        <p className="small-info">Track your duty participation by checking in and out of assigned events.</p>
        
        <div className="attendance-form">
          <select 
            className="cyber-input" 
            value={selectedEventId} 
            onChange={(e) => setSelectedEventId(e.target.value)}
          >
            <option value="">Select current event</option>
            {events.filter(e => e.status !== "Completed").map(e => (
              <option key={e.id} value={e.id}>{e.title} ({e.date})</option>
            ))}
          </select>

          <div className="button-row" style={{ marginTop: '20px' }}>
            <button 
              className="btn-dispatch" 
              disabled={isProcessing || !selectedEventId} 
              onClick={() => handleAttendance("check-in")}
            >
              CHECK-IN
            </button>
            <button 
              className="btn-ghost" 
              disabled={isProcessing || !selectedEventId} 
              onClick={() => handleAttendance("check-out")}
            >
              CHECK-OUT
            </button>
          </div>
          {message && <p className={`status-text ${message.includes('Error') ? 'error' : 'success'}`}>{message}</p>}
        </div>
      </div>
    </section>
  );
}

export default function App() {
  const API_BASE = "/api";
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('loggedUser');
    return stored ? JSON.parse(stored) : null;
  });
  const [profile, setProfile] = useState(() => {
    const stored = localStorage.getItem('loggedUser');
    return stored ? JSON.parse(stored) : null;
  });
  const [activeSection, setActiveSection] = useState("dashboard");
  const [events, setEvents] = useState([]);


  const fetchData = async () => {
    try {
      const [eventsRes, membersRes] = await Promise.all([
        fetch(`${API_BASE}/events`),
        fetch(`${API_BASE}/members`)
      ]);

      const eventsData = await eventsRes.json();
      const membersData = await membersRes.json();

      setEvents(eventsData.map(e => ({ ...e, id: e._id })));

    } catch (err) {
      console.error("API Fetch Error:", err);
    }
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const role = profile?.role || "Photographer";
  const accessibleNav = useMemo(
    () => navItems.filter((item) => canAccess(role, item.id)),
    [role],
  );

  useEffect(() => {
    if (!canAccess(role, activeSection)) {
      setActiveSection("dashboard");
    }
  }, [activeSection, role]);

  const handleSignOut = () => {
    localStorage.removeItem('loggedUser');
    setUser(null);
    setProfile(null);
    setActiveSection("dashboard");
  };

  if (!user) {
    return <AuthGate onLogin={(userData) => {
      localStorage.setItem('loggedUser', JSON.stringify(userData));
      setUser(userData);
      setProfile(userData);
    }} />;
  }

  return (
    <main className="mumm-main-layout">
      <div className="ambient-orb ambient-orb-one" />
      <div className="ambient-orb ambient-orb-two" />

      <header className="hero-shell hub-hero">
        <div>
          <div className="brand-lockup">
            <img src="/media-logo.png" alt="St. Benedict's College Media logo" />
            <div>
              <strong>St. Benedict&apos;s College Media</strong>
              <small>Media Unit Management</small>
            </div>
          </div>
          <span className="mumm-tag">MUMMS</span>
          <h1 className="main-title">St. Benedict&apos;s College Media Member Management System</h1>
          <p className="hero-copy">
            Command center for current team access, event calendars, automated
            duty alerts, event attendance, and equipment operations.
          </p>
        </div>
        <div className="device-card profile-card">
          <span className="device-dot" />
          <div>
            <strong>{profile?.displayName || user.email}</strong>
            <small>{role}</small>
          </div>
          <button className="btn-mini" onClick={handleSignOut} type="button">
            Sign out
          </button>
        </div>
      </header>

      <nav className="hub-nav">
        {accessibleNav.map((item) => (
          <button
            className={activeSection === item.id ? "nav-pill active" : "nav-pill"}
            key={item.id}
            onClick={() => setActiveSection(item.id)}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </nav>

      {activeSection === "dashboard" && (
        <Dashboard
          events={events}
          profile={profile}
          role={role}
        />
      )}
      {activeSection === "team" && <OurTeam />}
      {activeSection === "events" && (
        <EventCalendar
          canManage={["MIC", "President", "Vice President", "Coordinator"].includes(role)}
          events={events}
          profile={profile}
          role={role}
          refreshEvents={fetchData}
        />
      )}
      {activeSection === "attendance" && (
        <EventAttendance events={events} profile={profile} />
      )}
      {activeSection === "inventory" && <InventoryManager />}
      {activeSection === "dispatch" && <EquipmentDispatch events={events} profile={profile} />}
    </main>
  );
}
