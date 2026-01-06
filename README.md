# AI-Based Prediction of Satellite Clock Bias

**Enhancing GNSS Accuracy Through Intelligent Error Forecasting**

---

## Overview

Global Navigation Satellite Systems (GNSS) such as GPS, Galileo, and NavIC rely heavily on precise satellite clock and orbit (ephemeris) data. Even minor clock errors can translate into meter-level positioning inaccuracies for end users.

This project focuses on predicting satellite clock bias using deep learning techniques. By learning temporal patterns from historical clock correction data, the system forecasts future clock bias values, improving positioning accuracy and robustness for GNSS-based applications.

### The project includes:

- Two deep learning–based prediction approaches
- End-to-end data preprocessing and feature engineering
- A deployed web application for real-time inference
- Comparative evaluation of GRU and LSTM architectures

---

## Problem Statement

Satellite clock data contains time-varying errors caused by:

- Imperfect physical modeling
- Atmospheric effects
- Satellite hardware variations

If left uncorrected, these errors degrade GNSS positioning accuracy.

**Objective:** Use historical satellite clock bias data to predict future bias values, enabling proactive error correction.

---

## Dataset

### Source

NASA Crustal Dynamics Data Information System (CDDIS)

### Description

- High-precision satellite clock correction files (.clk)
- 30-second sampling interval
- Focused satellite: C12 (BeiDou) under the AS category
- Time period: January 14–20, 2021
- Selected due to completeness and continuity of clock bias data

### Key Variables

| Variable        | Description                           |
| --------------- | ------------------------------------- |
| `timestamp`     | UTC time extracted from .clk files    |
| `bias_float64`  | Satellite clock bias (64-bit float)   |
| `drift_float64` | Rate of change of clock bias          |
| `t_seconds`     | Time converted to seconds since start |
| `drift_final`   | Interpolated continuous drift series  |

---

## Data Preprocessing

1. Extraction of raw clock bias and drift values from .clk files
2. Filtering for satellite C12 (AS category)
3. Handling missing timestamps using interpolation
4. Conversion to continuous 30-second time series
5. Sliding-window sequence generation (window size = 60)
6. Train–validation–test split:
   - 6 days for training
   - 7th day for testing

---

## Methodology

### Approach 1: GRU on Raw Clock Bias

- Uses raw clock bias values directly
- Missing values filled via interpolation
- Sequence length: 60 time steps
- Model trained on 6 days and tested on the 7th day
- GRU outperformed LSTM when trained on raw bias alone

**Key takeaway:**  
GRU handles raw temporal bias patterns efficiently with lower complexity.

### Approach 2: LSTM with Trend–Residual Decomposition

1. Extract linear trend from clock bias
2. Compute residual:
   ```
   residual = bias − trend
   ```
3. Train LSTM model only on residuals
4. Add trend back after prediction to reconstruct final bias

**Key takeaway:**  
Separating long-term trends from short-term fluctuations improves LSTM performance and prediction stability.

### Model Comparison Summary

| Approach   | Model | Input Type         | Performance           |
| ---------- | ----- | ------------------ | --------------------- |
| Approach 1 | GRU   | Raw bias           | Strong baseline       |
| Approach 2 | LSTM  | Residual component | Best overall accuracy |

---

## Web Application

A web-based interface was developed to make the model accessible without local setup.

### Features

- Upload GNSS clock bias CSV file
- Uses a pre-trained GRU model
- Predicts clock bias for the next day
- Outputs predictions at 30-second intervals
- Provides downloadable results and visualization

### Tech Stack

- HTML, CSS
- Python
- Java
- Renderer framework for deployment

### Live Demo

[https://yashpandey0031.github.io/GNSS-CLK/](https://yashpandey0031.github.io/GNSS-CLK/)

---

## Results

- Accurate short-term clock bias forecasting
- Improved generalization using trend–residual decomposition
- Demonstrated real-world usability via deployed web application
- Confirms suitability of recurrent neural networks for GNSS time-series error modeling

---

## Applications

- High-precision GNSS positioning
- Autonomous navigation systems
- Geodesy and Earth observation
- Satellite integrity monitoring
- Future integration with real-time correction services

---

## Future Work

- Extend to multi-satellite and multi-constellation modeling
- Incorporate external factors (temperature, orbital parameters)
- Experiment with Transformers and hybrid models
- Real-time streaming inference
- Integration with live GNSS correction pipelines

---

## Authors

- Parv Gupta
- Palak Baisla
- Yash Pandey

---

## Links

- **GitHub Repository:** [https://github.com/yashpandey0031/GNSS-CLK](https://github.com/yashpandey0031/GNSS-CLK)
- **Live Deployment:** [https://yashpandey0031.github.io/GNSS-CLK/](https://yashpandey0031.github.io/GNSS-CLK/)

---

## Acknowledgements

- NASA CDDIS for providing high-precision GNSS clock data
- Academic references and prior research in GNSS error modeling and time-series forecasting
