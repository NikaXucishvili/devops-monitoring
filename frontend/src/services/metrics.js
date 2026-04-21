const PROMETHEUS_URL = "http://localhost:9090/api/v1/query";

export async function queryMetric(promql) {
  const res = await fetch(`${PROMETHEUS_URL}?query=${encodeURIComponent(promql)}`);
  const data = await res.json();
  return data.data.result;
}