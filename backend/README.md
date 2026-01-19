# Multilingual Invoice Parsing with LLaMA 4

Combining OCR for text extraction with LLMs for accurate, efficient document structuring.

## 🔍 Project Overview

This project demonstrates how **Meta's LLaMA 4** is revolutionizing **OCR and document parsing** with its advanced **multimodal** and **multilingual** capabilities. By utilizing **LLaMA 4**, we explore its ability to **extract structured data** from real-world invoices, validate the results using **Pydantic**, and build a modern **Next.js frontend** with a **Flask backend** for user interaction. 

The model excels in parsing invoices in multiple languages, including **English**, **French**, and **Arabic**, ensuring **accurate** and **reliable** outputs. This project showcases **LLaMA 4** as a powerful tool for **intelligent document processing**, paving the way for smarter, **AI-driven automation** in various industries.

👀 Curious how it works? Dive into the full story here: https://medium.com/towards-artificial-intelligence/multilingual-invoice-parsing-project-with-llama-4-ocr-and-python-4649a62ba2dc 

# Invoice Parsing Results

Below are the results from parsing three invoices:

### English Invoice 
![Invoice 1](Results/English_invoice.png)

### French Invoice
![Invoice 2](Results/French_invoice.png)

### Arabic Invoice
![Invoice 3](Results/arabic_invoice.png)

# 🎯 Key Features
- **Automated Invoice Parsing with LLaMA 4**: Leverage LLaMA 4's advanced multimodal capabilities to automate and enhance the invoice parsing process, extracting structured data efficiently.

- **Structured Data Validation with Pydantic**: Use Pydantic's BaseModel to refine, validate, and ensure the output from LLaMA 4 is clean, structured, and reliable for further processing.

- **Multilingual OCR Parsing**: Unlock LLaMA 4's versatility by parsing invoices in multiple languages, including **English**, **French**, and **Arabic**, demonstrating its robust multilingual understanding.

- **Modern Next.js Frontend**: Beautiful, responsive UI built with Next.js and Tailwind CSS for an excellent user experience.

- **Flask REST API Backend**: Clean API architecture separating frontend and backend concerns.

# 🚀 Getting Started

### Prerequisites
* Python 3.11 or above 🐍
* Node.js 18+ and npm
* Groq API for inference, which is currently available for free in its beta version with rate limits. You can obtain your API key here after creating an account: [Groq API](https://console.groq.com/keys).

# 💻 Local Deployment

### 1. Clone the Repository
```bash
git clone https://github.com/Mouez-Yazidi/Multilingual-Invoice-Parsing-with-LLaMA-4.git
cd Multilingual-Invoice-Parsing-with-LLaMA-4
```

### 2. Backend Setup

#### Add Environment Variables
Create a `.env` file in the root directory and add:
```plaintext
GROQ_API_KEY=your_groq_api_key_here
```

#### Install Python Dependencies
```bash
pip install -r requirements.txt
```

#### Run the Flask API Server
```bash
python api_server.py
```
The API server will run on http://localhost:5000

### 3. Frontend Setup

#### Navigate to Frontend Directory
```bash
cd frontend
```

#### Install Dependencies
```bash
npm install
```

#### Configure API URL (Optional)
Create a `.env.local` file in the `frontend` directory:
```plaintext
NEXT_PUBLIC_API_URL=http://localhost:5000
```
(Defaults to http://localhost:5000 if not set)

#### Run the Next.js Development Server
```bash
npm run dev
```
The frontend will run on http://localhost:3000

### 4. Access the Application
Open your browser and navigate to http://localhost:3000 🌐

## 🏗️ Architecture

- **Frontend**: Next.js 16+ with TypeScript and Tailwind CSS
- **Backend**: Flask REST API
- **Extraction Engine**: Groq API with LLaMA 4 model
- **Data Validation**: Pydantic models

## 📁 Project Structure

```
.
├── api_server.py          # Flask backend API
├── utils.py               # Extraction engine and utilities
├── app.py                 # Legacy Streamlit app (optional)
├── requirements.txt       # Python dependencies
├── frontend/              # Next.js frontend
│   ├── app/
│   │   ├── page.tsx       # Main invoice parsing page
│   │   └── layout.tsx     # Root layout
│   └── package.json
└── Results/               # Sample invoice images
```

## 🔄 Running Both Servers

You can run both servers in separate terminals:

**Terminal 1 (Backend):**
```bash
python api_server.py
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

### 🐳 Optional: Running with Docker
If you prefer running the app in a Docker container, follow these steps:
1. Make sure you have Docker installed 🐋.
2. Build the Docker image:
```bash
docker build -t InvoiceParsing -f Dockerfile  ..
```
3. Run the container:
```bash
docker run -p 8501:8501 InvoiceParsing streamlit run app.py --environment local
```

## 📝 API Endpoints

- `GET /api/health` - Health check endpoint
- `POST /api/extract` - Extract invoice data from uploaded file or URL
- `POST /api/pdf-info` - Get PDF page count for multi-page PDFs

## 🎨 Features

- Upload invoice images (PNG, JPG, JPEG)
- Upload PDF files with page selection
- Enter image URLs
- Real-time extraction with loading states
- Beautiful, responsive UI
- Dark mode support
- Error handling and validation
