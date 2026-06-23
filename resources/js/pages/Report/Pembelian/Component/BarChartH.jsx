import { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip,
    Legend,
} from "chart.js";
import HelperFunctions from "../../../../utils/HelperFunctions";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

/**
 * Horizontal bar chart untuk distribusi (per kategori / karat / sub kategori).
 * Presentational — data dikirim dari parent.
 *
 * @param {Array<{label:string, value:number}>} data
 * @param {string}  [color]      warna bar (single series)
 * @param {number}  [height]
 * @param {boolean} [currency]   format tooltip & sumbu sebagai Rupiah
 * @param {string}  [unit]       suffix nilai saat bukan currency (mis. "gr")
 * @param {string}  [emptyText]
 */
const BarChartH = ({
    data = [],
    color = "#0c93eb",
    height = 220,
    currency = true,
    unit = "",
    emptyText = "Belum ada data",
}) => {
    const chartData = useMemo(
        () => ({
            labels: data.map((d) => d.label),
            datasets: [
                {
                    data: data.map((d) => d.value),
                    backgroundColor: data.map((_, i) =>
                        adjustAlpha(color, 1 - i * 0.12)
                    ),
                    borderRadius: 6,
                    borderSkipped: false,
                    barThickness: 16,
                    maxBarThickness: 18,
                },
            ],
        }),
        [data, color]
    );

    const formatValue = (val) =>
        currency
            ? HelperFunctions.formatCurrency(val)
            : `${Number(val).toLocaleString("id-ID")}${unit ? ` ${unit}` : ""}`;

    const options = useMemo(
        () => ({
            indexAxis: "y",
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: "#0f172b",
                    padding: 10,
                    cornerRadius: 8,
                    titleFont: { family: "Plus Jakarta Sans" },
                    bodyFont: { family: "Plus Jakarta Sans" },
                    callbacks: {
                        label: (ctx) => ` ${formatValue(ctx.parsed.x)}`,
                    },
                },
            },
            scales: {
                x: {
                    beginAtZero: true,
                    grid: { color: "#f1f5f9", drawBorder: false },
                    border: { display: false },
                    ticks: {
                        color: "#90a1b9",
                        font: { size: 11, family: "Plus Jakarta Sans" },
                        callback: (val) =>
                            currency
                                ? `Rp${(val / 1_000_000).toLocaleString("id-ID")} Jt`
                                : Number(val).toLocaleString("id-ID"),
                    },
                },
                y: {
                    grid: { display: false, drawBorder: false },
                    border: { display: false },
                    ticks: {
                        color: "#45556c",
                        font: { size: 12, family: "Plus Jakarta Sans" },
                    },
                },
            },
        }),
        [currency, unit]
    );

    if (!data.length) {
        return (
            <div
                className="flex items-center justify-center text-sm text-gray-400"
                style={{ height }}
            >
                {emptyText}
            </div>
        );
    }

    return (
        <div className="w-full" style={{ height }}>
            <Bar data={chartData} options={options} />
        </div>
    );
};

/** Terapkan alpha ke warna hex (#rrggbb) → rgba(). */
function adjustAlpha(hex, alpha) {
    const a = Math.max(0.25, Math.min(1, alpha));
    const clean = hex.replace("#", "");
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export default BarChartH;
