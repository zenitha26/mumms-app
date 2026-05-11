import React, { useEffect, useRef, useState } from "react";


export default function EquipmentDispatch({ profile, events = [] }) {
  const API_BASE = "/api";
  const signatureRef = useRef(null);
  const [equipmentId, setEquipmentId] = useState("");
  const [equipmentName, setEquipmentName] = useState("");
  const [equipmentStatus, setEquipmentStatus] = useState("Available");
  const [currentHolder, setCurrentHolder] = useState("");
  const [memberDetails, setMemberDetails] = useState("");
  const [purpose, setPurpose] = useState("");
  const [scannerError, setScannerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingEquipment, setIsLoadingEquipment] = useState(false);
  const [dispatchMode, setDispatchMode] = useState("checkout");
  const [isScannerActive, setIsScannerActive] = useState(true);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [signatureData, setSignatureData] = useState("");
  const [isDrawing, setIsDrawing] = useState(false);

  const currentMemberName = profile?.displayName || profile?.email || "";

  useEffect(() => {
    if (profile) {
      setMemberDetails(profile.displayName || profile.email || "");
    }
  }, [profile]);

  const assignedEvents = events.filter((event) => {
    const isAssigned =
      event.assignedMembers?.includes(currentMemberName) ||
      (currentMemberName && event.dutyTeam?.includes(currentMemberName));
    return isAssigned;
  });

  const fetchEquipmentDetails = async (qr_id) => {
    const id = qr_id.trim();
    if (!id) {
      setEquipmentName("");
      setEquipmentStatus("Available");
      setCurrentHolder("");
      return;
    }

    setIsLoadingEquipment(true);
    try {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/equipments?qrId=eq.${id}&select=*`,
        {
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
          },
        }
      );

      const data = await response.json();

      if (data && data.length > 0) {
        const item = data[0];
        setEquipmentName(item.name || item.itemName || "Unnamed Equipment");
        setEquipmentStatus(item.status || "Available");
        setCurrentHolder(item.assignedTo || "");
        
        if (item.status === "Assigned") {
          setDispatchMode("return");
        } else {
          setDispatchMode("checkout");
        }
      } else {
        throw new Error("Equipment not found");
      }
    } catch (error) {
      console.error("Error fetching equipment:", error);
      setEquipmentName(`Equipment record not found (${id})`);
      setEquipmentStatus("Available");
      setCurrentHolder("");
    } finally {
      setIsLoadingEquipment(false);
    }
  };

  useEffect(() => {
    fetchEquipmentDetails(equipmentId);
  }, [equipmentId]);

  const scannerRef = useRef(null);

  useEffect(() => {
    if (!isScannerActive) return;

    let mounted = true;
    let isProcessingScan = false;

    const startScanner = async () => {
      // Add a small delay to ensure DOM is ready (especially when switching tabs)
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (!mounted) return;

      try {
        const { Html5Qrcode } = await import("html5-qrcode");

        const target = document.getElementById("qr-reader-target");

        if (!target) {
          console.error("QR target missing");
          return;
        }

        target.innerHTML = "";

        scannerRef.current = new Html5Qrcode("qr-reader-target");

        const cameras = await Html5Qrcode.getCameras();

        console.log("Available cameras:", cameras);

        if (!cameras?.length) {
          throw new Error("No cameras found");
        }

        const backCamera = cameras.find(
          (c) =>
            c.label.toLowerCase().includes("back") ||
            c.label.toLowerCase().includes("rear")
        );

        const cameraId = backCamera
          ? backCamera.id
          : cameras[0].id;

        await scannerRef.current.start(
          cameraId,
          {
            fps: 10,
            qrbox: {
              width: 250,
              height: 250,
            },
            aspectRatio: 1,
            videoConstraints: {
              facingMode: {
                ideal: "environment",
              },
            },
          },

          async (decodedText) => {
            if (isProcessingScan) return;

            isProcessingScan = true;

            console.log("RAW QR:", decodedText);

            let cleanValue = decodedText;

            try {
              // 1. Try parsing as JSON
              const parsed = JSON.parse(decodedText);
              cleanValue = parsed.id || parsed.equipmentId || parsed.code || decodedText;
            } catch {
              // 2. Try parsing as URL
              try {
                const url = new URL(decodedText);
                const idParam = url.searchParams.get('id') || url.searchParams.get('equipmentId');
                if (idParam) {
                  cleanValue = idParam;
                } else {
                  cleanValue = url.pathname.split('/').pop() || decodedText;
                }
              } catch {
                // 3. Fallback to simple split or just the text
                cleanValue = decodedText.split('/').pop().trim();
              }
            }

            console.log("FINAL QR:", cleanValue);

            if (!cleanValue) {
              isProcessingScan = false;
              alert("Could not extract a valid ID from QR");
              return;
            }

            alert(`Scanned Value: ${cleanValue}`);

            setEquipmentId(cleanValue);

            setScanSuccess(true);

            setTimeout(async () => {
              try {
                // Native stop fallback to prevent black screen crash
                const video = document.querySelector("#qr-reader-target video");
                if (video && video.srcObject) {
                  const tracks = video.srcObject.getTracks();
                  tracks.forEach(track => track.stop());
                }

                if (scannerRef.current) {
                  await scannerRef.current.stop().catch(() => {});
                  await scannerRef.current.clear().catch(() => {});
                }
              } catch (err) {
                console.error("Scanner stop error:", err);
              }

              if (mounted) {
                setIsScannerActive(false);
              }
            }, 500);
            
            setTimeout(() => setScanSuccess(false), 2000);
          },

          () => {}
        );

        setTimeout(() => {
          const video = document.querySelector(
            "#qr-reader-target video"
          );

          console.log("VIDEO ELEMENT:", video);

          if (video) {
            video.setAttribute("playsinline", true);
            video.setAttribute("autoplay", true);
            video.setAttribute("muted", true);

            video.style.width = "100%";
            video.style.height = "100%";
            video.style.objectFit = "cover";

            video.play().catch(console.error);
          } else {
            console.error("Video element not found");
          }
        }, 1000);

      } catch (err) {
        console.error("Scanner start error:", err);

        setScannerError(
          err.message || "Scanner failed"
        );

        setIsScannerActive(false);
      }
    };

    startScanner();

    return () => {
      mounted = false;

      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .catch(() => {})
          .finally(() => {
            scannerRef.current = null;
          });
      }
    };
  }, [isScannerActive]);

  const clearSignature = () => {
    const canvas = signatureRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setSignatureData("");
  };

  const handleDispatch = async (event) => {
    event.preventDefault();
    console.log("=== Dispatch Attempt ===");
    console.log("Equipment ID:", equipmentId);
    console.log("Member Details:", memberDetails);
    console.log("Purpose:", purpose);
    console.log("Dispatch Mode:", dispatchMode);
    
    if (!equipmentId.trim()) {
      alert("Please scan or enter an equipment ID.");
      return;
    }
    if (!memberDetails.trim()) {
      alert("Please enter member details.");
      return;
    }
    if (!purpose.trim()) {
      alert("Please enter the purpose of use.");
      return;
    }
    if (dispatchMode === "checkout" && !signatureData) {
      alert("Please capture the member signature.");
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date();
      const signatureDataUrl = dispatchMode === "checkout" ? signatureData : null;

      const cleanEquipmentId = equipmentId.trim();
      const cleanEquipmentName =
        equipmentName && equipmentName !== "Equipment record not found"
          ? equipmentName
          : cleanEquipmentId;

      if (dispatchMode === "checkout") {
        console.log("Sending dispatch log request...");
        const logResponse = await fetch(`${API_BASE}/logs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            equipmentId: cleanEquipmentId,
            equipmentName: cleanEquipmentName,
            memberDetails: memberDetails.trim(),
            purpose: purpose.trim(),
            date: now.toISOString().slice(0, 10),
            checkoutTime: now,
            signature: signatureDataUrl,
            scannedBy: currentMemberName, // Added account detail
          }),
        });
        console.log("Dispatch log response status:", logResponse.status);

        console.log("Updating equipment status...");
        const eqResponse = await fetch(`${API_BASE}/equipment/${cleanEquipmentId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "Assigned",
            assignedTo: memberDetails.trim(),
          }),
        });
        console.log("Equipment update response status:", eqResponse.status);
        
        alert(`Success: ${cleanEquipmentName} checked out at ${now.toLocaleTimeString()}`);
      } else {
        // Log the return
        console.log("Logging return...");
        const returnLogResponse = await fetch(`${API_BASE}/logs/return/${cleanEquipmentId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
        });
        console.log("Return log response status:", returnLogResponse.status);

        console.log("Updating equipment status...");
        const eqResponse = await fetch(`${API_BASE}/equipment/${cleanEquipmentId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "Available", assignedTo: null }),
        });
        console.log("Equipment update response status:", eqResponse.status);
        
        alert(`Success: ${cleanEquipmentName} returned at ${now.toLocaleTimeString()}`);
      }
      setEquipmentId("");
      setEquipmentName("");
      setPurpose("");
      clearSignature();
      setIsScannerActive(true); // Restart scanner for next scan
    } catch (error) {
      alert(`Operation failed: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mumm-panel admin-glow dispatch-panel">
      <header className="hero-shell">
        <div className="panel-eyebrow">Equipment Logistics</div>
        <h2 className="neon-title">Security Dispatch & Return</h2>
        <p className="small-info">
          Automatic back-camera detection enabled. Scan any SBC asset tag to begin the protocol.
        </p>
      </header>

      <form className="dispatch-grid" onSubmit={handleDispatch}>
        <div className="scanner-shell modern-scanner">
          <div className="scanner-viewport">
            <div id="qr-reader-target" style={{ width: "100%", height: "100%" }}></div>
            
            {!isScannerActive ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%', position: 'absolute', top: 0, left: 0, background: '#1a1a1a', zIndex: 20 }}>
                {scanSuccess ? (
                  <div className="scan-success-message" style={{ position: 'static', transform: 'none', marginBottom: '20px' }}>
                    ✓ SCAN COMPLETED
                  </div>
                ) : (
                  <p style={{ color: '#aaa', marginBottom: '16px' }}>Scanner is inactive</p>
                )}
                <button 
                  onClick={() => setIsScannerActive(true)}
                  className="btn-dispatch"
                  type="button"
                >
                  📷 Open Scanner
                </button>
              </div>
            ) : (
              <div className={`scanner-overlay ${scanSuccess ? 'success-highlight' : ''}`}>
                <div className="scanner-frame"></div>
                <div className="scanner-line"></div>
              </div>
            )}
          </div>
          {equipmentId && (
            <div className="equipment-status-card">
              <div className="status-row">
                <span>Scanned ID:</span>
                <strong>{equipmentId}</strong>
              </div>
              <div className="status-row">
                <span>Equipment Name:</span>
                <strong>{equipmentName}</strong>
              </div>
              <div className="status-badge" data-status={equipmentStatus}>
                {equipmentStatus}
              </div>
              {currentHolder && (
                <div className="holder-info">
                  <span>Currently with:</span>
                  <strong>{currentHolder}</strong>
                </div>
              )}
            </div>
          )}
          {scannerError && <p className="scanner-error">{scannerError}</p>}
          <div className="scanner-hint">Point camera at QR code for auto-detection</div>
        </div>

        <div className="dispatch-form">
          <div className="mode-selector">
            <button
              className={dispatchMode === "checkout" ? "nav-pill active" : "nav-pill"}
              onClick={() => setDispatchMode("checkout")}
              type="button"
            >
              Checkout
            </button>
            <button
              className={dispatchMode === "return" ? "nav-pill active" : "nav-pill"}
              onClick={() => setDispatchMode("return")}
              type="button"
            >
              Return
            </button>
          </div>

          <label className="field-label" htmlFor="equipment-id">Scanned Equipment ID</label>
          <input
            className="cyber-input"
            id="equipment-id"
            onChange={(event) => setEquipmentId(event.target.value)}
            value={equipmentId}
          />

          {equipmentName && (
            <div className="equipment-status-pill" style={{ marginBottom: "12px" }}>
              <span>{isLoadingEquipment ? "Loading…" : equipmentName}</span>
              {!isLoadingEquipment && (
                <span
                  className="soft-pill"
                  style={{ marginLeft: "8px", color: equipmentStatus === "Assigned" ? "#ff6b6b" : "#00ff88" }}
                >
                  {equipmentStatus}
                </span>
              )}
            </div>
          )}

          <label className="field-label" htmlFor="member-details">Member</label>
          <input
            className="cyber-input"
            id="member-details"
            readOnly
            value={memberDetails}
          />

          <label className="field-label" htmlFor="purpose">
            Purpose of Use / Event
          </label>
          <select
            className="cyber-input"
            id="purpose"
            onChange={(event) => setPurpose(event.target.value)}
            value={purpose}
          >
            <option value="">Select purpose or event</option>
            <optgroup label="Upcoming Duties">
              {assignedEvents.map((event) => (
                <option key={event.id} value={event.title}>
                  {event.title} ({event.date})
                </option>
              ))}
            </optgroup>
            <optgroup label="General">
              <option value="Maintenance">Maintenance</option>
              <option value="Test / Practice">Test / Practice</option>
              <option value="Personal Practice">Personal Practice</option>
              <option value="Other">Other</option>
            </optgroup>
          </select>

          {dispatchMode === "checkout" && (
            <>
              <div className="signature-header" style={{ marginTop: "20px" }}>
                <label className="field-label">Digital Signature</label>
                <button
                  className="btn-mini"
                  onClick={() => {
                    const canvas = signatureRef.current;
                    if (canvas) {
                      const ctx = canvas.getContext("2d");
                      ctx.clearRect(0, 0, canvas.width, canvas.height);
                      setSignatureData("");
                    }
                  }}
                  type="button"
                >
                  Clear
                </button>
              </div>

              <div className="signature-box" style={{ background: '#111', border: '1px solid #00ff88', borderRadius: '12px', padding: '10px' }}>
                <canvas
                  ref={signatureRef}
                  width={400}
                  height={200}
                  style={{ width: '100%', height: '200px', cursor: 'crosshair', touchAction: 'none' }}
                  onMouseDown={(e) => {
                    const canvas = signatureRef.current;
                    const ctx = canvas.getContext("2d");
                    ctx.strokeStyle = "#00ff88";
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
                    setIsDrawing(true);
                  }}
                  onMouseMove={(e) => {
                    if (!isDrawing) return;
                    const canvas = signatureRef.current;
                    const ctx = canvas.getContext("2d");
                    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
                    ctx.stroke();
                  }}
                  onMouseUp={() => {
                    setIsDrawing(false);
                    setSignatureData(signatureRef.current.toDataURL());
                  }}
                  onTouchStart={(e) => {
                    const canvas = signatureRef.current;
                    const ctx = canvas.getContext("2d");
                    ctx.strokeStyle = "#00ff88";
                    ctx.lineWidth = 2;
                    const rect = canvas.getBoundingClientRect();
                    const x = e.touches[0].clientX - rect.left;
                    const y = e.touches[0].clientY - rect.top;
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    setIsDrawing(true);
                  }}
                  onTouchMove={(e) => {
                    if (!isDrawing) return;
                    const canvas = signatureRef.current;
                    const ctx = canvas.getContext("2d");
                    const rect = canvas.getBoundingClientRect();
                    const x = e.touches[0].clientX - rect.left;
                    const y = e.touches[0].clientY - rect.top;
                    ctx.lineTo(x, y);
                    ctx.stroke();
                    e.preventDefault(); // Prevent scrolling while drawing
                  }}
                  onTouchEnd={() => {
                    setIsDrawing(false);
                    setSignatureData(signatureRef.current.toDataURL());
                  }}
                />
              </div>
            </>
          )}

          <button
            className="btn-dispatch"
            disabled={isSubmitting}
            style={{ marginTop: "20px" }}
            type="submit"
          >
            {isSubmitting
              ? "PROCESSING..."
              : dispatchMode === "checkout"
                ? "AUTHORIZE DISPATCH"
                : "PROCESS RETURN"}
          </button>
        </div>
      </form>
    </section>
  );
}
