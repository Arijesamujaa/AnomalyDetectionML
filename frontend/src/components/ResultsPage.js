import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import KMeansResultsDisplay from './KMeansResultsDisplay';
import IsolationForestResultsDisplay from './IsolationForestResultsDisplay';
import OneClassSVMResultsDisplay from './OneClassSVMResultsDisplay';

const ResultsPage = () => {
    const { fileId } = useParams();
    const [searchParams] = useSearchParams();
    const selectedAlgorithm = searchParams.get('algorithm');

    return (
        <div className="results-page">
            {selectedAlgorithm === 'K-Means' && <KMeansResultsDisplay fileId={fileId} />}
            {selectedAlgorithm === 'Isolation Forest' && <IsolationForestResultsDisplay fileId={fileId} />}
            {selectedAlgorithm === 'One-Class SVM' && <OneClassSVMResultsDisplay fileId={fileId} />}
        </div>
    );
};

export default ResultsPage;

