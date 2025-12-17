import os
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
import mlflow
from mlflow.tracking import MlflowClient

mlflow.set_tracking_uri(os.getenv("MLFLOW_TRACKING_URI", "file:./mlruns"))
MODEL_URI =  "models:/SmartEnergyRF/2"   
_model = None
def get_model():
    global _model
    if _model is None:
        _model = mlflow.pyfunc.load_model(MODEL_URI)
    return _model


app = Flask(__name__)
CORS(app)

# important : pointe vers le bon store mlflow
mlflow.set_tracking_uri(os.getenv("MLFLOW_TRACKING_URI", "file:./mlruns"))
client = MlflowClient()

@app.get("/hello")
def hello():
    return jsonify({
        "res": "Hello, World!",
    })

@app.get("/predictions")
def get_predictions():
    try: 
        run_id = request.args.get("run_id")
        artifact_path = request.args.get("artifact_path")
        if not run_id:
            return jsonify({"error": "Missing query param 'run_id'"}), 400

        local_path = client.download_artifacts(run_id, "predictions.csv")
        df = pd.read_csv(local_path)

        return jsonify({
            "run_id": run_id,
            "artifact_path": "predictions.csv",
            "rows": df.to_dict(orient="records"),
        })
    except Exception as e:
        return jsonify({
            "error": "Internal server error",
            "details": str(e),
        }), 500
    


@app.get("/predictions2")
def get_predictions2():
    try: 
        start = request.args.get("start")
        horizon_hours = int(request.args.get("horizon_hours", "24"))
        freq_min = int(request.args.get("freq_min", "15"))

        if not start:
            return jsonify({"error": "Missing query param 'start' (ISO datetime)"}), 400

        start_dt = pd.to_datetime(start, errors="coerce")
        if pd.isna(start_dt):
            return jsonify({"error": "Invalid 'start' datetime"}), 400
        

        periods = int(horizon_hours * 60 / freq_min)
        idx = pd.date_range(start_dt, periods=periods, freq=f"{freq_min}min")

        # Reproduit tes features
        df = pd.DataFrame({"ts": idx})
        df["hour"] = df["ts"].dt.hour
        df["dow"] = df["ts"].dt.dayofweek
        df["is_weekend"] = df["dow"].isin([5, 6]).astype(int)

        feats = ["hour", "dow", "is_weekend"]

        model = get_model()

        preds = model.predict(df[feats]).tolist()

        return jsonify({
            "model_uri": MODEL_URI,
            "start": start_dt.isoformat(),
            "freq_min": freq_min,
            "horizon_hours": horizon_hours,
            "rows": [{"ts": t.isoformat(), "prediction": float(p)} for t, p in zip(idx, preds)]
        })

    except Exception as e:
        return jsonify({
            "error": "Internal server error",
            "details": str(e),
        }), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
