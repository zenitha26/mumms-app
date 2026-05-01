import React, { useState } from "react";
import { collection, doc, writeBatch } from "firebase/firestore";
import { db } from "./firebase";

const newGear = [
  { name: "Canon EOS RP", category: "Camera", status: "available", condition: "new" },
  { name: "DJI RS 4 Combo Kit Gimbal", category: "Gimbal", status: "available", condition: "new" },
  { name: "100-400mm Lens", category: "Lens", status: "available", condition: "new" },
  { name: "Mount Adapter", category: "Accessory", status: "available", condition: "new" },
  { name: "DJI Air 3S Drone", category: "Drone", status: "available", condition: "new" },
  { name: "SanDisk Portable 1TB SSD", category: "Storage", status: "available", condition: "new" },
  { name: "Tripod 01", category: "Accessory", status: "available", condition: "new" },
  { name: "Tripod 02", category: "Accessory", status: "available", condition: "new" },
  { name: "128GB SD Card 01", category: "Storage", status: "available", condition: "new" },
  { name: "128GB SD Card 02", category: "Storage", status: "available", condition: "new" },
  { name: "128GB SD Card 03", category: "Storage", status: "available", condition: "new" },
  { name: "128GB SD Card 04", category: "Storage", status: "available", condition: "new" },
  { name: "128GB SD Card 05", category: "Storage", status: "available", condition: "new" },
];

export default function InventoryManager() {
  const [isUploading, setIsUploading] = useState(false);

  const uploadNewGear = async () => {
    setIsUploading(true);

    try {
      const batch = writeBatch(db);
      const equipmentCollection = collection(db, "equipment");

      newGear.forEach((gear) => {
        const gearRef = doc(equipmentCollection);
        batch.set(gearRef, gear);
      });

      await batch.commit();
      alert("New equipment uploaded successfully.");
    } catch (error) {
      alert(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="mumm-main-layout">
      <div className="ambient-orb ambient-orb-one" />
      <div className="ambient-orb ambient-orb-two" />

      <header className="hero-shell">
        <div>
          <span className="mumm-tag">System Admin</span>
          <h1 className="main-title">Inventory Command</h1>
          <p className="hero-copy">
            A calm control surface for registering the Media Unit's newest gear
            into Firestore with one verified batch action.
          </p>
        </div>

        <div className="device-card">
          <span className="device-dot" />
          <div>
            <strong>Firestore Sync</strong>
            <small>{newGear.length} staged assets</small>
          </div>
        </div>
      </header>

      <div className="modern-grid">
        <div className="mumm-panel admin-glow">
          <div className="panel-eyebrow">Batch Console</div>
          <h2 className="neon-title">Incoming Gear Registration</h2>
          <p className="small-info">
            Batch upload the latest camera, drone, storage, and accessory gear
            into Firestore.
          </p>

          <button
            className="btn-dispatch"
            disabled={isUploading}
            onClick={uploadNewGear}
            type="button"
          >
            {isUploading ? "UPLOADING NEW GEAR..." : "UPLOAD NEW GEAR"}
          </button>
        </div>

        <div className="mumm-panel metrics-panel">
          <div className="panel-eyebrow">Inventory Stack</div>
          <h2 className="neon-title">Ready to Deploy</h2>
          <div className="metric-grid">
            <div className="metric-tile">
              <strong>{newGear.length}</strong>
              <span>New Assets</span>
            </div>
            <div className="metric-tile">
              <strong>6</strong>
              <span>Categories</span>
            </div>
            <div className="metric-tile">
              <strong>100%</strong>
              <span>Available</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mumm-panel table-panel">
        <div className="table-heading">
          <div>
            <div className="panel-eyebrow">Preview</div>
            <h2 className="neon-title">New Equipment Manifest</h2>
          </div>
          <span className="soft-pill">Figma Mixed UI</span>
        </div>

        <div className="table-container-modern">
          <table className="cyber-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Status</th>
                <th>Condition</th>
              </tr>
            </thead>
            <tbody>
              {newGear.map((gear) => (
                <tr key={gear.name}>
                  <td>{gear.name}</td>
                  <td>
                    <span className="role-badge">{gear.category}</span>
                  </td>
                  <td>{gear.status}</td>
                  <td>{gear.condition}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
