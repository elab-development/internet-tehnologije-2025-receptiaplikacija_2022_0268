"use client";

import { useEffect, useMemo, useState } from "react";
import { Chart } from "react-google-charts";

type Item = { categoryName: string; count: number };

export default function StatsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  (async () => {
    try {
      const res = await fetch("/api/stats/recipes-by-category");
      const json = await res.json();
      setItems(json.data ?? []);
    } catch (e) {
      console.error(e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  })();
}, []);

  const chartData = useMemo(() => {
    const rows = items.map((i) => [i.categoryName, i.count]);
    return [["Kategorija", "Broj recepata"], ...rows];
  }, [items]);

  if (loading) return <div className="p-6">Učitavanje statistike...</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Statistika: recepti po kategorijama</h1>

      <div className="rounded-xl border p-4">
        <Chart
          chartType="PieChart"
          data={chartData}
          width="100%"
          height="420px"
          options={{
            pieHole: 0.35,
            legend: { position: "right" },
            chartArea: { width: "90%", height: "85%" },
          }}
        />
      </div>
    </div>
  );
}