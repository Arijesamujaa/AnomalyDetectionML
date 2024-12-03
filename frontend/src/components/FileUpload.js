import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './FileUpload.css';

function FileUpload() {
    const [file, setFile] = useState(null);
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];

        if (!selectedFile) {
            setMessage('Please select a file.');
            return;
        }

        if (selectedFile.size === 0) {
            setMessage('The selected file is empty. Please choose a valid file.');
            setFile(null);
            return;
        }

        const allowedExtensions = /(\.csv|\.xlsx)$/i;
        if (!allowedExtensions.exec(selectedFile.name)) {
            setMessage('Invalid file type. Only CSV and Excel files are allowed.');
            setFile(null);
            return;
        }

        const fileSizeLimit = 5 * 1024 * 1024; 
        if (selectedFile.size > fileSizeLimit) {
            setMessage('File size exceeds the 5MB limit.');
            setFile(null);
            return;
        }

        setFile(selectedFile);
        setMessage('');
    };

    const handleFileUpload = async (event) => {
        event.preventDefault();

        if (!file) {
            setMessage('Please select a file to upload.');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post('http://localhost:5002/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.status === 200) {
                const fileId = response.data.filename;
                setMessage('File uploaded successfully. Redirecting...');
                navigate(`/select-algorithm/${fileId}`);
            } else {
                setMessage('File upload failed. Please try again.');
            }
        } catch (error) {
            if (error.response && error.response.data && error.response.data.error) {
                setMessage(error.response.data.error);
            } else {
                setMessage('There was a problem uploading the file.');
            }
            console.error(error);
        }
    };

    return (
        <div className="page">
            <div className="landing-page">
                <div className="content">
                    <h1>Ready to Uncover Hidden Patterns?</h1>
                    <p>Select and upload your dataset. 
                        We'll analyze it for anomalies using advanced machine learning techniques.</p>
                    <form onSubmit={handleFileUpload} className="file-upload-form">
                        <input type="file" onChange={handleFileChange} />
                        <button type="submit">Upload</button>
                    </form>
                    {message && <p className="upload-message">{message}</p>}
                </div>
            </div>
            <div className="graphic-page"></div>
            <div className="graphic">
                <img src="../images/charts.jpg" alt="" />
            </div>
        </div>
    );
}

export default FileUpload;
