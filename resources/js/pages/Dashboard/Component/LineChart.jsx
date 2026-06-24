import { useMemo } from "react";
import { Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend,
    Filler,
} from "chart.js";
import HelperFunctions from "../../../utils/HelperFunctions";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

/**
 * Line chart untuk "Tren Penjualan" (omzet harian).
 * Presentational — data dikirim dari parent.
 *
 * @param {Array<{label:string, value:number}>} data
 * @param {string} [color]
 * @param {number} [height]
 * @param {string} [emptyText]
 */
const LineChart = ({
    data = [],
    color = "#0c93eb",
    height = 320,
    emptyText = "Belum ada data",
}) => {
    const chartData = useMemo(
        () => ({
            labels: data.map((d) => d.label),
            datasets: [
                {
                    data: data.map((d) => d.value),
                    borderColor: color,
                    backgroundColor: "rgba(12, 147, 235, 0.08)",
                    borderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: color,
                    pointBorderColor: "#ffffff",
                    pointBorderWidth: 2,
                    tension: 0.35,
                    fill: true,
                },
            ],
        }),
        [data, color]
    );

    const options = useMemo(
        () => ({
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
                        label: (ctx) => ` ${HelperFunctions.formatCurrency(ctx.parsed.y)}`,
                    },
                },
            },
            scales: {
                x: {
                    grid: { display: false, drawBorder: false },
                    border: { display: false },
                    ticks: {
                        color: "#90a1b9",
                        font: { size: 11, family: "Plus Jakarta Sans" },
                    },
                },
                y: {
                    beginAtZero: true,
                    grid: { color: "#f1f5f9", drawBorder: false },
                    border: { display: false },
                    ticks: {
                        color: "#90a1b9",
                        font: { size: 11, family: "Plus Jakarta Sans" },
                        callback: (val) => `${(val / 1_000_000).toLocaleString("id-ID")} jt`,
                    },
                },
            },
        }),
        []
    );

    if (!data.length) {
        return (
            <div className="flex items-center justify-center text-sm text-gray-400" style={{ height }}>
                {emptyText}
            </div>
        );
    }

    return (
        <div className="w-full" style={{ height }}>
            <Line data={chartData} options={options} />
        </div>
    );
};

export default LineChart;
