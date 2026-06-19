# BigQuery Release Notes Hub 🚀

A sleek, responsive web application that tracks real-time Google Cloud BigQuery release updates, parses raw feed data, and lets you quickly search, filter, and tweet major updates.

Built using **Python Flask** (backend) and **Vanilla HTML, JavaScript, and CSS** (frontend).

---

## 🌟 Features

*   **Real-time RSS Parsing:** Dynamically fetches and parses the official BigQuery Atom release feed (`https://docs.cloud.google.com/feeds/bigquery-release-notes.xml`).
*   **Instant Search:** Client-side filtering that matches queries against titles, dates, or body content as you type.
*   **Automatic Categorization:** Color-coded badges classifying releases into **Feature**, **Change**, or **Deprecation** tags using heuristic keyword analysis.
*   **Premium Dark UI:** Modern theme featuring radial backgrounds, custom glassmorphism components, and subtle fade/hover animations.
*   **Twitter/X Integration:** Custom composer modal that extracts titles, checks character limits (max 280), and triggers the Twitter Web Intent window.
*   **Refresh State Spinner:** Visually feedback-driven loading spinner with custom CSS skeleton shimmers.

---

## 📂 Project Directory Structure

```text
bigquery-release-viewer/
│
├── app.py                 # Flask server & XML parsing engine
├── .gitignore             # Git ignore file (cache, env, and IDE files)
├── README.md              # Project documentation
│
├── templates/
│   └── index.html         # HTML5 SEO layout & modal template
│
└── static/
    ├── css/
    │   └── style.css      # Custom styles, variables, & animations
    └── js/
        └── main.js        # Feed fetcher, search filter, and Twitter modal orchestrator
```

---

## ⚙️ Installation & Setup

### Prerequisites
Make sure you have **Python 3.x** installed on your system.

### 1. Clone the repository
```bash
git clone https://github.com/shivamhgnis/antigravity-event-talks-app.git
cd antigravity-event-talks-app
```

### 2. Install dependencies
Install Flask directly using pip:
```bash
pip install flask
```

### 3. Run the development server
Start the Flask application:
```bash
python app.py
```

The server will initialize on:
👉 **[http://127.0.0.1:5000](http://127.0.0.1:5000)**

---

## 🛠️ How to Use

1.  **Read Updates:** The homepage automatically loads the latest BigQuery entries.
2.  **Refresh Logs:** Click the **Refresh** button in the header to trigger a background fetch. The button sync icon will spin and load shimmer skeletons until finished.
3.  **Search & Filter:** Use the search bar to query terms like `"JSON"`, `"performance"`, or `"pricing"`. The UI updates instantly with matching cards.
4.  **Tweet an Update:**
    *   Click the **Tweet** button at the top-right of any release card.
    *   An overlay composer modal will slide in, prefilled with the formatted update text.
    *   Edit the message in the textbox. The indicator keeps track of the 280 character limit.
    *   Click **Tweet now** to publish the update on Twitter.

---

## 🔒 License
This project is open-source and available under the MIT License.
