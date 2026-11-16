# TradeSmart AI

**An AI-powered vehicle trade-in valuation assistant for South African used-car dealerships.**

Business Analysis 3.2 (AIBUY3A) · Project: *An AI Solution for Industries* · Diploma in Information Technology · Vaal University of Technology · 2026

![Python](https://img.shields.io/badge/Python-3.12-blue)
![XGBoost](https://img.shields.io/badge/Model-XGBoost-orange)
![Flask](https://img.shields.io/badge/Web-Flask%20%2B%20htmx-lightgrey)
![SQL Server](https://img.shields.io/badge/Database-SQL%20Server-red)
![License](https://img.shields.io/badge/Data-MIT%20licence-green)

---

## Overview

Dealerships in South Africa usually value trade-ins by hand. The process is slow, two consultants can value the same car differently, and the details a customer mentions about the car's condition are rarely recorded. Overpaying loses margin, and underpaying loses the deal.

TradeSmart AI is a chatbot that a dealership can place on its website or a showroom tablet. It:

1. Asks the customer for the vehicle's **make and model, year and mileage**.
2. Uses **NLP** to read the customer's own description of accidents, dents, windscreen damage, respray work and modifications, and stores each issue as a structured finding for the consultant to check at inspection.
3. Uses an **XGBoost** model to predict a **market value range**.
4. Saves every valuation to **SQL Server** and appends it to an **Excel-readable log**.

> The estimate is a starting point, not an offer. A consultant confirms the final figure at inspection.

## Key results

All figures are on unseen test cars and averaged over 5 random 80/20 splits unless stated otherwise.

| Measure | Result |
|---|---|
| Estimates within ±15% of the listing price | **87.8%** (75.0% within ±10%) |
| R² (XGBoost) | **0.911** average (range 0.859 to 0.952); depreciation baseline 0.902 |
| Average error (MAE) | **about R41 900** |
| Response time | 11 ms typical, 44 ms slowest (excluding the database save) |
| NLP condition classifier | 96% accuracy on 26 held-out statements (indicative only) |
| Average depreciation | about **9.5% of value per year** |

On the main single split, tuned XGBoost reaches R² 0.973 and MAE R39 116. This sits at the favourable end of the range, which is why the averaged figures above are the ones the app reports.

### Models compared (main test split)

| Model | MAE | RMSE | R² |
|---|---|---|---|
| Depreciation baseline | R59 981 | R163 204 | 0.9021 |
| Linear Regression | R92 169 | R181 580 | 0.8788 |
| Random Forest | R43 196 | R107 392 | 0.9576 |
| **XGBoost (tuned, used by the app)** | **R39 116** | **R85 415** | **0.9732** |
| Deep Learning (MLP) | R51 529 | R148 098 | 0.9194 |

## Features

- **Vehicle search:** type a make and model and pick from 2 393 known models as you type.
- **Forgiving input:** mileage such as `85 000`, `85,000` or `85k` is understood; unreadable values are rejected with a clear message.
- **Condition NLP:** splits the answer into mentions, classifies each into one of 8 categories (TF-IDF + Logistic Regression), extracts details (for example dent size), and flags vague or contradictory answers for review.
- **Value range with honest uncertainty:** low and high estimate based on measured error, plus a low-confidence warning for vehicles outside model years 2018 to 2023.
- **POPIA-aware:** phone and email are stored only if the customer ticks the consent box.
- **Resilient:** if the database is unavailable the customer still gets the estimate, and a locked log file never interrupts the chat.

## How it works

```
Chat  ->  Understand  ->  Predict  ->  Record
Customer   NLP turns words   XGBoost estimates   Saved to SQL Server
picks car  into findings     value and range     and an Excel log
```

The customer does not know their car's torque or CO2 rating, so the app fills in the **typical specification of the chosen model** (median of numeric specs, most common value of categories across all listings of that model). Only the customer's own year and mileage are entered per valuation.

## Repository structure

```
.
├── tradesmart-flask/     # Web application and chatbot (Flask, Jinja2, htmx)
├── tradesmart-ml/        # Data correction, model training/evaluation, NLP, time series
│   └── src/
│       ├── fix_dataset.py
│       ├── split_experiments.py
│       ├── time_series_analysis.py
│       └── train_deep_learning.py
├── database/             # SQL Server script (6 tables + data) and the ERD
├── logs/                 # customer_submissions.csv (excluded from version control)
└── docs/                 # Project documentation and poster
```

## Tech stack

| Tool | Used for |
|---|---|
| Python 3.12 | All code |
| pandas, NumPy | Data loading, cleaning, feature engineering |
| scikit-learn | Linear Regression, Random Forest, preprocessing, cross-validation, tuning, TF-IDF + Logistic Regression |
| XGBoost | Final valuation model |
| TensorFlow / Keras | Deep learning (MLP) comparison model |
| Flask, Jinja2, htmx | Web chatbot (server-side Python, no hand-written JavaScript) |
| Microsoft SQL Server | Database |
| matplotlib | Time series figures |
| GitHub | Version control and project management |

## Data

- **Source:** Autotrader South Africa used-car listings, scraped on 23 to 24 April 2023 by [Adewoyin (2023)](https://github.com/vaadewoyin/used-car-price-prediction) and published under the **MIT licence**.
- **Size after our corrections:** 16 453 listings, 2 393 makes and models, 53 brands, model years 2018 to 2023, prices R59 000 to R12 million (median R379 900).
- **Corrections we made to the published cleaning step** (`tradesmart-ml/src/fix_dataset.py`):
  - Split brand names fixed (316 listings), for example "Land Rover" had become brand "Land".
  - Fuel consumption values that had lost their leading "1" restored (405 listings) or removed where they could not be confirmed (179).
  - Impossible mileages removed (3 listings).

### Database

Six related tables: `VEHICLE` (all 16 453 listings), `VEHICLE_MODEL` (one row per make and model with typical specs), `CUSTOMER`, `VALUATION_SESSION`, `CONDITION_FINDING` and `CONDITION_CATEGORY`. See the ERD in `database/` and the project documentation.

## Time series analysis

The dataset is a single snapshot, so value over time is derived by comparing each model only against itself across model years (1 289 models, 2 499 comparisons) and fitting an exponential curve, `value(t) = value(0) × e^(-rt)`.

| Years older | Value retained (observed median) |
|---|---|
| 1 | 91.7% |
| 2 | 83.7% |
| 3 | 75.7% |
| 4 | 67.1% |
| 5 | 62.5% |

Bakkies hold value best (extended cab about 6.3% a year, double cab 8.2%); sedans lose value fastest (about 11.3% a year).

## Getting started

> **Group: fill in the exact commands for your project below.**

### Prerequisites

- Python 3.12
- Microsoft SQL Server (with SQL Server Management Studio, optional)
- Package versions are pinned in the requirements files.

### 1. Clone the repository

```bash
git clone <YOUR-REPOSITORY-URL>
cd <YOUR-REPOSITORY-FOLDER>
```

### 2. Set up the database

Run the script in `database/` in SQL Server to create the six tables and load the data, then configure the connection settings for the web app.

### 3. Run the web application

The web app has a one-click launcher that installs what it needs on first run:

```bash
cd tradesmart-flask
# run the launcher: <LAUNCHER-FILE-NAME>
```

Then open the address shown in the terminal in any modern web browser.

### 4. Retrain the model (optional)

The pipeline is: correct the data, train, then copy the model into the web app.

```bash
cd tradesmart-ml
python src/fix_dataset.py
# then run the training script(s) in src/, e.g.:
# python src/<TRAINING-SCRIPT>.py
```

## Screenshots

<!-- Add screenshots here -->
| Vehicle search | Condition step | Result card |
|---|---|---|
| ![Vehicle search](docs/screenshots/vehicle-search.png) | ![Condition step](docs/screenshots/condition-step.png) | ![Result card](docs/screenshots/result-card.png) |

![Database tables in SSMS](docs/screenshots/database.png)

## Limitations

- **Asking prices, not trade-in prices.** The model is trained on public asking prices, which are normally higher than trade-in offers. The app shows a market value *range* and a disclaimer, and the consultant sets the offer.
- **Model years 2018 to 2023 only.** Other years are flagged as low confidence.
- **Condition does not change the price.** The data has no condition information, so findings are recorded for inspection only.
- **Single snapshot (April 2023).** The depreciation curve is measured up to 5 years and assumes the same rate continues.
- **NLP test set is small.** The 102 labelled training examples were written by the group, so the 96% accuracy is indicative only.

## Roadmap

- Retrain regularly (for example quarterly) on newly collected listings.
- Store the price actually agreed with each customer to calibrate from asking prices to real trade-in values.
- Use condition findings as model features once there is enough evidence.
- Collect listings repeatedly to enable true time series models (ARIMA, Prophet).
- Grow the NLP training data with real, anonymised customer answers.
- Add a CNN to assess damage from photos, and speech recognition for spoken answers.

## Privacy (POPIA)

Minimal personal data is collected, contact details are stored only with consent, and the customer log is excluded from version control. Do not commit personal data to this repository.

## Team

| Name |
|---|
| LC Sekhukhune |
| H Madzivi |
| E Harmse |
| B Malope |

**Lecturers:** Dr. Sibanda, Mr. Matsela, Mr. Matshego

## Acknowledgements and references

- Adewoyin, V. (2023) *used-car-price-prediction* [Source code and dataset]. GitHub. MIT licence. https://github.com/vaadewoyin/used-car-price-prediction
- AutoTrader South Africa (2023) *Used cars for sale*. https://www.autotrader.co.za
- Chen, T. and Guestrin, C. (2016) XGBoost: A scalable tree boosting system. *KDD '16*, pp. 785-794.
- Breiman, L. (2001) Random forests. *Machine Learning*, 45(1), pp. 5-32.
- Bergstra, J. and Bengio, Y. (2012) Random search for hyper-parameter optimization. *JMLR*, 13, pp. 281-305.
- Pedregosa, F. et al. (2011) Scikit-learn: Machine learning in Python. *JMLR*, 12, pp. 2825-2830.
- Abadi, M. et al. (2016) TensorFlow: A system for large-scale machine learning. *OSDI '16*, pp. 265-283.
- Republic of South Africa (2013) *Protection of Personal Information Act 4 of 2013*.

## Licence

The source dataset and cleaning approach by Adewoyin (2023) are MIT-licensed. <!-- Add a LICENSE file for your own code, e.g. MIT, and state it here. -->

*TradeSmart AI is an academic project. AutoValue Motors, the dealership used in the documentation, is fictitious.*
