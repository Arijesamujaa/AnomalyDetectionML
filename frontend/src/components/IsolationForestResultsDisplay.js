import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import 'chart.js/auto';
import './IsolationForestResultsDisplay.css'; 
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const IsolationForestResultsDisplay = ({ fileId }) => {
    const [chartData, setChartData] = useState(null);
    const [scatterChartData, setScatterChartData] = useState(null);
    const [error, setError] = useState('');
    const [numAnomalies, setNumAnomalies] = useState(0);
    const [anomalyIndices, setAnomalyIndices] = useState([]);
    const [threshold, setThreshold] = useState(null);
    const [anomalyPercentage, setAnomalyPercentage] = useState(0);
    const [avgAnomalyScore, setAvgAnomalyScore] = useState(0);
    const [maxAnomalyScore, setMaxAnomalyScore] = useState(0);
    const [minAnomalyScore, setMinAnomalyScore] = useState(0);


    useEffect(() => {
        fetch(`/results/${fileId}?algorithm=Isolation Forest`)
            .then(response => response.json())
            .then(data => {
                console.log(data); 
                if (data.error) {
                    setError(data.error);
                    setChartData(null);
                } else {
                    setError('');
                    setNumAnomalies(data.num_anomalies);
                    setAnomalyIndices(data.anomaly_indices);
                    setThreshold(data.threshold);
                    setAnomalyPercentage(data.anomaly_percentage);
                    setAvgAnomalyScore(data.avg_anomaly_score);
                    setMaxAnomalyScore(data.max_anomaly_score);
                    setMinAnomalyScore(data.min_anomaly_score);

                    const normalScores = data.chart_data.normal_scores;
                    const anomalousScores = data.chart_data.anomalous_scores;

                    const barChartData = {
                        labels: ['Anomaly score'],
                        datasets: [
                            {
                                label: 'Normal Samples',
                                data: normalScores,
                                backgroundColor: 'lightgreen',
                            },
                            {
                                label: 'Anomalous Samples',
                                data: anomalousScores,
                                backgroundColor: 'orange',
                            },
                        ],
                    };
                    setChartData(barChartData);

                    const { instances, anomalous_scores, anomalous_indices } = data.chart_data_anomaly;
                    const scatterChartData = {
                        labels: instances,
                        datasets: [
                            {
                                label: 'Anomalous Samples',
                                data: anomalous_indices.map((index, i) => ({
                                    x: instances[index],
                                    y: anomalous_scores[i],
                                })),
                                backgroundColor: 'red',
                                pointRadius: 4,
                            },
                        ],
                    };
                    setScatterChartData(scatterChartData);
                }
            })
            .catch(err => {
                setError('Failed to fetch results.');
                setChartData(null);
            });
    }, [fileId]);

    const saveAsPDF = () => {
        const chartsContainer = document.querySelector('.charts-container');
        html2canvas(chartsContainer).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('landscape');
            pdf.addImage(imgData, 'PNG', 10, 10, 200, 180); 
            pdf.save('IsolationForest_Results.pdf');
        });
    };

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div className="isolation-forest-results">
            <h3>Isolation Forest: Anomaly Detection Overview</h3>
            <div className="content-container">
                <div className="statistics">
                    <h4>Statistics:</h4>
                    <p className="statistics-label">
                        Number of anomalies: <span className="statistics-value">{numAnomalies}</span>
                    </p>
                    <p className="statistics-label">
                        Anomaly percentage: <span className="statistics-value">{anomalyPercentage.toFixed(2)}%</span>
                    </p>
                    <p className="statistics-label">
                        Average anomaly score: <span className="statistics-value">{avgAnomalyScore.toFixed(4)}</span>
                    </p>
                    <p className="statistics-label">
                        Max anomaly score: <span className="statistics-value">{maxAnomalyScore.toFixed(4)}</span>
                    </p>
                    <p className="statistics-label">
                        Min anomaly score: <span className="statistics-value">{minAnomalyScore.toFixed(4)}</span>
                    </p>
                    <div className="anomaly-indexes">
                        <div className="scrollable-indexes">
                            <p className="statistics-label">Indexes of anomalies:</p>
                            <p className="statistics-value">{anomalyIndices.join(', ')}</p>
                        </div>
                    </div>
                </div>
                <div className="charts-container">
                    {chartData ? (
                        <div className="chart">
                            <Bar
                                data={chartData}
                                options={{
                                    plugins: {
                                        title: {
                                            display: true,
                                            text: 'Isolation Forest Anomaly Scores',
                                        },
                                    },
                                    scales: {
                                        x: {
                                            title: {
                                                display: true,
                                                text: 'Anomaly Score',
                                            },
                                        },
                                        y: {
                                            title: {
                                                display: true,
                                                text: 'Sample Count',
                                            },
                                        },
                                    },
                                }}
                            />
                        </div>
                    ) : (
                        <div>Loading...</div>
                    )}

                    {scatterChartData ? (
                        <div className="chart">
                            <Bar
                                type="scatter"
                                data={scatterChartData}
                                options={{
                                    plugins: {
                                        title: {
                                            display: true,
                                            text: 'Anomaly Scatter Plot',
                                        },
                                    },
                                    scales: {
                                        x: {
                                            title: {
                                                display: true,
                                                text: 'Instance Index',
                                            },
                                        },
                                        y: {
                                            title: {
                                                display: true,
                                                text: 'Anomaly Score',
                                            },
                                        },
                                    },
                                }}
                            />
                        </div>
                    ) : (
                        <div>Loading scatter chart...</div>
                    )}

                    <button onClick={saveAsPDF} className="saveAsPdf">Save charts as PDF</button>
                </div>
            </div>
        </div>
    );
};

export default IsolationForestResultsDisplay;
