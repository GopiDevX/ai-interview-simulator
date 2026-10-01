"""
Model Training & Evaluation Pipeline
Trains an interview answer evaluation model using TF-IDF + Logistic Regression & Ridge Regressor.
Exports evaluation metrics, confusion matrix, Python joblib bundle, and portable JSON weights for Node.js inference.
"""

import os
import json
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression, Ridge
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    accuracy_score,
    f1_score,
    precision_score,
    recall_score,
    mean_absolute_error,
    mean_squared_error,
    r2_score
)
import joblib

def main():
    base_dir = os.path.dirname(__file__)
    data_path = os.path.join(base_dir, "data", "interview_dataset.csv")
    models_dir = os.path.join(base_dir, "models")
    os.makedirs(models_dir, exist_ok=True)

    if not os.path.exists(data_path):
        print("[!] Dataset not found. Generating dataset first...")
        from generate_dataset import main as gen_main
        gen_main()

    df = pd.read_csv(data_path)
    print(f"Loaded {len(df)} samples across {df['company'].nunique()} companies.")

    # Combine question, company context, and answer as input text
    df["combined_text"] = (
        "company: " + df["company"].fillna("") +
        " category: " + df["category"].fillna("") +
        " question: " + df["question"].fillna("") +
        " answer: " + df["answer"].fillna("")
    )

    X = df["combined_text"]
    y_class = df["label"]
    y_score = df["score"]

    # Stratified Train/Test Split (80/20)
    X_train, X_test, y_class_train, y_class_test, y_score_train, y_score_test = train_test_split(
        X, y_class, y_score, test_size=0.2, random_state=42, stratify=y_class
    )

    print(f"Training samples: {len(X_train)} | Testing samples: {len(X_test)}")

    # 1. Feature Extraction: TF-IDF
    vectorizer = TfidfVectorizer(
        ngram_range=(1, 2),
        max_features=800,
        sublinear_tf=True,
        stop_words="english"
    )
    X_train_vec = vectorizer.fit_transform(X_train)
    X_test_vec = vectorizer.transform(X_test)

    # 2. Train Classifier (Quality: weak, average, good, excellent)
    clf = LogisticRegression(C=2.0, max_iter=1000, random_state=42)
    clf.fit(X_train_vec, y_class_train)

    # 3. Train Regressor (Continuous Score: 1.0 - 10.0)
    reg = Ridge(alpha=1.0, random_state=42)
    reg.fit(X_train_vec, y_score_train)

    # Predictions
    y_class_pred = clf.predict(X_test_vec)
    y_score_pred = reg.predict(X_test_vec)
    # Clip regressor output to realistic bounds [1.0, 10.0]
    y_score_pred = np.clip(y_score_pred, 1.0, 10.0)

    # Evaluation Metrics
    acc = accuracy_score(y_class_test, y_class_pred)
    f1_macro = f1_score(y_class_test, y_class_pred, average="macro")
    prec_macro = precision_score(y_class_test, y_class_pred, average="macro")
    rec_macro = recall_score(y_class_test, y_class_pred, average="macro")

    mae = mean_absolute_error(y_score_test, y_score_pred)
    rmse = np.sqrt(mean_squared_error(y_score_test, y_score_pred))
    r2 = r2_score(y_score_test, y_score_pred)

    classes = list(clf.classes_)
    cm = confusion_matrix(y_class_test, y_class_pred, labels=classes).tolist()
    clf_report = classification_report(y_class_test, y_class_pred, output_dict=True)

    metrics = {
        "model_name": "Company-Specific Interview Evaluation Model",
        "architecture": "TF-IDF (1-2 ngrams) + Logistic Regression + Ridge Regressor",
        "total_samples": len(df),
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "classification": {
            "accuracy": round(float(acc), 4),
            "f1_macro": round(float(f1_macro), 4),
            "precision_macro": round(float(prec_macro), 4),
            "recall_macro": round(float(rec_macro), 4),
            "classes": classes,
            "confusion_matrix": cm,
            "detailed_report": clf_report
        },
        "regression": {
            "mae": round(float(mae), 4),
            "rmse": round(float(rmse), 4),
            "r2_score": round(float(r2), 4)
        }
    }

    # Save Metrics JSON
    metrics_path = os.path.join(models_dir, "metrics_report.json")
    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)

    # Save Human-Readable Report for Reviewer
    report_text = f"""================================================================================
AI INTERVIEW PLATFORM — CUSTOM ML MODEL EVALUATION REPORT
================================================================================
Model:         TF-IDF + Logistic Classifier + Ridge Regressor
Dataset Size:  {len(df)} curated interview Q&A pairs
Training Set:  {len(X_train)} samples (80%)
Testing Set:   {len(X_test)} samples (20%)
Companies:     Accenture, Cognizant, TCS, Infosys, Wipro, Google, Amazon, Microsoft

--------------------------------------------------------------------------------
1. ANSWER QUALITY CLASSIFICATION METRICS
--------------------------------------------------------------------------------
Accuracy:          {acc * 100:.2f}%
Macro Precision:   {prec_macro * 100:.2f}%
Macro Recall:      {rec_macro * 100:.2f}%
Macro F1-Score:    {f1_macro * 100:.2f}%

Confusion Matrix (Labels: {classes}):
{np.array(cm)}

--------------------------------------------------------------------------------
2. SCORE PREDICTION (CONTINUOUS 1.0 - 10.0)
--------------------------------------------------------------------------------
Mean Absolute Error (MAE):     {mae:.3f} points
Root Mean Squared Error (RMSE):{rmse:.3f} points
R-squared (R2) Variance:       {r2:.3f}

--------------------------------------------------------------------------------
3. HYBRID PIPELINE ROLE
--------------------------------------------------------------------------------
- Custom ML Model: Provides objective, reproducible numerical scoring & classification.
- Gemini LLM:      Provides contextual reasoning, actionable advice, and natural feedback.
================================================================================
"""
    report_file_path = os.path.join(models_dir, "model_metrics.txt")
    with open(report_file_path, "w", encoding="utf-8") as f:
        f.write(report_text)

    # Save Python Joblib Bundle
    joblib_path = os.path.join(models_dir, "model_bundle.joblib")
    joblib.dump({"vectorizer": vectorizer, "classifier": clf, "regressor": reg}, joblib_path)

    # Export Model Parameters to Portable JSON for Node.js
    vocabulary = vectorizer.vocabulary_
    idf = vectorizer.idf_.tolist()

    export_payload = {
        "metadata": {
            "name": "InterviewEvaluationML",
            "version": "1.0.0",
            "accuracy": metrics["classification"]["accuracy"],
            "mae": metrics["regression"]["mae"],
            "classes": classes
        },
        "vocabulary": vocabulary,
        "idf": idf,
        "classifier": {
            "classes": classes,
            "coef": clf.coef_.tolist(),
            "intercept": clf.intercept_.tolist()
        },
        "regressor": {
            "coef": reg.coef_.tolist(),
            "intercept": float(reg.intercept_)
        }
    }

    export_path = os.path.join(models_dir, "model_export.json")
    with open(export_path, "w", encoding="utf-8") as f:
        json.dump(export_payload, f)

    print("\n" + report_text)
    print(f"[OK] Training complete!")
    print(f"     Metrics Report: {metrics_path}")
    print(f"     Readable Report: {report_file_path}")
    print(f"     Joblib Bundle:  {joblib_path}")
    print(f"     JSON Export:    {export_path}")

if __name__ == "__main__":
    main()
