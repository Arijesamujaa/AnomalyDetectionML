import React, { useEffect, useState } from 'react';
import { Scatter, Line } from 'react-chartjs-2';
import 'chart.js/auto';
import './KMeansResultsDisplay.css';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const KMeansResultsDisplay = ({ fileId }) => {
    const [chartData, setChartData] = useState(null);
    const [error, setError] = useState('');
    const [xLabel, setXLabel] = useState('');
    const [yLabel, setYLabel] = useState('');
    const [numAnomalies, setNumAnomalies] = useState(0);
    const [anomalyIndices, setAnomalyIndices] = useState([]);
    const [threshold, setThreshold] = useState(0);
    const [anomalyPercentage, setAnomalyPercentage] = useState(0);
    const [avgAnomalyScore, setAvgAnomalyScore] = useState(0);
    const [maxAnomalyScore, setMaxAnomalyScore] = useState(0);
    const [minAnomalyScore, setMinAnomalyScore] = useState(0);
    const [dataFetched, setDataFetched] = useState(null);


    useEffect(() => {
        fetch(`/results/${fileId}?algorithm=K-Means`)
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    setError(data.error);
                    setChartData(null);
                } else {
                    setError('');
                    setXLabel(data.x_label);
                    setYLabel(data.y_label);
                    setNumAnomalies(data.num_anomalies);
                    setAnomalyIndices(data.anomaly_indices);
                    setThreshold(data.threshold);
                    setAnomalyPercentage(data.anomaly_percentage);
                    setAvgAnomalyScore(data.avg_anomaly_score);
                    setMaxAnomalyScore(data.max_anomaly_score);
                    setMinAnomalyScore(data.min_anomaly_score);
                    setDataFetched(data);


                    const clusterColors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];
                    const scatterData = {
                        datasets: Array.from(new Set(data.clusters)).map(cluster => ({
                            label: `Cluster ${cluster}`,
                            data: data.x_values
                                .map((x, index) => ({ x, y: data.y_values[index] }))
                                .filter((_, index) => data.clusters[index] === cluster),
                            backgroundColor: clusterColors[cluster % clusterColors.length],
                        })),
                    };
                    setChartData(scatterData);
                }
            })
            .catch(() => {
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
            pdf.save('KMeans_Results.pdf');
        });
    };

    if (error) {
        return <div>Error: {error}</div>;
    }

    const anomalyData = dataFetched ? {
        labels: Array.from({ length: dataFetched.x_values.length }, (_, i) => `Point ${i + 1}`),
        datasets: [
            // {
            //     label: 'Data Points',
            //     data: dataFetched.y_values,
            //     borderColor: 'blue',
            //     backgroundColor: 'rgba(0, 0, 255, 0.2)',
            //     fill: true,
            // },
            {
                label: 'Anomalies',
                data: dataFetched.y_values.map((value, index) => anomalyIndices.includes(index) ? value : null),
                backgroundColor: 'red',
                borderColor: 'red',
                pointRadius: 5,
                fill: false,
            },
        ],
    } : null;

    return (
        <div className="kmeans-results">
            <h3>K-Means Algorithm: Anomaly Detection Overview</h3>
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
                    {chartData ? (
                        <>
                            <div className="chart">
                                <Scatter
                                    data={chartData}
                                    options={{
                                        plugins: {
                                            title: {
                                                display: true,
                                                text: 'K-Means Clustering Results',
                                            },
                                        },
                                        scales: {
                                            x: { title: { display: true, text: xLabel } },
                                            y: { title: { display: true, text: yLabel } },
                                        },
                                    }}
                                />
                            </div>
                            {anomalyData && (
                                <div className="chart">
                                    <Line
                                        data={anomalyData}
                                        options={{
                                            plugins: {
                                                title: {
                                                    display: true,
                                                    text: 'Anomaly Data Points',
                                                },
                                            },
                                            scales: {
                                                x: { title: { display: true, text: 'Data Points' } },
                                                y: { title: { display: true, text: 'Values' } },
                                            },
                                        }}
                                    />
                                </div>
                            )}
                        </>
                    ) : (
                        <div>Loading charts...</div>
                    )}
                    <button onClick={saveAsPDF} className="saveAsPdf">Save charts as PDF</button>

                </div>
            </div>
        </div>
    );
};

export default KMeansResultsDisplay;
