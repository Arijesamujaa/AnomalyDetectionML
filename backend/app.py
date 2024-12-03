from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.cluster import KMeans
from sklearn.svm import OneClassSVM
from sklearn.metrics import pairwise_distances_argmin_min
import numpy as np
from sklearn.preprocessing import RobustScaler
from sklearn.model_selection import train_test_split

app = Flask(__name__)
CORS(app)  

UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part in the request'}), 400
    file = request.files['file']

    if file.filename == '':
        return jsonify({'error': 'No file selected for uploading'}), 400

    try:
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
        file.save(file_path)

        if file.filename.endswith('.csv'):
            data = pd.read_csv(file_path)
        elif file.filename.endswith('.xlsx'):
            data = pd.read_excel(file_path)
        else:
            return jsonify({'error': 'Invalid file format. Only CSV and Excel are supported.'}), 400

        if data.isnull().any().any():
            os.remove(file_path)  
            return jsonify({
                'error': 'The dataset contains NaN values. Please clean your data before uploading.'
            }), 400

        return jsonify({'message': 'File uploaded successfully', 'filename': file.filename}), 200
    except Exception as e:
        return jsonify({'error': f'Failed to upload file: {str(e)}'}), 500

@app.route('/results/<file_id>', methods=['GET'])
def analyze_file(file_id):
    app.logger.info(f"Received request for file ID: {file_id}")
    algorithm = request.args.get('algorithm', 'K-Means')
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], file_id)

    if not os.path.isfile(file_path):
        app.logger.error(f"File {file_id} not found at path: {file_path}")
        return jsonify({"error": "File not found"}), 404

    try:
        if file_path.endswith('.csv'):
            data = pd.read_csv(file_path, index_col=0)
        elif file_path.endswith('.xls') or file_path.endswith('.xlsx'):
            data = pd.read_excel(file_path, index_col=0)
        else:
            raise ValueError("Unsupported file format. Please upload a CSV or Excel file.")

        app.logger.info("File loaded successfully.")
        
        if data.isnull().any().any():
            raise ValueError("Dataset contains NaN values. Please clean your data.")
        app.logger.info(f"Data shape: {data.shape}")
    except Exception as e:
        app.logger.error(f"Failed to read the file: {str(e)}")
        return jsonify({"error": f"Failed to read the file: {str(e)}"}), 500

    try:
        app.logger.info(f"Starting anomaly detection using {algorithm} algorithm.")
        results = detect_anomalies(data, algorithm)
        app.logger.info("Anomaly detection completed successfully.")
    except Exception as e:
        app.logger.error(f"Anomaly detection failed: {str(e)}")
        return jsonify({"error": f"Anomaly detection failed: {str(e)}"}), 500

    return jsonify(results), 200

def detect_anomalies(data, algorithm):
    numeric_data = data.select_dtypes(include=['number']).apply(pd.to_numeric, errors='coerce').dropna()
    
    if numeric_data.empty:
        raise ValueError("The dataset must contain at least one numeric column for anomaly detection.")

    train_data, test_data = train_test_split(numeric_data, test_size=0.7, random_state=42)

    if algorithm == 'K-Means':
        return kmeans_anomaly_detection(train_data, test_data)
    elif algorithm == 'Isolation Forest':
        return isolation_forest_anomaly_detection(train_data, test_data)
    elif algorithm == 'One-Class SVM':
        return one_class_svm_anomaly_detection(train_data, test_data)
    else:
        raise ValueError("Invalid algorithm specified.")

def determine_optimal_clusters(data, max_clusters=10):
    wcss = []
    for i in range(1, max_clusters + 1):
        kmeans = KMeans(n_clusters=i, random_state=42)
        kmeans.fit(data)
        wcss.append(kmeans.inertia_)  
    
    kneedle = np.diff(np.diff(wcss)).argmax() + 2
    return kneedle

def kmeans_anomaly_detection(train_data, test_data):
    n_clusters = determine_optimal_clusters(train_data)
    
    kmeans = KMeans(n_clusters=n_clusters, random_state=42)
    kmeans.fit(train_data)

    clusters = kmeans.predict(test_data)
    distances = pairwise_distances_argmin_min(test_data, kmeans.cluster_centers_)[1]
    
    q1 = np.percentile(distances, 25)
    q3 = np.percentile(distances, 75)
    iqr = q3 - q1
    threshold = q3 + 1.5 * iqr
    anomalies = distances > threshold 

    anomaly_indices = test_data.index[anomalies].tolist()

    num_anomalies = len(anomaly_indices)
    anomaly_scores = distances[anomalies]
    avg_anomaly_score = np.mean(anomaly_scores) if num_anomalies > 0 else 0
    max_anomaly_score = np.max(anomaly_scores) if num_anomalies > 0 else 0
    min_anomaly_score = np.min(anomaly_scores) if num_anomalies > 0 else 0
    anomaly_percentage = (num_anomalies / len(test_data)) * 100
    
    anomalies_per_cluster = {i: 0 for i in range(n_clusters)}
    for idx in anomaly_indices:
        pos_idx = test_data.index.get_loc(idx) 
        anomalies_per_cluster[clusters[pos_idx]] += 1
    
    anomaly_density_per_feature = {}
    for col in test_data.columns:
        feature_anomalies = test_data[col].iloc[test_data.index.get_indexer(anomaly_indices)]
        anomaly_density_per_feature[col] = len(feature_anomalies) / len(test_data)


    response = {
        'x_values': test_data.iloc[:, 0].tolist(),
        'y_values': test_data.iloc[:, 1].tolist(),
        'clusters': clusters.tolist(),
        'num_anomalies': num_anomalies,
        'anomaly_indices': anomaly_indices,
        'anomaly_distances': anomaly_scores.tolist(),
        'anomaly_percentage': anomaly_percentage,
        'avg_anomaly_score': avg_anomaly_score,
        'max_anomaly_score': max_anomaly_score,
        'min_anomaly_score': min_anomaly_score,
        'anomalies_per_cluster': anomalies_per_cluster,
        'anomaly_density_per_feature': anomaly_density_per_feature,
        'x_label': test_data.columns[0],  
        'y_label': test_data.columns[1],
    }

    return response

def isolation_forest_anomaly_detection(train_data, test_data):
    contamination = 0.01

    scaler = RobustScaler()
    train_scaled = pd.DataFrame(scaler.fit_transform(train_data), index=train_data.index, columns=train_data.columns)
    test_scaled = pd.DataFrame(scaler.transform(test_data), index=test_data.index, columns=test_data.columns)

    isolation_forest = IsolationForest(contamination=contamination, random_state=42)
    isolation_forest.fit(train_scaled) 

    predictions = isolation_forest.predict(test_scaled)
    scores = isolation_forest.decision_function(test_scaled)

    anomaly_indices = test_data.index[predictions == -1].tolist()
    num_anomalies = len(anomaly_indices)
    anomaly_scores = scores[predictions == -1]  
    avg_anomaly_score = np.mean(anomaly_scores) if num_anomalies > 0 else 0
    max_anomaly_score = np.max(anomaly_scores) if num_anomalies > 0 else 0
    min_anomaly_score = np.min(anomaly_scores) if num_anomalies > 0 else 0
    anomaly_percentage = (num_anomalies / len(test_data)) * 100

    instances = list(range(len(test_scaled)))
    chart_data = {
        "normal_scores": scores[predictions == 1].tolist(),
        "anomalous_scores": scores[predictions == -1].tolist(),
        "threshold": np.percentile(scores, (1 - contamination) * 100),
        "n_samples": len(test_data),
        "n_trees": 100,
        "contamination": contamination,
        "true_anomaly_rate": len(anomaly_indices) / len(test_data) if len(test_data) > 0 else 0,
    }

    chart_data_anomaly = {
        "instances": instances,
        "normal_scores": scores[predictions == 1].tolist(),
        "anomalous_scores": scores[predictions == -1].tolist(),
        "anomalous_indices": anomaly_indices,        
        "threshold": np.percentile(scores, (1 - contamination) * 100)
    }

    return {
        'num_anomalies': num_anomalies,
        'anomaly_indices': anomaly_indices,
        'avg_anomaly_score': avg_anomaly_score,
        'max_anomaly_score': max_anomaly_score,
        'min_anomaly_score': min_anomaly_score,
        'anomaly_percentage': anomaly_percentage,
        'chart_data': chart_data,
        'chart_data_anomaly': chart_data_anomaly
    }

def one_class_svm_anomaly_detection(train_data, test_data):
    nu_value = min(0.1, 1 / np.sqrt(len(train_data)))  
    gamma_value = 'scale' 

    scaler = RobustScaler()
    train_scaled = scaler.fit_transform(train_data)
    test_scaled = scaler.transform(test_data)

    one_class_svm = OneClassSVM(nu=nu_value, gamma=gamma_value, kernel='rbf')
    one_class_svm.fit(train_scaled)  

    scores = -one_class_svm.decision_function(test_scaled)

    threshold = np.percentile(scores, 99)  
    predictions = np.where(scores > threshold, -1, 1) 

    anomaly_indices = test_data.index[predictions == -1].tolist()

    num_anomalies = len(anomaly_indices)
    avg_anomaly_score = np.mean(scores[predictions == -1]) if num_anomalies > 0 else 0
    max_anomaly_score = np.max(scores[predictions == -1]) if num_anomalies > 0 else 0
    min_anomaly_score = np.min(scores[predictions == -1]) if num_anomalies > 0 else 0
    anomaly_percentage = (num_anomalies / len(test_data)) * 100

    chart_data = {
        "normal_scores": scores[predictions == 1].tolist(),
        "anomalous_scores": scores[predictions == -1].tolist(),
        "threshold": threshold,
        "n_samples": len(test_data),
        "nu_value": nu_value,
    }
   
    scatter_chart_data = {
        'actual': test_data.values[:, 0].tolist(),
        'predicted': scores.tolist(),
        'predictions': predictions.tolist(),
    }

    return {
        'num_anomalies': num_anomalies,
        'anomaly_indices': anomaly_indices,
        'avg_anomaly_score': avg_anomaly_score,
        'max_anomaly_score': max_anomaly_score,
        'min_anomaly_score': min_anomaly_score,
        'anomaly_percentage': anomaly_percentage,
        'previous_chart_data': chart_data,
        'scatter_chart_data': scatter_chart_data,
    }


if __name__ == '__main__':
    app.run(debug=True, port=5002)