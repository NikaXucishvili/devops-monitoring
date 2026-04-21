const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());

// Prometheus inside docker network
const PROM_URL = "http://prometheus:9090";

let alertHistory = [];

/* -------------------------------
   PROMETHEUS QUERY
--------------------------------*/
async function query(q) {
  try {
    const res = await axios.get(`${PROM_URL}/api/v1/query`, {
      params: { query: q },
    });

    return parseFloat(
      res.data?.data?.result?.[0]?.value?.[1] || 0
    );
  } catch (err) {
    console.log("Prometheus query error:", err.message);
    return 0;
  }
}

/* -------------------------------
   ALERTS + METRICS
--------------------------------*/
app.get("/alerts", async (req, res) => {
  try {
    // CPU (%)
    const cpu = await query(`
      100 - (
        avg(rate(node_cpu_seconds_total{mode="idle"}[1m])) * 100
      )
    `);

    // RAM (%)
    const ram = await query(`
      (1 - (
        node_memory_MemAvailable_bytes /
        node_memory_MemTotal_bytes
      )) * 100
    `);

    // DISK (%)
    const disk = await query(`
      100 * (
        1 - (
          sum(node_filesystem_avail_bytes{fstype!~"tmpfs|overlay"}) /
          sum(node_filesystem_size_bytes{fstype!~"tmpfs|overlay"})
        )
      )
    `);

    // NETWORK IN (bytes/sec)
    const netIn = await query(`
      rate(node_network_receive_bytes_total[1m])
    `);

    // NETWORK OUT (bytes/sec)
    const netOut = await query(`
      rate(node_network_transmit_bytes_total[1m])
    `);

    // Jenkins UP/DOWN
    const jenkins = await query(`up{job="jenkins"}`);

    const alerts = [];

    // CPU alerts
    if (cpu > 80) alerts.push({ type: "CRITICAL", metric: "CPU", value: cpu });
    else if (cpu > 60) alerts.push({ type: "WARNING", metric: "CPU", value: cpu });

    // RAM alerts
    if (ram > 85) alerts.push({ type: "CRITICAL", metric: "RAM", value: ram });
    else if (ram > 70) alerts.push({ type: "WARNING", metric: "RAM", value: ram });

    // DISK alerts
    if (disk > 90) alerts.push({ type: "CRITICAL", metric: "DISK", value: disk });
    else if (disk > 80) alerts.push({ type: "WARNING", metric: "DISK", value: disk });

    const snapshot = {
      time: new Date().toLocaleTimeString(),

      // system metrics
      cpu: Number(cpu.toFixed(2)),
      ram: Number(ram.toFixed(2)),
      disk: Number(disk.toFixed(2)),

      // network metrics (your frontend uses this)
      network: {
        rx_bytes_per_sec: Number(netIn.toFixed(2)),
        tx_bytes_per_sec: Number(netOut.toFixed(2)),
      },

      // service status
      jenkins: jenkins === 1 ? "online" : "offline",

      alerts,
    };

    alertHistory.push(snapshot);
    alertHistory = alertHistory.slice(-20);

    res.json(snapshot);
  } catch (err) {
    console.log("Backend error:", err.message);
    res.status(500).json({ error: "Backend failed" });
  }
});

/* -------------------------------
   HISTORY
--------------------------------*/
app.get("/history", (req, res) => {
  res.json(alertHistory);
});

/* -------------------------------
   HEALTH
--------------------------------*/
app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

/* -------------------------------
   START
--------------------------------*/
app.listen(3001, () => {
  console.log("Backend running on http://localhost:3001");
});
