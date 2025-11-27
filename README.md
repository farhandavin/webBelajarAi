# 🚀 AI Quiz Generator

A smart web application designed to automatically generate multiple-choice quizzes by analyzing uploaded study materials (PDF/Images) or raw text. This application is powered by **Google Gemini AI** to ensure high-quality question generation.

<img width="1919" height="914" alt="image" src="https://github.com/user-attachments/assets/2d97eedf-8762-4e6c-8614-5b4f62310477" />


## ✨ Key Features

* **Generate from Text:** Simply paste your study notes, and the AI will create questions instantly.
* **Generate from File:** Upload study materials (PDF, JPG, PNG), and the AI will analyze the content.
* **Interactive UI:** Modern quiz interface with instant feedback (Correct/Incorrect animations).
* **Custom File Input:** A clean and user-friendly file upload design.
* **Database Integration:** All generated quizzes are automatically saved to a PostgreSQL database for history tracking.

## 🛠️ Tech Stack

* **Frontend:** React.js, CSS3 (Custom Styling)
* **Backend:** Node.js, Express.js
* **AI Model:** Google Gemini Flash 2.5 (`@google/generative-ai`)
* **Database:** PostgreSQL (`pg`)
* **File Handling:** Multer

## ⚙️ Installation & Setup

Follow these steps to run the project locally on your machine.

### 1. Clone the Repository
```bash
git clone [https://github.com/your-username/your-repo-name.git](https://github.com/your-username/your-repo-name.git)
cd your-repo-name
