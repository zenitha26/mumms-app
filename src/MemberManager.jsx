import React, { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase";

const emptyMember = {
  name: "",
  className: "",
  admissionNumber: "",
  birthday: "",
  whatsapp: "",
  role: "Photographer",
  boardType: "Operations",
};

const roles = ["President", "Head of Media", "Editor", "Photographer"];
const boardTypes = ["Head Board", "Executive Board", "Operations"];

export default function MemberManager({ canManage }) {
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState(emptyMember);
  const [editingId, setEditingId] = useState("");
  const [search, setSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const membersQuery = query(collection(db, "members"), orderBy("name"));
    const unsubscribe = onSnapshot(membersQuery, (snapshot) => {
      setMembers(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
    });

    return unsubscribe;
  }, []);

  const visibleMembers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return members;

    return members.filter((member) => {
      const searchableText = `${member.name} ${member.className} ${member.admissionNumber} ${member.role} ${member.boardType}`;
      return searchableText.toLowerCase().includes(normalizedSearch);
    });
  }, [members, search]);

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const resetForm = () => {
    setForm(emptyMember);
    setEditingId("");
  };

  const saveMember = async (event) => {
    event.preventDefault();
    if (!canManage) return;

    setIsSaving(true);

    try {
      const payload = {
        ...form,
        updatedAt: serverTimestamp(),
      };

      if (editingId) {
        await updateDoc(doc(db, "members", editingId), payload);
      } else {
        await addDoc(collection(db, "members"), {
          ...payload,
          createdAt: serverTimestamp(),
        });
      }

      resetForm();
    } finally {
      setIsSaving(false);
    }
  };

  const editMember = (member) => {
    setEditingId(member.id);
    setForm({
      name: member.name || "",
      className: member.className || "",
      admissionNumber: member.admissionNumber || "",
      birthday: member.birthday || "",
      whatsapp: member.whatsapp || "",
      role: member.role || "Photographer",
      boardType: member.boardType || "Operations",
    });
  };

  const removeMember = async (memberId) => {
    if (!canManage) return;
    await deleteDoc(doc(db, "members", memberId));
  };

  return (
    <section className="hub-section">
      <div className="table-heading">
        <div>
          <div className="panel-eyebrow">Member Entity</div>
          <h2 className="neon-title">Media Unit Members</h2>
        </div>
        <input
          className="cyber-input compact-input"
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search members..."
          value={search}
        />
      </div>

      <div className="modern-grid member-grid">
        <form className="mumm-panel member-form" onSubmit={saveMember}>
          <div className="panel-eyebrow">
            {editingId ? "Update Record" : "Create Record"}
          </div>
          <h3 className="card-title">Member Profile</h3>
          <div className="form-grid">
            <input
              className="cyber-input"
              disabled={!canManage}
              onChange={(event) => updateForm("name", event.target.value)}
              placeholder="Name"
              required
              value={form.name}
            />
            <input
              className="cyber-input"
              disabled={!canManage}
              onChange={(event) => updateForm("className", event.target.value)}
              placeholder="Class"
              required
              value={form.className}
            />
            <input
              className="cyber-input"
              disabled={!canManage}
              onChange={(event) => updateForm("admissionNumber", event.target.value)}
              placeholder="Admission Number"
              required
              value={form.admissionNumber}
            />
            <input
              className="cyber-input"
              disabled={!canManage}
              onChange={(event) => updateForm("birthday", event.target.value)}
              type="date"
              value={form.birthday}
            />
            <input
              className="cyber-input"
              disabled={!canManage}
              onChange={(event) => updateForm("whatsapp", event.target.value)}
              placeholder="WhatsApp Number"
              value={form.whatsapp}
            />
            <select
              className="cyber-input"
              disabled={!canManage}
              onChange={(event) => updateForm("role", event.target.value)}
              value={form.role}
            >
              {roles.map((role) => (
                <option key={role}>{role}</option>
              ))}
            </select>
            <select
              className="cyber-input"
              disabled={!canManage}
              onChange={(event) => updateForm("boardType", event.target.value)}
              value={form.boardType}
            >
              {boardTypes.map((boardType) => (
                <option key={boardType}>{boardType}</option>
              ))}
            </select>
          </div>

          <div className="button-row">
            <button className="btn-dispatch" disabled={!canManage || isSaving} type="submit">
              {isSaving ? "SAVING..." : editingId ? "UPDATE MEMBER" : "ADD MEMBER"}
            </button>
            {editingId && (
              <button className="btn-ghost" onClick={resetForm} type="button">
                Cancel
              </button>
            )}
          </div>
          {!canManage && (
            <p className="small-info">
              Your role can view members, but only President, Head of Media, and
              Editor roles can edit records.
            </p>
          )}
        </form>

        <div className="mumm-panel metrics-panel">
          <div className="panel-eyebrow">Board Overview</div>
          <h3 className="card-title">Member Metrics</h3>
          <div className="metric-grid">
            <div className="metric-tile">
              <strong>{members.length}</strong>
              <span>Total Members</span>
            </div>
            <div className="metric-tile">
              <strong>{members.filter((member) => member.boardType === "Head Board").length}</strong>
              <span>Head Board</span>
            </div>
            <div className="metric-tile">
              <strong>{members.filter((member) => member.boardType === "Operations").length}</strong>
              <span>Operations</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mumm-panel table-panel">
        <div className="table-container-modern">
          <table className="cyber-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Class</th>
                <th>Admission</th>
                <th>Birthday</th>
                <th>WhatsApp</th>
                <th>Role</th>
                <th>Board</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleMembers.map((member) => (
                <tr key={member.id}>
                  <td>{member.id.slice(0, 6)}</td>
                  <td>{member.name}</td>
                  <td>{member.className}</td>
                  <td>{member.admissionNumber}</td>
                  <td>{member.birthday || "Not set"}</td>
                  <td>{member.whatsapp || "Not set"}</td>
                  <td>
                    <span className="role-badge">{member.role}</span>
                  </td>
                  <td>{member.boardType}</td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="btn-mini"
                        disabled={!canManage}
                        onClick={() => editMember(member)}
                        type="button"
                      >
                        Edit
                      </button>
                      <button
                        className="btn-mini danger"
                        disabled={!canManage}
                        onClick={() => removeMember(member.id)}
                        type="button"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {visibleMembers.length === 0 && (
                <tr>
                  <td colSpan="9">No member records found yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
