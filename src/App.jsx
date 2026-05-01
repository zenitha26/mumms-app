import React, { useEffect, useMemo, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import InventoryManager from "./InventoryManager";
import EquipmentDispatch from "./EquipmentDispatch";
import { auth, db, googleProvider } from "./firebase";

const rolePermissions = {
  MIC: ["dashboard", "team", "events", "attendance", "inventory", "dispatch"],
  President: ["dashboard", "team", "events", "attendance", "inventory", "dispatch"],
  "Head of Media": ["dashboard", "team", "events", "attendance", "inventory", "dispatch"],
  "Vice President": ["dashboard", "team", "events", "attendance", "inventory", "dispatch"],
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
    name: "Master Jovel Adeesha",
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

const inferRoleForUser = (displayName = "", email = "") => {
  const identity = `${displayName} ${email}`;
  const normalizedIdentity = normalizeText(identity);
  const match = accessMembers.find((member) => {
    const nameParts = normalizeText(member.name);
    return nameParts && normalizedIdentity.includes(nameParts.slice(0, Math.min(10, nameParts.length)));
  });

  return match?.accessRole || "Photographer";
};

const getProfileMember = (profile) => {
  const identity = normalizeText(`${profile?.displayName || ""} ${profile?.email || ""}`);
  return accessMembers.find((member) => {
    const normalizedName = normalizeText(member.name);
    return normalizedName && identity.includes(normalizedName.slice(0, Math.min(10, normalizedName.length)));
  });
};

const getMonthKey = (date = new Date()) => date.toISOString().slice(0, 7);

function AuthGate({ onPreviewLogin }) {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailAuth = async (event) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      if (mode === "signup") {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        const displayName = credential.user.displayName || email.split("@")[0];
        await setDoc(doc(db, "users", credential.user.uid), {
          id: credential.user.uid,
          email: credential.user.email,
          displayName,
          role: inferRoleForUser(displayName, credential.user.email),
          createdAt: serverTimestamp(),
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);

    try {
      const credential = await signInWithPopup(auth, googleProvider);
      await setDoc(
        doc(db, "users", credential.user.uid),
        {
          id: credential.user.uid,
          email: credential.user.email,
          displayName: credential.user.displayName,
          role: inferRoleForUser(credential.user.displayName, credential.user.email),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    } catch (error) {
      alert(error.message);
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
          <button className="btn-ghost full-width" disabled={isLoading} onClick={handleGoogleAuth} type="button">
            Continue with Google
          </button>
          <button
            className="btn-preview full-width"
            disabled={isLoading}
            onClick={onPreviewLogin}
            type="button"
          >
            Preview Login - No Email Needed
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
          body: `${event.date} at ${event.venue || "venue TBA"} - ${
            event.assignedMembers?.length ? event.assignedMembers.join(", ") : event.dutyTeam || "duty team TBA"
          }`,
          schedule: { at: new Date(Date.now() + 1000 + index * 500) },
        })),
      });
      return;
    }

    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;

    upcomingEvents.forEach((event) => {
      new Notification(`Duty alert: ${event.title}`, {
        body: `${event.date} at ${event.venue || "venue TBA"} - ${
          event.assignedMembers?.length ? event.assignedMembers.join(", ") : event.dutyTeam || "duty team TBA"
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

function Dashboard({ counts, events, notifications, profile, role }) {
  const statCards = [
    { label: "Core Team", value: teamMembers.length },
    { label: "Events", value: counts.events },
    { label: "Event Attendance", value: counts.attendance },
  ];

  return (
    <section className="hub-section">
      <div className="modern-grid dashboard-grid">
        <div className="mumm-panel admin-glow">
          <div className="panel-eyebrow">Command Center</div>
          <h2 className="neon-title">MUMMS Dashboard</h2>
          <p className="small-info">
            Role-aware workspace for media operations. Your current access level
            is <strong>{role}</strong>.
          </p>
          <div className="entity-list">
            <span>UserProfile: email, display name, role</span>
            <span>Access: current named team members and MIC</span>
            <span>Events: manual calendar updates from May to December</span>
            <span>Duty alerts: upcoming event reminders and missing duty details</span>
            <span>Event Attendance: event, user, check-in, check-out</span>
          </div>
        </div>
        <div className="dashboard-side-stack">
          <div className="mumm-panel metrics-panel">
            <div className="panel-eyebrow">Live Metrics</div>
            <h3 className="card-title">Operations</h3>
            <div className="metric-grid">
              {statCards.map((card) => (
                <div className="metric-tile" key={card.label}>
                  <strong>{card.value}</strong>
                  <span>{card.label}</span>
                </div>
              ))}
            </div>
          </div>
          <SmartDutyAlerts events={events} notifications={notifications} profile={profile} />
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

function EventCalendar({ appeals, canManage, events, notifications, profile, role }) {
  const [form, setForm] = useState(emptyEvent);
  const [editingId, setEditingId] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const groupedEvents = calendarMonths.map((month) => ({
    ...month,
    events: events.filter((event) => {
      if (!event.date) return false;
      return new Date(`${event.date}T00:00:00`).getMonth() === month.index;
    }),
  }));

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const toggleAssignedMember = (memberName) => {
    setForm((current) => {
      const assignedMembers = current.assignedMembers || [];
      const nextAssignedMembers = assignedMembers.includes(memberName)
        ? assignedMembers.filter((name) => name !== memberName)
        : [...assignedMembers, memberName];

      return {
        ...current,
        assignedMembers: nextAssignedMembers,
        dutyTeam: nextAssignedMembers.join(", "),
      };
    });
  };

  const resetForm = () => {
    setForm(emptyEvent);
    setEditingId("");
  };

  const createDutyNotifications = async (eventId, eventPayload, previousAssignedMembers = []) => {
    const assignedMembers = (eventPayload.assignedMembers || []).filter(
      (memberName) => !previousAssignedMembers.includes(memberName),
    );
    await Promise.all(
      assignedMembers.map((memberName) =>
        addDoc(collection(db, "duty_notifications"), {
          eventId,
          eventTitle: eventPayload.title,
          eventDate: eventPayload.date,
          memberName,
          read: false,
          title: `Duty assignment: ${eventPayload.title}`,
          message: `${memberName}, you have been assigned for ${eventPayload.title} on ${eventPayload.date}. Venue: ${eventPayload.venue || "TBA"}.`,
          createdAt: serverTimestamp(),
        }),
      ),
    );
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
      updatedAt: serverTimestamp(),
    };

    try {
      if (editingId) {
        const previousEvent = events.find((item) => item.id === editingId);
        await updateDoc(doc(db, "events", editingId), payload);
        await createDutyNotifications(editingId, payload, previousEvent?.assignedMembers || []);
      } else {
        const eventRef = await addDoc(collection(db, "events"), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        await createDutyNotifications(eventRef.id, payload);
      }
      resetForm();
    } finally {
      setIsSaving(false);
    }
  };

  const editEvent = (event) => {
    setEditingId(event.id);
    setForm({
      title: event.title || "",
      date: event.date || emptyEvent.date,
      venue: event.venue || "",
      dutyTeam: event.dutyTeam || "",
      assignedMembers: event.assignedMembers || [],
      mic: event.mic || emptyEvent.mic,
      status: event.status || "Planned",
      note: event.note || "",
    });
  };

  const removeEvent = async (eventId) => {
    if (!canManage) return;
    await deleteDoc(doc(db, "events", eventId));
  };

  return (
    <section className="hub-section">
      <div className="modern-grid event-workspace-grid">
        <form className="mumm-panel member-form" onSubmit={saveEvent}>
          <div className="panel-eyebrow">Manual Event Updates</div>
          <h2 className="neon-title">May to December Calendar</h2>
          <p className="small-info">
            Add or update school media duties manually. These records also power
            the smart duty alert system.
          </p>
          <div className="form-grid">
            <input
              className="cyber-input"
              disabled={!canManage}
              onChange={(event) => updateForm("title", event.target.value)}
              placeholder="Event title"
              required
              value={form.title}
            />
            <input
              className="cyber-input"
              disabled={!canManage}
              max="2026-12-31"
              min="2026-05-01"
              onChange={(event) => updateForm("date", event.target.value)}
              required
              type="date"
              value={form.date}
            />
            <input
              className="cyber-input"
              disabled={!canManage}
              onChange={(event) => updateForm("venue", event.target.value)}
              placeholder="Venue"
              value={form.venue}
            />
            <input
              className="cyber-input"
              disabled={!canManage}
              onChange={(event) => updateForm("dutyTeam", event.target.value)}
              placeholder="Duty team / members"
              value={form.dutyTeam}
            />
            <select
              className="cyber-input"
              disabled={!canManage}
              onChange={(event) => updateForm("mic", event.target.value)}
              value={form.mic}
            >
              {accessMembers.map((member) => (
                <option key={member.name}>{member.name}</option>
              ))}
            </select>
            <select
              className="cyber-input"
              disabled={!canManage}
              onChange={(event) => updateForm("status", event.target.value)}
              value={form.status}
            >
              <option>Planned</option>
              <option>Confirmed</option>
              <option>Completed</option>
              <option>Postponed</option>
            </select>
          </div>
          <textarea
            className="cyber-input event-note"
            disabled={!canManage}
            onChange={(event) => updateForm("note", event.target.value)}
            placeholder="Duty note or reminder"
            value={form.note}
          />
          <div className="assignment-picker">
            <div className="field-label">Assign Team Members</div>
            <div className="assignment-grid">
              {accessMembers
                .filter((member) => member.group !== "MIC / Mentor")
                .map((member) => (
                  <label className="assignment-option" key={member.name}>
                    <input
                      checked={(form.assignedMembers || []).includes(member.name)}
                      disabled={!canManage}
                      onChange={() => toggleAssignedMember(member.name)}
                      type="checkbox"
                    />
                    <span>
                      <strong>{member.name.replace("Master ", "")}</strong>
                      <small>{member.role}</small>
                    </span>
                  </label>
                ))}
            </div>
          </div>
          <div className="button-row">
            <button className="btn-dispatch" disabled={!canManage || isSaving} type="submit">
              {isSaving ? "SAVING..." : editingId ? "UPDATE EVENT" : "ADD EVENT"}
            </button>
            {editingId && (
              <button className="btn-ghost" onClick={resetForm} type="button">
                Cancel
              </button>
            )}
          </div>
        </form>

        <SmartDutyAlerts events={events} notifications={notifications} profile={profile} />
      </div>

      <div className="calendar-grid">
        {groupedEvents.map((month) => (
          <article className="mumm-panel calendar-month" key={month.label}>
            <div className="calendar-month-header">
              <h3 className="card-title">{month.label}</h3>
              <span className="soft-pill">{month.events.length} events</span>
            </div>
            <div className="calendar-event-list">
              {month.events.map((event) => (
                <div className="calendar-event-card" key={event.id}>
                  <div>
                    <strong>{event.title}</strong>
                    <span>{event.date} - {event.venue || "Venue TBA"}</span>
                    <small>
                      Assigned: {event.assignedMembers?.length ? event.assignedMembers.join(", ") : event.dutyTeam || "Duty team TBA"}
                    </small>
                    <small>MIC / Approval: {event.mic || "MIC TBA"}</small>
                  </div>
                  <div className="table-actions">
                    <button className="btn-mini" disabled={!canManage} onClick={() => editEvent(event)} type="button">
                      Edit
                    </button>
                    <button className="btn-mini danger" disabled={!canManage} onClick={() => removeEvent(event.id)} type="button">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {month.events.length === 0 && <p className="empty-month">No events yet.</p>}
            </div>
          </article>
        ))}
      </div>
      <DutyAppeals appeals={appeals} events={events} profile={profile} role={role} />
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
      await addDoc(collection(db, "duty_appeals"), {
        eventId: selectedEventId,
        eventTitle: selectedEvent?.title || "Untitled event",
        eventDate: selectedEvent?.date || "",
        memberName: currentMemberName,
        memberEmail: profile?.email || "",
        reason: reason.trim(),
        status: "Pending",
        monthKey: currentMonthKey,
        createdAt: serverTimestamp(),
      });
      setSelectedEventId("");
      setReason("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const reviewAppeal = async (appeal, status) => {
    await updateDoc(doc(db, "duty_appeals", appeal.id), {
      status,
      reviewedBy: profile?.displayName || profile?.email || "Approver",
      reviewedAt: serverTimestamp(),
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

function EventAttendance({ canManage }) {
  return (
    <section className="hub-section">
      <div className="mumm-panel admin-glow">
        <div className="panel-eyebrow">Event Attendance</div>
        <h2 className="neon-title">Attendance Tracking</h2>
        <p className="small-info">
          Track check-ins and check-outs for each event duty. This keeps
          attendance focused on events only.
        </p>
        <div className="entity-list">
          <span>Fields: eventId, userId, checkInTime, checkOutTime</span>
          <span>Firestore collection: attendance</span>
          <span>Use with Event Calendar records for duty-based attendance</span>
        </div>
        <button className="btn-dispatch" disabled={!canManage} type="button">
          {canManage ? "CREATE ATTENDANCE WORKFLOW" : "VIEW ONLY"}
        </button>
      </div>
    </section>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [appeals, setAppeals] = useState([]);
  const [events, setEvents] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [counts, setCounts] = useState({
    events: 0,
    attendance: 0,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (isPreviewMode) return;

      setUser(currentUser);

      if (!currentUser) {
        setProfile(null);
        return;
      }

      const profileRef = doc(db, "users", currentUser.uid);
      const profileSnapshot = await getDoc(profileRef);

      if (profileSnapshot.exists()) {
        setProfile({ id: profileSnapshot.id, ...profileSnapshot.data() });
      } else {
        const fallbackProfile = {
          id: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName || currentUser.email,
          role: inferRoleForUser(currentUser.displayName, currentUser.email),
          createdAt: serverTimestamp(),
        };
        await setDoc(profileRef, fallbackProfile);
        setProfile(fallbackProfile);
      }
    });

    return unsubscribe;
  }, [isPreviewMode]);

  useEffect(() => {
    const collections = ["attendance"];
    const unsubscribers = collections.map((collectionName) =>
      onSnapshot(collection(db, collectionName), (snapshot) => {
        setCounts((current) => ({ ...current, [collectionName]: snapshot.size }));
      }),
    );

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, []);

  useEffect(() => {
    const eventsQuery = query(collection(db, "events"), orderBy("date"));
    const unsubscribe = onSnapshot(eventsQuery, (snapshot) => {
      const nextEvents = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
      setEvents(nextEvents);
      setCounts((current) => ({ ...current, events: nextEvents.length }));
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "duty_notifications"), (snapshot) => {
      setNotifications(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "duty_appeals"), (snapshot) => {
      setAppeals(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
    });

    return unsubscribe;
  }, []);

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

  const handlePreviewLogin = () => {
    setIsPreviewMode(true);
    setUser({
      uid: "preview-president",
      email: "preview@sbcmediahub.local",
      displayName: "Preview President",
    });
    setProfile({
      id: "preview-president",
      email: "preview@sbcmediahub.local",
      displayName: "Preview President",
      role: "President",
    });
  };

  const handleSignOut = async () => {
    if (isPreviewMode) {
      setIsPreviewMode(false);
      setUser(null);
      setProfile(null);
      setActiveSection("dashboard");
      return;
    }

    await signOut(auth);
  };

  if (!user) {
    return <AuthGate onPreviewLogin={handlePreviewLogin} />;
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
          counts={counts}
          events={events}
          notifications={notifications}
          profile={profile}
          role={role}
        />
      )}
      {activeSection === "team" && <OurTeam />}
      {activeSection === "events" && (
        <EventCalendar
          appeals={appeals}
          canManage={["MIC", "President", "Head of Media", "Coordinator"].includes(role)}
          events={events}
          notifications={notifications}
          profile={profile}
          role={role}
        />
      )}
      {activeSection === "attendance" && (
        <EventAttendance canManage={["MIC", "President", "Head of Media", "Coordinator", "Editor"].includes(role)} />
      )}
      {activeSection === "inventory" && <InventoryManager />}
      {activeSection === "dispatch" && <EquipmentDispatch />}
    </main>
  );
}
