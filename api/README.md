
# Predictions consommation énergetique

## Authors

- Adam HANANE
- Léa COUM 
- Mohamed ELHAFA
- Marie Espinosa


## Run Locally

Clone the project

```bash
  git clone https://github.com/marieesss/go-crm-terminal
```
### Backend

Go to the project directory

```bash
  cd project/api
```

Install packages

```bash
  pip install -r requirements.txt
```

Minio

```bash
 docker compose up
 streamlit run app.py
```
MlFlow UI

```bash
 mlflow UI
```
API (après avoir lancé le notebook)

```bash
 python api_flask.py
```

Exemple de requete API

```bash
curl --location 'http://localhost:8000/predictions2?start=2025-12-18T13%3A00%3A00&horizon_hours=24&freq_min=30'
```

