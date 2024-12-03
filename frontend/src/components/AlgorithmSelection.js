import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './AlgorithmSelection.css';

const AlgorithmSelection = () => {
    const navigate = useNavigate();
    const { fileId } = useParams();

    const algorithms = [
        {
            name: 'K-Means',
            icon: '🔍',
            description: 'A clustering algorithm that groups data into k clusters.'
        },
        {
            name: 'Isolation Forest',
            icon: '🌲',
            description: 'An algorithm that detects anomalies using an isolation-based approach.'
        },
        {
            name: 'One-Class SVM',
            icon: '🧠',
            description: 'A classification algorithm designed for anomaly detection in datasets.'
        }
    ];


    const handleSelection = (algorithm) => {
        navigate(`/results/${fileId}?algorithm=${algorithm}`);
    };

    return (
        <div className="algorithm-selection-container">
            <div className="algorithm-selection-box">
                <h2>Choose Anomaly Detection Algorithm</h2>
                <div className="algorithm-cards">
                    {algorithms.map((algo) => (
                        <button
                            key={algo.name}
                            className="algorithm-card"
                            onClick={() => handleSelection(algo.name)}
                        >
                            <span className="algorithm-icon">{algo.icon}</span>
                            <span className="algorithm-name">{algo.name}</span>
                            <p className="algorithm-description">{algo.description}</p>
                        </button>
                    ))}
                </div>

            </div>
        </div>
    );
};

export default AlgorithmSelection;

