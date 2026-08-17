# ReciFine NER service

This service runs the real `nuhuibrahim/recifinegold-recipebert-trad` RecipeBERT model used by Objective 1. The model is a BERT-base token-classification model for recipe-focused NER and supports FOOD and QUANTITY among other recipe entities. It is not currently deployed by a Hugging Face Inference Provider, so the web app must call a self-hosted/dedicated endpoint rather than the serverless HF router.

## Deploy

Build this directory as a Docker service on a host that supports persistent Python inference (for example a Hugging Face Inference Endpoint or another container host). Set `NER_SERVICE_TOKEN` to a strong random secret.

The service exposes:

- `GET /health`
- `POST /predict`

Example request:

```json
{"text":"Jollof rice with tomato, onion, pepper and chicken","task":"food-ner"}
```

The web app should receive the public HTTPS URL and set these Vercel environment variables:

- `NER_TRANSFORMER_ENDPOINT=https://YOUR-NER-HOST/predict`
- `NER_TRANSFORMER_TOKEN=the-same-secret`
- `NER_MODEL=recipebert`

Do not commit the token to GitHub.

The ReciFine model is licensed CC-BY-NC-4.0; this service is therefore intended for the academic/non-commercial project unless the model's licensing terms are separately addressed.
