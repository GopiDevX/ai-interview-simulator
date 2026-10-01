@echo off
echo ==========================================================
echo   AI Interview Platform — Custom ML Model Training Pipeline
echo ==========================================================
echo.

cd /d "%~dp0"

echo [1/3] Checking Python dependencies...
python -m pip install -r requirements.txt --quiet

echo.
echo [2/3] Generating company-specific dataset (Accenture, Cognizant, etc.)...
python generate_dataset.py

echo.
echo [3/3] Training model (TF-IDF + Logistic Classifier + Ridge Regressor)...
python train_model.py

echo.
echo ==========================================================
echo   Training Completed! Model weights & metrics exported.
echo ==========================================================
pause
