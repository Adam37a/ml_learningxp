import { useEffect, useMemo, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  TimeScale,
} from "chart.js";
import { Line } from "react-chartjs-2";


ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

export default function App() {
  const API_BASE = "http://localhost:8000";

  const [start, setStart] = useState("2025-12-18T13:00");
  const [horizonHours, setHorizonHours] = useState(24);
  const [freqMin, setFreqMin] = useState(30);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const buildUrl = () => {
    const startWithSeconds = start.length === 16 ? `${start}:00` : start;

    const params = new URLSearchParams({
      start: startWithSeconds,
      horizon_hours: String(horizonHours),
      freq_min: String(freqMin),
    });

    return `${API_BASE}/predictions2?${params.toString()}`;
  };

  const fetchPredictions = async () => {
    setLoading(true);
    setError("");

    try {
      const url = buildUrl();
      const res = await fetch(url, { method: "GET" });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} ${res.statusText} ${text}`);
      }

      const data = await res.json();

      if (!data?.rows || !Array.isArray(data.rows)) {
        throw new Error("Réponse invalide: rows manquant ou pas un tableau.");
      }

      setRows(data.rows);
    } catch (e) {
      setRows([]);
      setError(e?.message ?? "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  // (optionnel) auto-load au démarrage
  useEffect(() => {
    fetchPredictions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const PRIMARY = "#2563eb";   // bleu
const TEXT = "#334155";      // gris foncé
const GRID = "#e2e8f0";      // gris clair

  const chartData = useMemo(() => {
    const labels = rows.map((r) => r.ts); // string ISO
    const values = rows.map((r) => r.prediction);

    return {
      labels,
datasets: [
  {
    label: "Prediction",
    data: values,
    tension: 0.3,

    borderColor: "#2563eb",      
    backgroundColor: "rgba(37, 99, 235, 0.15)", // zone sous la ligne
    pointBackgroundColor: "#2563eb",
    pointBorderColor: "#ffffff",

    borderWidth: 2,
    pointRadius: 3,
    fill: true,                    // remplit sous la courbe
  },
],
    };
  }, [rows]);

  const chartOptions = useMemo(
  () => ({
    responsive: true,
    plugins: {
      legend: {
        display: true,
        labels: {
          color: "#2563eb",
        },
      },
      tooltip: { enabled: true },
    },
    scales: {
      x: {
        ticks: { color:  "white" },
        border: { display: true, color: "#2563eb"  },
        title: { display: true, text: "Time", color:  "white" },
      },
      y: {
        ticks: { color:  "white" },
        border: { display: true, color:  "#2563eb" },
        title: { display: true, text: "Prediction", color:  "white" },
      },
    },
  }),
  []
);



  console.log("Rerender App", { rows, chartData });

  return (
  <div
    style={{
      minHeight: "100vh",
      minWidth: "100vw",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <div
      style={{
        width: "100%",
        maxWidth: 1100,
        padding: 24,
        textAlign: "center",
      }}
    >
      <h1 style={{ marginBottom: 24 }}>Predictions</h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(160px, 1fr))",
          gap: 16,
          justifyItems: "center",
          marginBottom: 24,
        }}
      >
        <div style={{ width: "100%" }}>
          <label style={{ display: "block", marginBottom: 6 }}>Start</label>
          <input
            type="datetime-local"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            style={{ width: "100%", padding: 10 }}
          />
        </div>

        <div style={{ width: "100%" }}>
          <label style={{ display: "block", marginBottom: 6 }}>
            Horizon (hours)
          </label>
          <input
            type="number"
            min={1}
            max={168}
            value={horizonHours}
            onChange={(e) => setHorizonHours(Number(e.target.value))}
            style={{ width: "100%", padding: 10 }}
          />
        </div>

        <div style={{ width: "100%" }}>
          <label style={{ display: "block", marginBottom: 6 }}>
            Frequency (min)
          </label>
          <input
            type="number"
            min={1}
            max={1440}
            value={freqMin}
            onChange={(e) => setFreqMin(Number(e.target.value))}
            style={{ width: "100%", padding: 10 }}
          />
        </div>

        <button
          onClick={fetchPredictions}
          disabled={loading}
          style={{
            padding: "10px 18px",
            alignSelf: "end",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Chargement..." : "Recharger"}
        </button>
      </div>

      {error && (
        <div
          style={{
            padding: 12,
            background: "#fee2e2",
            border: "1px solid #fecaca",
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginTop: 16,
        }}
      >
        <div style={{ width: "100%", maxWidth: 900 }}>
          {rows.length === 0 && !loading ? (
            <p>Aucune donnée à afficher.</p>
          ) : (
  <Line data={chartData} options={chartOptions} />
         )}
        </div>
      </div>
    </div>
  </div>

  );
}
