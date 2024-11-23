import tensorflow as tf
import numpy as np
from typing import Dict, List, Tuple, Optional
import joblib
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import logging
from datetime import datetime
import os
from ...config.settings import settings

logger = logging.getLogger(__name__)

class SecurityMLModel:
    def __init__(self):
        self._initialize_models()
        self.scaler = StandardScaler()
        self.feature_history: List[np.ndarray] = []
        self.anomaly_history: List[float] = []
        self.last_retrain_time = datetime.now()
        self.model_version = 0
        
    def _initialize_models(self):
        """Initialize both deep learning and anomaly detection models"""
        # Deep Learning Model for Risk Scoring
        self.dl_model = tf.keras.Sequential([
            tf.keras.layers.Dense(128, activation='relu', input_shape=(5,)),
            tf.keras.layers.Dropout(0.3),
            tf.keras.layers.Dense(64, activation='relu'),
            tf.keras.layers.Dropout(0.2),
            tf.keras.layers.Dense(32, activation='relu'),
            tf.keras.layers.Dense(16, activation='relu'),
            tf.keras.layers.Dense(1, activation='sigmoid')
        ])
        self.dl_model.compile(
            optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
            loss='binary_crossentropy',
            metrics=['accuracy']
        )
        
        # Isolation Forest for Anomaly Detection
        self.isolation_forest = IsolationForest(
            n_estimators=100,
            contamination=0.1,
            random_state=42
        )
        
        # Generate and fit initial synthetic data
        self._train_with_synthetic_data()
        
    def _generate_synthetic_data(self, n_samples: int = 1000) -> Tuple[np.ndarray, np.ndarray]:
        """Generate synthetic data for initial model training"""
        # Normal behavior
        normal_data = np.random.normal(loc=0.5, scale=0.2, size=(int(n_samples * 0.7), 5))
        normal_labels = np.zeros((int(n_samples * 0.7), 1))
        
        # Suspicious behavior
        suspicious_data = np.random.normal(loc=0.8, scale=0.3, size=(int(n_samples * 0.3), 5))
        suspicious_labels = np.ones((int(n_samples * 0.3), 1))
        
        # Combine and shuffle
        X = np.vstack([normal_data, suspicious_data])
        y = np.vstack([normal_labels, suspicious_labels])
        
        # Add noise and constraints
        X = np.clip(X, 0, 1)  # Ensure values are between 0 and 1
        X[:, 2] *= 10  # Scale up pattern count feature
        
        return X, y
        
    def _train_with_synthetic_data(self):
        """Train models with synthetic data"""
        X, y = self._generate_synthetic_data()
        
        # Fit scaler
        self.scaler.fit(X)
        X_scaled = self.scaler.transform(X)
        
        # Train deep learning model
        self.dl_model.fit(
            X_scaled, y,
            epochs=10,
            batch_size=32,
            verbose=0
        )
        
        # Train isolation forest
        self.isolation_forest.fit(X_scaled)
        
        logger.info("Models initialized with synthetic data")
        
    def predict_risk(self, features: np.ndarray) -> float:
        """Predict risk score using both models"""
        try:
            # Scale features
            features_scaled = self.scaler.transform(features)
            
            # Get predictions from both models
            dl_score = float(self.dl_model.predict(features_scaled, verbose=0)[0][0])
            isolation_score = float(self.isolation_forest.score_samples(features_scaled)[0])
            
            # Normalize isolation forest score to [0,1]
            isolation_score = 1 / (1 + np.exp(isolation_score))
            
            # Combine scores (weighted average)
            combined_score = 0.7 * dl_score + 0.3 * isolation_score
            
            # Store for model updating
            self.feature_history.append(features[0])
            self.anomaly_history.append(combined_score)
            
            # Trim history if too long
            if len(self.feature_history) > 10000:
                self.feature_history = self.feature_history[-10000:]
                self.anomaly_history = self.anomaly_history[-10000:]
            
            return combined_score
            
        except Exception as e:
            logger.error(f"Error in risk prediction: {str(e)}")
            return 0.5  # Default moderate risk on error
            
    def update_model(self, features: np.ndarray, labels: np.ndarray):
        """Update models with new data"""
        try:
            # Scale features
            features_scaled = self.scaler.transform(features)
            
            # Update deep learning model
            self.dl_model.train_on_batch(features_scaled, labels)
            
            # Check if we should retrain isolation forest
            time_since_retrain = (datetime.now() - self.last_retrain_time).total_seconds()
            if time_since_retrain > settings.MODEL_RETRAIN_INTERVAL:
                self._retrain_isolation_forest()
                
            self.model_version += 1
            logger.info(f"Models updated successfully. New version: {self.model_version}")
            
        except Exception as e:
            logger.error(f"Error updating models: {str(e)}")
            
    def _retrain_isolation_forest(self):
        """Retrain isolation forest with recent historical data"""
        if len(self.feature_history) > 100:
            X = np.array(self.feature_history)
            X_scaled = self.scaler.transform(X)
            
            # Retrain isolation forest
            self.isolation_forest = IsolationForest(
                n_estimators=100,
                contamination=0.1,
                random_state=42
            )
            self.isolation_forest.fit(X_scaled)
            
            self.last_retrain_time = datetime.now()
            logger.info("Isolation Forest retrained with historical data")
            
    def save_models(self, directory: str):
        """Save models and scaler to disk"""
        try:
            os.makedirs(directory, exist_ok=True)
            
            # Save deep learning model
            self.dl_model.save(os.path.join(directory, 'dl_model'))
            
            # Save isolation forest and scaler
            joblib.dump(self.isolation_forest, os.path.join(directory, 'isolation_forest.pkl'))
            joblib.dump(self.scaler, os.path.join(directory, 'scaler.pkl'))
            
            # Save metadata
            metadata = {
                'version': self.model_version,
                'last_retrain': self.last_retrain_time.isoformat(),
                'feature_count': len(self.feature_history)
            }
            joblib.dump(metadata, os.path.join(directory, 'metadata.pkl'))
            
            logger.info(f"Models saved successfully to {directory}")
            
        except Exception as e:
            logger.error(f"Error saving models: {str(e)}")
            
    def load_models(self, directory: str):
        """Load models and scaler from disk"""
        try:
            # Load deep learning model
            self.dl_model = tf.keras.models.load_model(os.path.join(directory, 'dl_model'))
            
            # Load isolation forest and scaler
            self.isolation_forest = joblib.load(os.path.join(directory, 'isolation_forest.pkl'))
            self.scaler = joblib.load(os.path.join(directory, 'scaler.pkl'))
            
            # Load metadata
            metadata = joblib.load(os.path.join(directory, 'metadata.pkl'))
            self.model_version = metadata['version']
            self.last_retrain_time = datetime.fromisoformat(metadata['last_retrain'])
            
            logger.info(f"Models loaded successfully from {directory}")
            
        except Exception as e:
            logger.error(f"Error loading models: {str(e)}")
            self._initialize_models()  # Fallback to new models

# Create singleton instance
security_model = SecurityMLModel()
