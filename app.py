from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import pandas as pd
import numpy as np
import joblib
import tensorflow as tf
import io

MODEL_PATH = "model/gru_model.keras"
SCALER_BIAS = "model/scaler_bias.pkl"
SCALER_DRIFT = "model/scaler_drift.pkl"
WINDOW = 60   # same window used during training

app = FastAPI()

# Enable frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# LOAD MODEL & SCALERS ON START
# -----------------------------
model = tf.keras.models.load_model(MODEL_PATH, compile=False)
scaler_bias = joblib.load(SCALER_BIAS)
scaler_drift = joblib.load(SCALER_DRIFT)


def make_windows(X, window=WINDOW):
    Xs = []
    for i in range(len(X) - window):
        Xs.append(X[i:i+window])
    return np.array(Xs)


@app.post("/predict")
async def predict(file: UploadFile = File(...)):

    try:
        data = await file.read()
        df = pd.read_csv(io.BytesIO(data))

        # Check columns
        if "bias_float64" not in df.columns or "drift_float64" not in df.columns:
            return JSONResponse(
                {"error": "CSV must contain bias_float64 and drift_float64"},
                status_code=400
            )

        # Timestamp handling
        if "timestamp" in df.columns:
            df["timestamp"] = pd.to_datetime(df["timestamp"])
            df = df.sort_values("timestamp").reset_index(drop=True)
        else:
            df["timestamp"] = pd.date_range("2024-01-01", periods=len(df), freq="30S")

        # Ensure 30-second frequency
        start, end = df["timestamp"].iloc[0], df["timestamp"].iloc[-1]
        idx = pd.date_range(start, end, freq="30S")
        df = df.set_index("timestamp").reindex(idx).rename_axis("timestamp").reset_index()

        # Drift interpolation
        df["drift_float64"] = df["drift_float64"].interpolate("linear", limit_direction="both")

        # Bias fallback fill
        if df["bias_float64"].isna().any():
            df["bias_float64"] = df["bias_float64"].ffill().bfill()

        # Scale features
        bias_s = scaler_bias.transform(df[["bias_float64"]])
        drift_s = scaler_drift.transform(df[["drift_float64"]])
        X = np.hstack([bias_s, drift_s])

        # Windowing
        X_windows = make_windows(X, WINDOW)
        if len(X_windows) == 0:
            return JSONResponse({"error": "Not enough rows for a 60-step window"}, status_code=400)

        # Predict
        y_scaled = model.predict(X_windows).flatten()
        y = scaler_bias.inverse_transform(y_scaled.reshape(-1, 1)).flatten()

        # Align timestamps (prediction occurs at position i+WINDOW)
        pred_ts = df["timestamp"].iloc[WINDOW:].astype(str).tolist()

        output = [
            {
                "ts": t,
                "pred": float(np.float64(v))   # FULL PRECISION
            }
            for t, v in zip(pred_ts, y)
        ]

        return {"predictions": output, "n_predictions": len(output)}

    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)


@app.get("/")
def home():
    return {"status": "GRU GNSS Predictor Backend Running"}
