import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

import { Report } from "@/services/reportsService";
import { mapTrash, getPieChartData, filterPrimaryCategory, getSecondaryChartData, IPrimaryWaste } from '@/lib/wasteCategorizationUtils';

import { Legend, Pie, PieChart, PieSectorShapeProps, Sector, Tooltip } from 'recharts';
import PieChartLegend from './PieChartLegend';
import { primaryWasteDisplayName, secondaryWasteDisplayName, trashValueChartMetaDetails } from '@/data/wasteCategories';
import "@/styles/trashpiechart.css";
import PrimaryCategoryList from './PrimaryCategoryList';

interface TrashPieChartProps {
    reports: Report[];
}


const MyCustomPie = (props: PieSectorShapeProps, nameKey: string, fill: string) => {
    return <Sector name={nameKey} {...props} fill={fill} />;
};


const TrashPieChart: React.FC<TrashPieChartProps> = ({ reports }) => {
    const navigate = useNavigate();

    const [primaryWasteData, setPrimaryWasteData] = useState<IPrimaryWaste[]>([]);
    const [clubbedData, setClubbedData] = useState({});
    const [selectedPrimaryCategory, setSelectedPrimaryCategory] = useState<string>(null);
    const [secondaryChartData, setSecondaryChartData] = useState([]);
    const [selectedSecondaryCategory, setSelectedSecondaryCategory] = useState<string>(null);
    const [trashValueChartData, setTrashValueChartData] = useState([]);

    function onSecondaryPieSectionClick(secondaryCategory: string) {
        setSelectedSecondaryCategory(secondaryCategory)
    }

    const resetTrashChart = useCallback(() => {
        setSelectedSecondaryCategory(null)
        setTrashValueChartData([])
    }, [])

    const resetEverything = useCallback(() => {
        setSecondaryChartData([])
        resetTrashChart()
    }, [resetTrashChart])

    const trashValuePieChart = useCallback(() => {
        const chartData = []
        Object.entries(clubbedData[selectedSecondaryCategory]).forEach((item) => {
            chartData.push({ name: item[0], value: item[1], display_name: trashValueChartMetaDetails[item[0]]?.display_name, fill: trashValueChartMetaDetails[item[0]]?.fill_color })
        })
        return chartData
    }, [clubbedData, selectedSecondaryCategory])

    const categorizeTrash = useCallback((): string[] => {
        try {
            if (reports.length === 0) {
                console.warn("No reports available to print trash items.");
                return [];
            }
            const mappedTrash = mapTrash(reports);
            const { primaryWasteData, clubbedData } = getPieChartData(mappedTrash);
            setPrimaryWasteData(Object.entries(primaryWasteData).map(([key, value]) => ({ name: key, value, display_name: primaryWasteDisplayName[key] })));
            setClubbedData(clubbedData);
        } catch (error) {
            console.error("Error categorizing trash items:", error);
        }
    }, [reports])

    useEffect(() => {
        if (selectedPrimaryCategory) {
            const secondaryData = filterPrimaryCategory(selectedPrimaryCategory, clubbedData);
            setSecondaryChartData(getSecondaryChartData(secondaryData));
            resetTrashChart()
        } else {
            resetEverything()
        }

    }, [selectedPrimaryCategory, clubbedData, resetEverything, resetTrashChart])

    useEffect(() => {
        if (selectedSecondaryCategory) {
            setTrashValueChartData(trashValuePieChart())
        }
    }, [selectedSecondaryCategory, trashValuePieChart])

    useEffect(() => {
        if (reports.length > 0)
            categorizeTrash()
    }, [reports, categorizeTrash])

    function onLegendClick(secondaryCategory: string) {
        // Map page merged into the dashboard; category-filter state is forwarded
        // for a future filtered-reports view (see docs/specs).
        navigate('/dashboard', { state: { secondaryCategoryFilter: secondaryCategory } });
    }


    function onPrimarySelectHandler(primaryCategory: string) {
        setSelectedPrimaryCategory(primaryCategory)
    }

    return (
        <div className="trash-pie-chart">
            <PrimaryCategoryList primaryWasteData={primaryWasteData} onSelect={onPrimarySelectHandler} selectedPrimaryCategory={selectedPrimaryCategory} />
            {
                (secondaryChartData.length === 0 && selectedPrimaryCategory) ?
                    <p className='text-center'>Trash details can be viewed once the trash is detected/categorized in the reports.</p>
                    : null
            }
            {
                (secondaryChartData.length > 0 && selectedPrimaryCategory) ?

                    <div className="pie-charts-container">
                        {/* TODO: IMPROVISE:  move both Piecharts to reusable pie chart component that gets chart data, heading, legend props */}
                        <div className='grid-item'>

                            <h1 className="text-xl font-bold py-4">{primaryWasteDisplayName[selectedPrimaryCategory]}</h1>
                            <PieChart
                                width={"100%"}
                                height={350}
                                responsive
                            >
                                <Pie
                                    style={{ cursor: "pointer" }}
                                    onClick={(e) => {
                                        onSecondaryPieSectionClick(e.payload.name)
                                    }}
                                    data={secondaryChartData}
                                    dataKey="value"
                                    nameKey="display_name"
                                    fill="fill"
                                    label
                                    isAnimationActive={true}
                                    shape={(props) => {
                                        return MyCustomPie(props, props.payload.name, props.payload.fill)
                                    }}
                                />
                                <Legend
                                    itemSorter="dataKey"
                                    content={(props) => {
                                        return <>
                                            <PieChartLegend onLegendClick={onLegendClick} legendItems={props.payload} />
                                            {
                                                props.payload && props.payload.length > 0 &&
                                                <span className='text-xs text-gray-600'>
                                                    Click on these markers to see related reports
                                                </span>
                                            }
                                        </>
                                    }}
                                />
                                <Tooltip />
                            </PieChart>

                        </div>
                        <div className='grid-item'>
                            {
                                trashValueChartData.length > 0 && selectedSecondaryCategory ?
                                    <div>
                                        <h1 className="text-xl font-bold py-4">{secondaryWasteDisplayName[selectedSecondaryCategory]}</h1>
                                        < PieChart
                                            width={"100%"}
                                            height={320}
                                            responsive
                                        >
                                            <Pie
                                                data={trashValueChartData}
                                                dataKey="value"
                                                nameKey="display_name"
                                                label
                                                isAnimationActive={true}
                                                shape={(props) =>
                                                    MyCustomPie(props, props.payload.name, props.payload.fill)
                                                }
                                            />
                                            <Legend itemSorter="dataKey" content={(props) =>
                                                <PieChartLegend legendItems={props.payload} />
                                            } />

                                            <Tooltip />
                                        </PieChart>
                                    </div> : null
                            }

                        </div>
                    </div>
                    : null
            }
        </div >
    );
};

export default TrashPieChart;
