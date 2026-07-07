// ChartsPanel (formerly pages/Dashboard.tsx) — reports bar/pie charts panel.
// Currently DORMANT: only referenced from commented-out code in Hero.tsx.
// Kept for a future filtered-reports/charts view (see docs/ROADMAP.md §1a).
import React, { useEffect } from 'react';
import { Report } from "@/services/reportsService";
import { getChartDataFromReports, getFilteredReportsWithCustomDateRange, getReportsByYear, ReducedReport } from '@/lib/utils';
import '@/styles/dashboard.css';
import ReportsBarChart from '@/components/ReportsBarChart';
import TrashPieChart from '@/components/TrashPieChart';

interface ChartsPanelProps {
    reports: Report[];
    allowCustomDateRange?: boolean;// turn it off if the parent component doesn't want to allow custom date range selection i.e - on landing page
}

const options = {
    all: null,
    pastYear: new Date().getFullYear() - 1,
    currentYear: new Date().getFullYear(),
}

const ChartsPanel: React.FC<ChartsPanelProps> = ({ reports, allowCustomDateRange=false }) => {
    const [chartData, setChartData] = React.useState<ReducedReport[]>([]);

    const [yearRange, setYearRange] = React.useState<string>("all");
    const [dateRange, setDateRange] = React.useState<string[]>(["", ""]);

    useEffect(() => {
        if (reports.length === 0) return;
        if (yearRange === "custom" && dateRange[0] !== "" && dateRange[1] !== "") {
            const startDate = new Date(dateRange[0]);
            const endDate = new Date(dateRange[1]);
            const filteredReports = getFilteredReportsWithCustomDateRange(reports, startDate, endDate);
            const chartData = getChartDataFromReports(filteredReports);
            setChartData(chartData);
        } else {
            const filteredReports = getReportsByYear(reports, options[yearRange]);
            const chartData = getChartDataFromReports(filteredReports);
            setChartData(chartData);
        }

    }, [reports, yearRange, dateRange]);

    function dropDownHandler(value: string) {
        if (value !== "custom") {
            // Reset start and end dates when not in custom mode
            setDateRange(["", ""]);
        }
        setYearRange(value);
    }

    return (
        <div>
            <h1 className="text-3xl font-bold py-4">Dashboard</h1>

            <section className='reports-daterange-picker'>
                {
                    allowCustomDateRange ?
                        <div><select
                            id="dashboard-range-select"
                            className='dashboard-select'
                            value={yearRange}
                            onChange={(e) => {
                                const v = (e.target as HTMLSelectElement).value;
                                dropDownHandler(v);
                            }}
                        >
                            <option value={"all"}>All reports</option>
                            <option value={"pastYear"}>Past year reports</option>
                            <option value={"currentYear"}>Current year reports</option>
                            <option value={"custom"}>Custom date range</option>
                        </select></div> : null

                }
                {allowCustomDateRange && yearRange === 'custom' && (
                    <>
                        {/* TODO: Handle error in the component if start date is after than end date or if end date is before start date */}
                        <input
                            className='dashboard-select'
                            type="date"
                            id="start-date"
                            // error={dateRange[0] !== "" && dateRange[1] !== "" && new Date(dateRange[0]) > new Date(dateRange[1])}
                            onChange={(e) => {
                                setDateRange([e.target.value, dateRange[1]]);
                            }}
                        />
                        <input
                            className='dashboard-select'
                            type="date"
                            id="end-date"
                            // error={dateRange[0] !== "" && dateRange[1] !== "" && new Date(dateRange[0]) > new Date(dateRange[1])}
                            onChange={(e) => {
                                setDateRange([dateRange[0], e.target.value]);
                            }}

                        />
                    </>
                )}
            </section>
            <section>
                <h1 className="text-2xl font-bold py-4">Reports Summary</h1>
                {
                    chartData.length > 0 ?
                        <ReportsBarChart chartData={chartData} /> :
                        <h1 className="text-3xl font-bold px-4 py-4">No reports available to display.</h1>
                }
            </section>
            <section>
                <h1 className="text-2xl font-bold py-4">Trash Details</h1>
                <TrashPieChart reports={reports} />
            </section>
        </div>
    );
};


export default ChartsPanel;
