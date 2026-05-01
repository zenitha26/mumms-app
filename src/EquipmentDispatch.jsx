import React, { useEffect, useRef, useState } from "react";
import { QrReader } from "react-qr-reader";
import SignatureCanvas from "react-signature-canvas";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase";

export default function EquipmentDispatch() {
  const signatureRef = useRef(null);
  const [equipmentId, setEquipmentId] = useState("");
  const [equipmentName, setEquipmentName] = useState("");
  const [memberDetails, setMemberDetails] = useState("");
  const [purpose, setPurpose] = useState("");
  const [scannerError, setScannerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadEquipment = async () => {
      if (!equipmentId.trim()) {
        setEquipmentName("");
        return;
      }

      try {
        const equipmentRef = doc(db, "equipment", equipmentId.trim());
        const equipmentSnapshot = await getDoc(equipmentRef);

        if (!equipmentSnapshot.exists()) {
          setEquipmentName("Equipment record not found");
          return;
        }

        const equipment = equipmentSnapshot.data();
        setEquipmentName(equipment.name || equipment.itemName || "Unnamed Equipment");
      } catch (error) {
        setEquipmentName("Unable to load equipment");
        setScannerError(error.message);
      }
    };

    loadEquipment();
  }, [equipmentId]);

  const handleScanResult = (result, error) => {
    if (result?.text) {
      setEquipmentId(result.text.trim());
      setScannerError("");
    }

    if (error && error.name !== "NotFoundException") {
      setScannerError(error.message);
    }
  };

  const clearSignature = () => {
    signatureRef.current?.clear();
  };

  const handleDispatch = async (event) => {
    event.preventDefault();

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

    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      alert("Please capture the member signature.");
      return;
    }

    setIsSubmitting(true);

    try {
      const now = new Date();
      const signatureDataUrl = signatureRef.current
        .getTrimmedCanvas()
        .toDataURL("image/png");
      const cleanEquipmentId = equipmentId.trim();
      const cleanEquipmentName =
        equipmentName && equipmentName !== "Equipment record not found"
          ? equipmentName
          : cleanEquipmentId;

      await addDoc(collection(db, "equipment_logs"), {
        equipmentId: cleanEquipmentId,
        equipmentName: cleanEquipmentName,
        memberDetails: memberDetails.trim(),
        purpose: purpose.trim(),
        date: now.toISOString().slice(0, 10),
        checkoutTime: now.toISOString(),
        returnTime: null,
        signature: signatureDataUrl,
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "equipment", cleanEquipmentId), {
        status: "Assigned",
        assignedTo: memberDetails.trim(),
        lastDispatchPurpose: purpose.trim(),
        lastCheckoutTime: now.toISOString(),
        updatedAt: serverTimestamp(),
      });

      alert("Equipment dispatch authorized successfully.");
      setEquipmentId("");
      setEquipmentName("");
      setMemberDetails("");
      setPurpose("");
      clearSignature();
    } catch (error) {
      alert(`Dispatch failed: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mumm-panel admin-glow dispatch-panel">
      <div className="panel-eyebrow">Equipment Checkout</div>
      <h2 className="neon-title">Security Dispatch Protocol</h2>
      <p className="small-info">
        Scan the equipment QR code, capture member details and signature, then
        authorize the checkout into Firestore.
      </p>

      <form className="dispatch-grid" onSubmit={handleDispatch}>
        <div className="scanner-shell">
          <div className="scanner-frame">
            <QrReader
              constraints={{ facingMode: "environment" }}
              onResult={handleScanResult}
              scanDelay={700}
              videoContainerStyle={{ paddingTop: "72%" }}
              videoStyle={{ borderRadius: "24px", objectFit: "cover" }}
            />
            <div className="scanner-corners" />
          </div>
          <p className="scanner-note">
            Camera access works on localhost or HTTPS. Manual entry is available
            below for testing.
          </p>
          {scannerError && <p className="scanner-error">{scannerError}</p>}
        </div>

        <div className="dispatch-form">
          <label className="field-label" htmlFor="equipment-id">
            Scanned Equipment ID
          </label>
          <input
            className="cyber-input"
            id="equipment-id"
            onChange={(event) => setEquipmentId(event.target.value)}
            placeholder="Scan or enter equipment document ID"
            value={equipmentId}
          />

          <div className="equipment-status-card">
            <span>Equipment Name</span>
            <strong>{equipmentName || "Waiting for scan..."}</strong>
          </div>

          <label className="field-label" htmlFor="member-details">
            Member Name & Details
          </label>
          <input
            className="cyber-input"
            id="member-details"
            onChange={(event) => setMemberDetails(event.target.value)}
            placeholder="Name, class, admission number"
            value={memberDetails}
          />

          <label className="field-label" htmlFor="purpose">
            Purpose of Use
          </label>
          <input
            className="cyber-input"
            id="purpose"
            onChange={(event) => setPurpose(event.target.value)}
            placeholder="Cricket Match Coverage, Assembly..."
            value={purpose}
          />

          <div className="signature-header">
            <label className="field-label">Digital Signature</label>
            <button className="btn-mini" onClick={clearSignature} type="button">
              Clear Signature
            </button>
          </div>

          <div className="signature-box">
            <SignatureCanvas
              ref={signatureRef}
              canvasProps={{
                className: "signature-canvas",
              }}
              penColor="#00ff88"
            />
          </div>

          <button className="btn-dispatch" disabled={isSubmitting} type="submit">
            {isSubmitting ? "AUTHORIZING..." : "AUTHORIZE DISPATCH"}
          </button>
        </div>
      </form>
    </section>
  );
}
