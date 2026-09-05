import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./App.css";

export default function App() {
  const [tab, setTab] = useState("capture");
  const [isOnline, setIsOnline] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [progress, setProgress] = useState(50);
  const [quantity, setQuantity] = useState("");
  const [photo, setPhoto] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  const [queue, setQueue] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:3000/api/wbs")
      .then((res) => {
        const leafTasks = res.data.filter((t) => t.level >= 5);
        setTasks(leafTasks);
        if (leafTasks.length > 0) {
          setSelectedTaskId(leafTasks[0].id);
          setProgress(leafTasks[0].progress);
        }
      })
      .catch(() => console.warn("Using offline task fallback"));

    const saved = localStorage.getItem("fieldsync_queue");
    if (saved) setQueue(JSON.parse(saved));
  }, []);

  const selectedTask = tasks.find((t) => t.id === parseInt(selectedTaskId)) || {
    id: 7, code: "L5.14", name: "Spool Fabrication", discipline: "Piping", progress: 54, unit: "Joints"
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/ogg" });
        setAudioBlob(blob);
      };

      mediaRecorderRef.current.start();
      setRecording(true);
      setRecordSeconds(0);
      timerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
    } catch (e) {
      alert("Microphone access denied. Ensure browser permissions are allowed.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
    clearInterval(timerRef.current);
    setRecording(false);
  };

  const syncItem = async (payload) => {
    const fd = new FormData();
    fd.append("wbs_id", payload.wbs_id);
    fd.append("progress", payload.progress);
    fd.append("quantity", payload.quantity);
    fd.append("unit", payload.unit);
    fd.append("lat", payload.lat);
    fd.append("lng", payload.lng);
    if (payload.imageFile) fd.append("image", payload.imageFile);
    if (payload.audioBlob) fd.append("audio", payload.audioBlob, "remark.ogg");

    return axios.post("http://localhost:3000/api/sync", fd);
  };

  useEffect(() => {
    if (isOnline) {
      const pending = queue.filter((i) => i.status === "QUEUED");
      pending.forEach(async (item) => {
        try {
          await syncItem(item);
          setQueue((prev) => {
            const updated = prev.map((q) => q.id === item.id ? { ...q, status: "SYNCED" } : q);
            localStorage.setItem("fieldsync_queue", JSON.stringify(updated));
            return updated;
          });
        } catch (e) {
          console.error("Auto-sync error", e);
        }
      });
    }
  }, [isOnline]);

  const handleSave = async () => {
    if (recording) {
      alert("Please stop the voice recording before saving.");
      return;
    }
    if (isSubmitting) return;
    
    setIsSubmitting(true);

    const payload = {
      id: Date.now(),
      wbs_id: selectedTask.id,
      code: selectedTask.code,
      name: selectedTask.name,
      progress: parseFloat(progress),
      quantity: quantity || "1",
      unit: selectedTask.unit || "Units",
      lat: 27.4728,
      lng: 95.0211,
      imageFile: photo,
      audioBlob: audioBlob,
      timestamp: new Date().toLocaleTimeString(),
      status: isOnline ? "SYNCED" : "QUEUED"
    };

    if (isOnline) {
      try {
        await syncItem(payload);
      } catch (err) {
        payload.status = "QUEUED";
      }
    }

    const updated = [payload, ...queue];
    setQueue(updated);
    localStorage.setItem("fieldsync_queue", JSON.stringify(updated));
    
    // Reset form state for the next capture
    setQuantity("");
    setPhoto(null);
    setAudioBlob(null);
    setRecordSeconds(0);
    setIsSubmitting(false);
    setTab("queue");
  };

  return (
    <div className="mobile-frame">
      <header className="app-header">
        <div className="title-group">
          <h2>{selectedTask.code} — {selectedTask.name}</h2>
          <p>{selectedTask.discipline} • Area C3 • Sector 7B</p>
        </div>
        <div
          className={`status-badge ${isOnline ? "online" : "offline"}`}
          onClick={() => setIsOnline(!isOnline)}
        >
          {isOnline ? "● ONLINE" : "● OFFLINE • QUEUED"}
        </div>
      </header>

      {tab === "capture" ? (
        <div className="screen-container">
          <div className="form-card">
            <label className="label">Activity (WBS)</label>
            <select
              value={selectedTaskId}
              onChange={(e) => {
                setSelectedTaskId(e.target.value);
                const t = tasks.find((x) => x.id === parseInt(e.target.value));
                if (t) setProgress(t.progress);
              }}
            >
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.code} {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-card">
            <div className="slider-header">
              <span className="label">% Complete</span>
              <span className="pct-old">was {selectedTask.progress}%</span>
            </div>
            <div className="pct-display">{progress}%</div>
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={(e) => setProgress(e.target.value)}
            />
          </div>

          <div className="form-card">
            <div className="row-inputs">
              <div>
                <label className="label">Quantity Done</label>
                <input
                  type="number"
                  placeholder="e.g. 12"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Unit</label>
                <input type="text" value={selectedTask.unit || "Units"} disabled />
              </div>
            </div>
          </div>

          <div className="form-card">
            <label className="label">Site Photo Verification</label>
            <label className="photo-box">
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => setPhoto(e.target.files[0])}
              />
              <span style={{ fontSize: "20px" }}>📷</span>
              <p>{photo ? photo.name : "Capture / Upload Site Photo"}</p>
            </label>
            <p className="geotag-text">↗ Geotag locked — 27.4728°N, 95.0211°E</p>
          </div>

          <div className="form-card">
            <label className="label">Voice Remark (Whisper AI)</label>
            <div className="voice-row">
              <button
                type="button"
                className={`rec-btn ${recording ? "recording" : ""}`}
                onClick={recording ? stopRecording : startRecording}
              />
              <span className="waveform">{recording ? "||||||||||||" : "|||li|l|li||l|"}</span>
              <span className="timer">
                0:{recordSeconds < 10 ? `0${recordSeconds}` : recordSeconds}
              </span>
            </div>
            {audioBlob && !recording && (
              <p className="text-[11px] text-emerald-500 mt-2 font-bold">✓ Audio recorded successfully</p>
            )}
          </div>

          <button 
            className="submit-btn" 
            onClick={handleSave}
            style={{ opacity: isSubmitting ? 0.7 : 1 }}
          >
            {isSubmitting ? "Syncing..." : "Save Entry"}
          </button>
        </div>
      ) : (
        <div className="screen-container">
          <div style={{ color: "#f8fafc", fontSize: "15px", fontWeight: 700 }}>
            Sync Queue ({queue.length} items)
          </div>
          {queue.map((item) => (
            <div key={item.id} className="queue-card">
              <div>
                <p style={{ color: "#ffffff", fontSize: "13px", fontWeight: 700 }}>
                  {item.code} {item.name}
                </p>
                <p style={{ color: "#7b93a8", fontSize: "11px", marginTop: "3px" }}>
                  {item.progress}% • {item.timestamp}
                </p>
              </div>
              <span className={`q-status ${item.status === "SYNCED" ? "synced" : "queued"}`}>
                {item.status}
              </span>
            </div>
          ))}
        </div>
      )}

      <footer className="tab-bar">
        <button
          className={`tab-item ${tab === "capture" ? "active" : ""}`}
          onClick={() => setTab("capture")}
        >
          Capture
        </button>
        <button
          className={`tab-item ${tab === "queue" ? "active" : ""}`}
          onClick={() => setTab("queue")}
        >
          Sync Queue
        </button>
      </footer>
    </div>
  );
}