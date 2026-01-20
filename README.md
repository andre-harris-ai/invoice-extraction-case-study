# Multilingual Invoice Parsing with LLaMA 4

A modern, full-stack invoice extraction system that uses LLaMA 4 Scout model via Groq API to extract structured data from invoices in multiple languages. The system features a beautiful Next.js frontend and a Flask backend API, with Excel database integration for storing extracted invoice data.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.12+-green.svg)
![Next.js](https://img.shields.io/badge/Next.js-16.1.3-black)
![Flask](https://img.shields.io/badge/Flask-3.0+-green.svg)

## 🚀 Features

- **Multi-format Support**: Upload PDF, PNG, JPG, or JPEG files
- **Multi-page PDF Support**: Select specific pages from multi-page PDF documents
- **Multilingual Processing**: Extract data from invoices in multiple languages using LLaMA 4 Scout
- **Real-time Progress Tracking**: Step-by-step progress indicator with visual feedback
- **Before/After Comparison**: View raw OCR text and JSON response alongside structured data
- **Editable Fields**: Edit extracted invoice data before saving
- **Excel Database Integration**: Save invoices to Excel with SalesOrderHeader and SalesOrderDetail structure
- **Modern UI**: Beautiful, responsive dashboard built with Next.js and TailwindCSS
- **Error Handling**: Comprehensive error messages and validation
- **Success Notifications**: Toast alerts for successful operations

## 📋 Table of Contents

- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Workflow](#workflow)
- [Contributing](#contributing)
- [License](#license)

## 🏗️ Architecture

The system consists of three main components:

1. **Next.js Frontend** (`frontend/`): Modern React-based UI with TailwindCSS
2. **Flask Backend** (`backend/`): RESTful API server for processing invoices
3. **Excel Database**: Stores extracted invoice data in structured format

### System Flow

```
User Upload → Frontend → Flask API → File Processing → Groq API (LLaMA 4) 
→ Data Extraction → Pydantic Validation → Frontend Display → Excel Database
```

For a detailed workflow diagram, see [WORKFLOW_DIAGRAM.md](./WORKFLOW_DIAGRAM.md).

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 16.1.3 (React 19.2.3)
- **Styling**: TailwindCSS 4
- **Language**: TypeScript 5
- **Features**: Real-time progress tracking, toast notifications, responsive design

### Backend
- **Framework**: Flask 3.0+
- **Language**: Python 3.12+
- **Key Libraries**:
  - `groq`: Groq API client for LLaMA 4 Scout
  - `pydantic`: Data validation and modeling
  - `pypdf`: PDF reading and processing
  - `pdf2image`: PDF to image conversion
  - `PIL/Pillow`: Image processing and format conversion
  - `pandas`: Excel operations
  - `openpyxl`: Excel file handling
  - `flask-cors`: CORS support for frontend communication

### External Services
- **Groq API**: LLaMA 4 Scout model (`meta-llama/llama-4-scout-17b-16e-instruct`)
  - OCR text extraction
  - Structured data extraction

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.12+** ([Download](https://www.python.org/downloads/))
- **Node.js 18+** and **npm** ([Download](https://nodejs.org/))
- **Groq API Key** ([Get one here](https://console.groq.com/))
- **Poppler** (for PDF processing on Linux/Mac):
  ```bash
  # Ubuntu/Debian
  sudo apt-get install poppler-utils
  
  # macOS
  brew install poppler
  
  # Windows: Download from https://github.com/oschwartz10612/poppler-windows/releases
  ```

## 🔧 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/andre-harris-ai/invoice-extraction-case-study.git
cd invoice-extraction-case-study
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install dependencies
npm install
```

## ⚙️ Configuration

### 1. Environment Variables

Create a `.env` file in the `backend/` directory:

```env
GROQ_API_KEY=your_groq_api_key_here
```

**Important**: Replace `your_groq_api_key_here` with your actual Groq API key.

### 2. API URL Configuration (Optional)

The frontend defaults to `http://localhost:5000` for the backend API. To change this:

1. Create a `.env.local` file in the `frontend/` directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

2. Or modify the `API_URL` constant in `frontend/app/page.tsx`.

## 🚀 Usage

### 1. Start the Backend Server

```bash
# From the backend directory
cd backend
python api_server.py
```

The backend will start on `http://localhost:5000`.

### 2. Start the Frontend Development Server

```bash
# From the frontend directory (in a new terminal)
cd frontend
npm run dev
```

The frontend will start on `http://localhost:3000`.

### 3. Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

### 4. Extract Invoice Data

1. **Upload a File**: Click "Choose File" and select a PDF or image file (PNG, JPG, JPEG)
2. **Select Page** (for PDFs): If the PDF has multiple pages, select the page to extract
3. **Click Extract**: The system will:
   - Process the file
   - Extract raw OCR text
   - Extract structured data using LLaMA 4
   - Display results in Before/After sections
4. **Review & Edit**: Review the extracted data and edit if necessary
5. **Save to Database**: Click "Save to Excel" to store the invoice in the Excel database

## 📚 API Documentation

### Health Check

**GET** `/api/health`

Check if the API is running and if the Groq API key is configured.

**Response:**
```json
{
  "status": "ok",
  "api_key_configured": true
}
```

### Get PDF Info

**POST** `/api/pdf-info`

Get the total number of pages in a PDF file.

**Request:**
- `file`: PDF file (multipart/form-data)

**Response:**
```json
{
  "success": true,
  "total_pages": 3
}
```

### Extract Invoice

**POST** `/api/extract`

Extract structured data from an invoice image or PDF.

**Request:**
- `file`: PDF or image file (multipart/form-data)
- `page_number`: Page number (0-indexed, for PDFs only, optional, default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "invoice_number": "INV-2024-001",
    "invoice_date": "2024-01-15",
    "due_date": "2024-02-15",
    "billing_address": "123 Main St, City, Country",
    "shipping_address": "123 Main St, City, Country",
    "vendor_name": "Vendor Inc.",
    "customer_name": "Customer Corp.",
    "line_items": [
      {
        "description": "Product A",
        "quantity": 2,
        "unit_price": 50.00,
        "total_price": 100.00
      }
    ],
    "subtotal": 100.00,
    "tax": 10.00,
    "total_amount": 110.00,
    "currency": "USD"
  },
  "raw_ocr_text": "Raw OCR text extracted from image...",
  "raw_json_response": "{\"invoice_number\": \"INV-2024-001\", ...}"
}
```

### Save Invoice

**POST** `/api/save-invoice`

Save extracted invoice data to the Excel database.

**Request:**
```json
{
  "invoice_number": "INV-2024-001",
  "invoice_date": "2024-01-15",
  "due_date": "2024-02-15",
  "billing_address": "123 Main St, City, Country",
  "shipping_address": "123 Main St, City, Country",
  "vendor_name": "Vendor Inc.",
  "customer_name": "Customer Corp.",
  "line_items": [
    {
      "description": "Product A",
      "quantity": 2,
      "unit_price": 50.00,
      "total_price": 100.00
    }
  ],
  "subtotal": 100.00,
  "tax": 10.00,
  "total_amount": 110.00,
  "currency": "USD"
}
```

**Response:**
```json
{
  "success": true,
  "order_id": 1,
  "message": "Invoice saved with OrderID: 1"
}
```

### Get All Invoices

**GET** `/api/get-invoices`

Retrieve all invoices from the database.

**Response:**
```json
{
  "success": true,
  "headers": [
    {
      "OrderID": 1,
      "InvoiceNumber": "INV-2024-001",
      "InvoiceDate": "2024-01-15",
      ...
    }
  ],
  "details": [
    {
      "OrderID": 1,
      "LineNumber": 1,
      "ItemDescription": "Product A",
      ...
    }
  ]
}
```

### Get Invoice by ID

**GET** `/api/get-invoice/<order_id>`

Retrieve a specific invoice by OrderID.

**Response:**
```json
{
  "success": true,
  "header": {
    "OrderID": 1,
    "InvoiceNumber": "INV-2024-001",
    ...
  },
  "details": [
    {
      "OrderID": 1,
      "LineNumber": 1,
      "ItemDescription": "Product A",
      ...
    }
  ]
}
```

### Update Invoice

**POST** `/api/update-invoice`

Update an existing invoice in the database.

**Request:**
```json
{
  "order_id": 1,
  "invoice_number": "INV-2024-001-UPDATED",
  ...
}
```

**Response:**
```json
{
  "success": true,
  "order_id": 1,
  "message": "Invoice 1 updated successfully"
}
```

## 📁 Project Structure

```
invoice-extraction-case-study/
├── backend/
│   ├── api_server.py          # Flask API server
│   ├── utils.py                # Core logic (GroqClient, models, file processing)
│   ├── excel_handler.py        # Excel database operations
│   ├── requirements.txt        # Python dependencies
│   ├── invoice_database.xlsx   # Excel database file (auto-created)
│   ├── .env                    # Environment variables (create this)
│   └── README.md               # Backend documentation
├── frontend/
│   ├── app/
│   │   ├── page.tsx            # Main Next.js page component
│   │   ├── layout.tsx          # Root layout
│   │   └── globals.css         # Global styles with TailwindCSS
│   ├── package.json            # Node.js dependencies
│   ├── tsconfig.json           # TypeScript configuration
│   └── next.config.ts          # Next.js configuration
├── .gitignore                  # Git ignore rules
├── WORKFLOW_DIAGRAM.md         # Detailed workflow diagram
└── README.md                   # This file
```

## 🔄 Workflow

1. **File Upload**: User uploads a PDF or image file through the frontend
2. **File Processing**: Backend processes the file:
   - PDFs are converted to images (JPEG format, 300 DPI)
   - Images are converted to RGB JPEG format for Groq API compatibility
3. **OCR Extraction**: Groq API extracts raw text from the image using LLaMA 4 Scout
4. **Data Extraction**: Groq API extracts structured data in JSON format
5. **Validation**: Pydantic validates the extracted data against the `InvoiceData` model
6. **Display**: Frontend displays:
   - **Before Extraction**: Raw OCR text and raw JSON response
   - **After Extraction**: Structured, editable invoice data
7. **Editing**: User can edit the extracted data
8. **Saving**: Data is sanitized (NaN values removed) and saved to Excel database
9. **Confirmation**: Success toast notification appears

For a visual workflow diagram, see [WORKFLOW_DIAGRAM.md](./WORKFLOW_DIAGRAM.md).

## 🗄️ Database Structure

The Excel database (`invoice_database.xlsx`) contains two sheets:

### SalesOrderHeader
- `OrderID` (Primary Key)
- `InvoiceNumber`
- `OrderDate`
- `InvoiceDate`
- `DueDate`
- `CustomerID`
- `CustomerName`
- `VendorName`
- `BillingAddress`
- `ShippingAddress`
- `SubTotal`
- `Tax`
- `TotalAmount`
- `Currency`
- `Status`
- `CreatedAt`
- `UpdatedAt`

### SalesOrderDetail
- `OrderID` (Foreign Key)
- `LineNumber`
- `ItemDescription`
- `Quantity`
- `UnitPrice`
- `LineTotal`
- `CreatedAt`

## 🐛 Troubleshooting

### Backend Issues

**Error: `GROQ_API_KEY not configured`**
- Solution: Create a `.env` file in the `backend/` directory with your Groq API key

**Error: `Failed to process file: cannot identify image file`**
- Solution: Ensure Poppler is installed (for PDF processing) and the file is a valid PDF/image

**Error: `invalid image data` from Groq API**
- Solution: The system automatically converts images to JPEG format. If this error persists, check that the image file is not corrupted.

### Frontend Issues

**Error: `ERR_CONNECTION_REFUSED`**
- Solution: Ensure the Flask backend is running on `http://localhost:5000`

**Error: `Failed to load resource`**
- Solution: Check that both frontend and backend servers are running

### PDF Processing Issues

**Error: `poppler not found`**
- Solution: Install Poppler utilities (see Prerequisites section)

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [Groq](https://groq.com/) for providing the LLaMA 4 Scout API
- [Next.js](https://nextjs.org/) for the amazing React framework
- [Flask](https://flask.palletsprojects.com/) for the lightweight Python web framework
- [TailwindCSS](https://tailwindcss.com/) for the utility-first CSS framework

## 📧 Support

For issues, questions, or contributions, please open an issue on the [GitHub repository](https://github.com/andre-harris-ai/invoice-extraction-case-study).

---

**Made with ❤️ using LLaMA 4 Scout and modern web technologies**
