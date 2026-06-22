import { useMemo } from "react";
import { Doughnut } from "react-chartjs-2";
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
} from "chart.js";
import HelperFunctions from "../../../../utils/HelperFunctions";

ChartJS.register(ArcElement, Tooltip, Legend);

/**
 * Donut / Doughnut chart untuk "Cash In/Out per Kategori".
 * Komponen ini murni presentational — data & warna dikirim dari parent.
 *
 * @param {Array<{label:string, value:number}>} data
 * @param {string[]} [colors]   warna tiap slice (urut mengikuti data)
 * @param {boolean}  [currency] format tooltip sebagai Rupiah
 * @param {string}   [emptyText]
 */
const DEFAULT_COLORS = ["#0079d3", "#f9a220", "#00c951", "#fb2c36", "#7cc8fd", "#62748e"];

const DonutChart = ({
    data = [],
    colors = DEFAULT_COLORS,
    currency = true,
    emptyText = "Belum ada data",
}) => {
    const total = useMemo(
        () => data.reduce((acc, item) => acc + (Number(item.value) || 0), 0),
        [data]
    );

    const chartData = useMemo(
        () => ({
            labels: data.map((d) => d.label),
            datasets: [
                {
                    data: data.map((d) => d.value),
                    backgroundColor: data.map((_, i) => colors[i % colors.length]),
                    borderColor: "#ffffff",
                    borderWidth: 2,
                    hoverOffset: 6,
                },
            ],
        }),
        [data, colors]
    );

    const options = useMemo(
        () => ({
            responsive: true,
            maintainAspectRatio: false,
            cutout: "65%",
            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        usePointStyle: true,
                        pointStyle: "circle",
                        padding: 16,
                        boxWidth: 8,
                        boxHeight: 8,
                        font: { size: 12, family: "Plus Jakarta Sans" },
                        color: "#45556c",
                    },
                },
                tooltip: {
                    backgroundColor: "#0f172b",
                    padding: 10,
                    cornerRadius: 8,
                    titleFont: { family: "Plus Jakarta Sans" },
                    bodyFont: { family: "Plus Jakarta Sans" },
                    callbacks: {
                        label: (ctx) => {
                            const value = ctx.parsed || 0;
                            const pct = total ? ((value / total) * 100).toFixed(1) : 0;
                            const formatted = currency
                                ? HelperFunctions.formatCurrency(value)
                                : value.toLocaleString("id-ID");
                            return ` ${ctx.label}: ${formatted} (${pct}%)`;
                        },
                    },
                },
            },
        }),
        [total, currency]
    );

    if (!data.length || total === 0) {
        return (
            <div className="flex h-[280px] items-center justify-center text-sm text-gray-400">
                {emptyText}
            </div>
        );
    }

    return (
        <div className="relative h-[280px] w-full">
            <Doughnut data={chartData} options={options} />
        </div>
    );
};

export default DonutChart;
