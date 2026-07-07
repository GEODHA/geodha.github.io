import React from 'react';
import { ReducedReport } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarRectangleItem } from 'recharts';
import { useNavigate } from 'react-router-dom';

interface ReportsBarChartProps {
    chartData: ReducedReport[];
}

const ReportsBarChart: React.FC<ReportsBarChartProps> = ({
    chartData
}) => {

    const navigate = useNavigate();

    function barClickHandler(bri: BarRectangleItem) {
        // Map page merged into the dashboard; date-filter state is forwarded
        // for a future filtered-reports view (see docs/specs).
        navigate('/dashboard', { state: { dateRangeSelected: bri["dateRange"] } });
    }

    return (
        <div className={`reports-bar-chart `}>
            <BarChart
                key={'bar-chart-1'}
                width={"90%"}
                height={300}
                data={chartData}
                responsive
                margin={{
                    top: 5,
                    right: 0,
                    left: 0,
                    bottom: 5,
                }}
            >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="displayDate" />
                <YAxis label={{ position: 'insideTopLeft', value: 'Number of reports', angle: -90, dy: 200 }} />
                <Tooltip />
                <Legend />
                <Bar style={{ cursor: "pointer" }} onClick={(bri: BarRectangleItem) => {
                    barClickHandler(bri)
                }} name="Resolved" dataKey="numberOfReports.resolved" stackId="a" maxBarSize={40} fill="#82ca1f" />
                <Bar style={{ cursor: "pointer" }} onClick={(bri: BarRectangleItem) => {
                    barClickHandler(bri)
                }} name="Pending" dataKey="numberOfReports.pending" stackId="a" maxBarSize={40} fill="#d87070" />
            </BarChart>
        </div>
    );
};

export default ReportsBarChart;