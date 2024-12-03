import React, { useEffect, useState } from 'react';
import { Bar, Scatter } from 'react-chartjs-2';
import 'chart.js/auto';
import './OneClassSVMResultsDisplay.css'; 
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const OneClassSVMResultsDisplay = ({ fileId }) => {
    const [barChartData, setBarChartData] = useState(null);
    const [scatterChartData, setScatterChartData] = useState(null); 
    const [error, setError] = useState('');
    const [numAnomalies, setNumAnomalies] = useState(0);
    const [anomalyIndices, setAnomalyIndices] = useState([]);
    const [threshold, setThreshold] = useState(0);
    const [anomalyPercentage, setAnomalyPercentage] = useState(0);
    const [avgAnomalyScore, setAvgAnomalyScore] = useState(0);
    const [maxAnomalyScore, setMaxAnomalyScore] = useState(0);
    const [minAnomalyScore, setMinAnomalyScore] = useState(0);

    useEffect(() => {
        fetch(`/results/${fileId}?algorithm=One-Class SVM`)
            .then(response => response.json())
            .then(data => {
                console.log(data); 
                if (data.error) {
                    setError(data.error);
                    setBarChartData(null);
                    setScatterChartData(null);
                } else {
                    setError('');
                    setNumAnomalies(data.num_anomalies);
                    setAnomalyIndices(data.anomaly_indices);
                    setThreshold(data.threshold);
                    setAnomalyPercentage(data.anomaly_percentage);
                    setAvgAnomalyScore(data.avg_anomaly_score);
                    setMaxAnomalyScore(data.max_anomaly_score);
                    setMinAnomalyScore(data.min_anomaly_score);

            
                    const normalScores = data.previous_chart_data.normal_scores || [];
                    const anomalousScores = data.previous_chart_data.anomalous_scores || [];

                    const barChartData = {
                        labels: normalScores.map((_, index) => `Normal Sample ${index + 1}`).concat(anomalousScores.map((_, index) => `Anomaly ${index + 1}`)), // Set labels based on sample index
                        datasets: [
                            {
                                label: 'Normal Scores',
                                data: normalScores,
                                backgroundColor: 'lightgreen',
                            },
                            {
                                label: 'Anomalous Scores',
                                data: anomalousScores,
                                backgroundColor: 'orange',
                            },
                        ],
                    };
                    setBarChartData(barChartData);

                    const actualConsumptionUnits = data.scatter_chart_data.actual || [];
                    const predictedConsumptionUnits = data.scatter_chart_data.predicted || [];

                    const scatterChartData = {
                        labels: actualConsumptionUnits.map((_, index) => `Sample ${index + 1}`), 
                        datasets: [
                            {
                                label: 'Actual Consumption',
                                data: actualConsumptionUnits.map((value, index) => ({ x: index + 1, y: value })),
                                backgroundColor: 'blue',
                                pointRadius: 5,
                            },
                            {
                                label: 'Predicted Consumption',
                                data: predictedConsumptionUnits.map((value, index) => ({ x: index + 1, y: value })),
                                backgroundColor: 'red',
                                pointRadius: 7,
                            },
                        ],
                    };
                    setScatterChartData(scatterChartData);
                }
            })
            .catch(err => {
                setError('Failed to fetch results.');
                setBarChartData(null);
                setScatterChartData(null);
            });
    }, [fileId]);

    const saveAsPDF = () => {
        const chartsContainer = document.querySelector('.charts-container');
        html2canvas(chartsContainer).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('landscape');
            pdf.addImage(imgData, 'PNG', 10, 10, 200, 180); 
            pdf.save('OneClassSVM_Results.pdf');
        });
    };

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div className="one-class-svm-results">
            <h3>One-Class SVM: Anomaly Detection Overview</h3>
            <div className="content-container">
                <div className="statistics">
                    <h4>Statistics:</h4>
                    <p className="statistics-label">
                        Number of anomalies: <span className="statistics-value">{numAnomalies}</span>
                    </p>
                    <p className="statistics-label">
                        Anomaly Percentage: <span className="statistics-value">{anomalyPercentage.toFixed(2)}%</span>
                    </p>
                    <p className="statistics-label">
                        Average Anomaly Score: <span className="statistics-value">{avgAnomalyScore.toFixed(4)}</span>
                    </p>
                    <p className="statistics-label">
                        Max Anomaly Score: <span className="statistics-value">{maxAnomalyScore.toFixed(4)}</span>
                    </p>
                    <p className="statistics-label">
                        Min Anomaly Score: <span className="statistics-value">{minAnomalyScore.toFixed(4)}</span>
                    </p>
                    <div className="anomaly-indexes">
                        <div className="scrollable-indexes">
                            <p className="statistics-label">Indexes of anomalies:</p>
                            <p className="statistics-value">{anomalyIndices.join(', ')}</p>
                        </div>
                    </div>
                </div>
                <div className="charts-container">
                    {barChartData ? (
                        <div className="chart">
                            <Bar
                                data={barChartData}
                                options={{
                                    plugins: {
                                        title: {
                                            display: true,
                                            text: 'One-Class SVM Anomaly Scores',
                                        },
                                        tooltip: {
                                            callbacks: {
                                                label: function (tooltipItem) {
                                                    return `Score: ${tooltipItem.raw}`;
                                                },
                                            },
                                        },
                                    },
                                    scales: {
                                        x: {
                                            title: {
                                                display: true,
                                                text: 'Samples',
                                            },
                                        },
                                        y: {
                                            title: {
                                                display: true,
                                                text: 'Anomaly Score',
                                            },
                                            beginAtZero: true,
                                        },
                                    },
                                }}
                            />
                        </div>
                    ) : (
                        <div>Loading bar chart...</div>
                    )}
                    {scatterChartData ? (
                        <div className="chart">
                            <Scatter
                                data={scatterChartData}
                                options={{
                                    plugins: {
                                        title: {
                                            display: true,
                                            text: 'Scatter Chart',
                                        },
                                        tooltip: {
                                            callbacks: {
                                                label: function (tooltipItem) {
                                                    return `Value: ${tooltipItem.raw.y}`;
                                                },
                                            },
                                        },
                                    },
                                    scales: {
                                        x: {
                                            title: {
                                                display: true,
                                                text: 'Sample Index',
                                            },
                                        },
                                        y: {
                                            title: {
                                                display: true,
                                                text: 'Consumption Value',
                                            },
                                            beginAtZero: true,
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

export default OneClassSVMResultsDisplay;


