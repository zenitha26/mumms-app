import React, { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";

const newGear = [
  { name: "Canon EOS RP", category: "Camera", status: "available", condition: "new", description: "Mirrorless Camera Body only — 26.2MP Full-Frame, 4K Video, RF Mount" },
  { name: "Canon EF-EOS R Mount Adapter", category: "Accessory", status: "available", condition: "new", description: "RF to EF Adapter for lens compatibility" },
  { name: "Canon RF 100-400mm f/5.6-8 IS USM", category: "Lens", status: "available", condition: "new", description: "RF Telephoto Zoom with Image Stabilization" },
  { name: "SanDisk 128GB Extreme SDXC 01", category: "Storage", status: "available", condition: "new", description: "UHS-I High-Speed, 4K Compatible" },
  { name: "SanDisk 128GB Extreme SDXC 02", category: "Storage", status: "available", condition: "new", description: "UHS-I High-Speed, 4K Compatible" },
  { name: "SanDisk 128GB Extreme SDXC 03", category: "Storage", status: "available", condition: "new", description: "UHS-I High-Speed, 4K Compatible" },
  { name: "SanDisk 128GB Extreme SDXC 04", category: "Storage", status: "available", condition: "new", description: "UHS-I High-Speed, 4K Compatible" },
  { name: "SanDisk 1TB Portable SSD", category: "Storage", status: "available", condition: "new", description: "High-speed External Storage, USB-C" },
  { name: "AXG USB 3-in-1 Memory Card Reader", category: "Accessory", status: "available", condition: "new", description: "High-Speed Data Transfer" },
  { name: "Godox V860III Speedlight Flash", category: "Lighting", status: "available", condition: "new", description: "Professional Lighting" },
  { name: "DJI Air 3S Fly More Combo", category: "Drone", status: "available", condition: "new", description: "Drone Aerial Cinematography" },
  { name: "DJI RS 4 Mini Combo Kit", category: "Gimbal", status: "available", condition: "new", description: "3-Axis Gimbal Stabilizer" },
  { name: "K&F Concept SA254M2 Tripod 01", category: "Accessory", status: "available", condition: "new", description: "with Monopod & Ball Head" },
  { name: "K&F Concept SA254M2 Tripod 02", category: "Accessory", status: "available", condition: "new", description: "with Monopod & Ball Head" },
  { name: "F&F 23-in-1 Camera Cleaning Kit", category: "Maintenance", status: "available", condition: "new", description: "Camera Maintenance Kit" },
  { name: "Andbon AD-80S 80L Dry Cabinet", category: "Storage", status: "available", condition: "new", description: "Digital Display Storage for moisture control" },
];

export default function InventoryManager() {
  const API_URL = "/api/equipment";
  const [isUploading, setIsUploading] = useState(false);
  const [inventory, setInventory] = useState([]);
  const [viewMode, setViewMode] = useState("system"); // 'system' or 'staging'
  const [connectionError, setConnectionError] = useState(null);

  const fetchInventory = async () => {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error("Failed to reach server");
      const data = await response.json();
      setInventory(data.map(item => ({ ...item, id: item._id })));
      setConnectionError(null);
    } catch (error) {
      console.error("Fetch error:", error);
      setConnectionError("Could not connect to the inventory server. Please ensure the backend is running.");
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const uploadNewGear = async () => {
    setIsUploading(true);
    try {
      const response = await fetch(`${API_URL}/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newGear),
      });
      if (response.ok) {
        alert("New equipment registered in MongoDB successfully.");
        setViewMode("system");
        fetchInventory();
      }
    } catch (error) {
      alert(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const printQR = (id, name) => {
    const svgElement = document.getElementById(`qr-${id}`);
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    const windowContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Asset Tag - ${name}</title>
          <style>
            @page { size: 30mm 30mm; margin: 0; }
            body { 
              display: flex; 
              flex-direction: column; 
              align-items: center; 
              justify-content: center; 
              height: 100vh; 
              font-family: 'Inter', sans-serif; 
              margin: 0;
              background: white;
              color: black;
            }
            .sticker {
              width: 25mm;
              height: 25mm;
              border: 1px dashed #ccc;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 1mm;
              box-sizing: border-box;
              text-align: center;
            }
            .brand { font-size: 5px; font-weight: bold; margin-bottom: 1mm; text-transform: uppercase; letter-spacing: 0.5px; }
            .name { font-size: 7px; font-weight: bold; margin-bottom: 0.5mm; width: 100%; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
            .id { font-size: 5px; color: #666; margin-top: 0.5mm; font-family: monospace; }
            img { width: 15mm; height: 15mm; }
          </style>
        </head>
        <body>
          <div class="sticker">
            <div class="brand">SBC Media Unit</div>
            <div class="name">${name}</div>
            <img src="${url}" />
            <div class="id">ID: ${id}</div>
          </div>
          <script>
            window.onload = () => { 
              setTimeout(() => {
                window.print(); 
                window.close(); 
              }, 500);
            }
          </script>
        </body>
      </html>
    `;
    const printWindow = window.open("", "_blank", "width=400,height=400");
    printWindow.document.write(windowContent);
    printWindow.document.close();
  };

  // Print all QR stickers for system inventory
  const printAllQR = () => {
    if (!inventory || inventory.length === 0) return;
    const printWindow = window.open("", "_blank", "width=800,height=600");
    const styles = `
      <style>
        @page { size: auto; margin: 5mm; }
        body { font-family: 'Inter', sans-serif; display: flex; flex-wrap: wrap; gap: 5mm; padding: 10px; }
        .sticker { width: 25mm; height: 25mm; border: 1px dashed #ccc; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 1mm; box-sizing: border-box; text-align: center; page-break-inside: avoid; }
        .brand { font-size: 5px; font-weight: bold; margin-bottom: 1mm; text-transform: uppercase; letter-spacing: 0.5px; }
        .name { font-size: 7px; font-weight: bold; margin-bottom: 0.5mm; width: 100%; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
        .id { font-size: 5px; color: #666; margin-top: 0.5mm; font-family: monospace; }
        img { width: 15mm; height: 15mm; }
      </style>`;
    
    const content = inventory.map(item => {
      const svgElement = document.getElementById(`qr-${item.id}`);
      let url = "";
      if (svgElement) {
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
        url = URL.createObjectURL(svgBlob);
      }
      return `
        <div class="sticker">
          <div class="brand">SBC Media Unit</div>
          <div class="name">${item.name}</div>
          ${url ? `<img src="${url}" />` : `<div style="width:28mm; height:28mm; background:#eee; display:flex; align-items:center; justify-content:center; font-size:8px;">QR ERR</div>`}
          <div class="id">ID: ${item.id}</div>
        </div>
      `;
    }).join("");

    printWindow.document.write(`<!DOCTYPE html><html><head><title>All QR Stickers</title>${styles}</head><body>${content}<script>window.onload = () => setTimeout(() => { window.print(); window.close(); }, 1000);</script></body></html>`);
    printWindow.document.close();
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
            into MongoDB with one verified batch action.
          </p>
          {connectionError && (
            <div className="scanner-error" style={{ marginTop: "10px", padding: "10px", borderRadius: "8px", background: "rgba(255, 0, 0, 0.1)", border: "1px solid rgba(255, 0, 0, 0.2)" }}>
              {connectionError}
            </div>
          )}
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
          <div className="panel-eyebrow">Inventory Control</div>
          <h2 className="neon-title">Management Mode</h2>
          <p className="small-info">
            Switch between viewing the active system inventory and staging new
            gear for registration.
          </p>

          <div className="button-row">
            <button
              className={viewMode === "system" ? "nav-pill active" : "nav-pill"}
              onClick={() => setViewMode("system")}
            >
              System Inventory
            </button>
            <button
              className={viewMode === "staging" ? "nav-pill active" : "nav-pill"}
              onClick={() => setViewMode("staging")}
            >
              Staging Area
            </button>
          </div>

          {viewMode === "staging" && (
            <button
              className="btn-dispatch"
              disabled={isUploading}
              onClick={uploadNewGear}
              style={{ marginTop: "20px" }}
              type="button"
            >
              {isUploading ? "REGISTERING GEAR..." : "REGISTER ALL STAGED GEAR"}
            </button>
          )}
          {viewMode === "system" && inventory.length > 0 && (
            <button
              className="btn-dispatch"
              onClick={printAllQR}
              style={{ marginTop: "20px" }}
              type="button"
            >
              Print All QR Stickers
            </button>
          )}
        </div>

        <div className="mumm-panel metrics-panel">
          <div className="panel-eyebrow">Inventory Stack</div>
          <h2 className="neon-title">Asset Overview</h2>
          <div className="metric-grid">
            <div className="metric-tile">
              <strong>{inventory.length}</strong>
              <span>Total Assets</span>
            </div>
            <div className="metric-tile">
              <strong>{new Set(inventory.map((i) => i.category)).size}</strong>
              <span>Categories</span>
            </div>
            <div className="metric-tile">
              <strong>{inventory.filter((i) => i.status === "available" || i.status === "Available").length}</strong>
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
                {viewMode === "system" && <th>QR Code / Action</th>}
                {viewMode === "staging" && <th>Description</th>}
                {viewMode === "staging" && <th>Condition</th>}
              </tr>
            </thead>
            <tbody>
              {viewMode === "system"
                ? inventory.map((gear) => (
                  <tr key={gear.id}>
                    <td>
                      <strong>{gear.name}</strong>
                      <br />
                      <small>{gear.description}</small>
                    </td>
                    <td>
                      <span className="role-badge">{gear.category}</span>
                    </td>
                    <td>{gear.status}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ background: "white", padding: "4px", borderRadius: "4px", display: "inline-block", lineHeight: 0 }}>
                          <QRCodeSVG
                            id={`qr-${gear.id}`}
                            value={gear.id}
                            size={40}
                            level={"H"}
                            includeMargin={false}
                          />
                        </div>
                        <button
                          className="btn-mini"
                          onClick={() => printQR(gear.id, gear.name)}
                        >
                          Print Sticker
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
                : newGear.map((gear) => (
                  <tr key={gear.name}>
                    <td>{gear.name}</td>
                    <td>
                      <span className="role-badge">{gear.category}</span>
                    </td>
                    <td>{gear.status}</td>
                    <td>
                      <small>{gear.description}</small>
                    </td>
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
