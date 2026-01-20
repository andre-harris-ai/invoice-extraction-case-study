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

## 📈 Scaling Strategies

This section discusses how the solution would evolve to handle higher volume, additional document types, and production-scale deployment.

### 1. Backend Architecture Scaling

#### Current Limitations
- Single Flask server handling all requests synchronously
- Excel database not suitable for concurrent writes
- No queue system for async processing
- No horizontal scaling capability

#### Proposed Solutions

**A. Asynchronous Task Queue**
- **Technology**: Redis + Celery or RabbitMQ
- **Implementation**: 
  - Move invoice extraction to background tasks
  - Return job IDs immediately to frontend
  - Frontend polls for completion status
  - Support for batch processing multiple invoices
- **Benefits**: 
  - Non-blocking API responses
  - Better resource utilization
  - Ability to retry failed tasks
  - Priority queue for urgent documents

**B. Horizontal Scaling**
- **Load Balancer**: Nginx or AWS Application Load Balancer
- **Multiple Flask Instances**: Deploy multiple backend instances behind load balancer
- **Container Orchestration**: Docker + Kubernetes or Docker Swarm
- **Auto-scaling**: Scale instances based on queue depth and CPU/memory metrics

**C. API Gateway & Rate Limiting**
- **Technology**: Kong, AWS API Gateway, or Nginx
- **Features**:
  - Rate limiting per user/API key
  - Request throttling
  - API versioning
  - Authentication/authorization middleware

### 2. Database Migration & Scaling

#### Current Limitations
- Excel file cannot handle concurrent writes
- No transaction support
- Limited query capabilities
- Not suitable for production workloads

#### Proposed Solutions

**A. Relational Database (PostgreSQL/MySQL)**
- **Migration Path**:
  1. Create equivalent schema in PostgreSQL
  2. Implement dual-write pattern (write to both Excel and PostgreSQL)
  3. Gradually migrate reads to PostgreSQL
  4. Deprecate Excel after full migration
- **Schema Design**:
  ```sql
  -- SalesOrderHeader table
  CREATE TABLE sales_order_header (
    order_id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(100),
    invoice_date DATE,
    due_date DATE,
    customer_name VARCHAR(255),
    vendor_name VARCHAR(255),
    billing_address TEXT,
    shipping_address TEXT,
    subtotal DECIMAL(10,2),
    tax DECIMAL(10,2),
    total_amount DECIMAL(10,2),
    currency VARCHAR(10),
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_invoice_number (invoice_number),
    INDEX idx_customer_name (customer_name),
    INDEX idx_created_at (created_at)
  );
  
  -- SalesOrderDetail table
  CREATE TABLE sales_order_detail (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES sales_order_header(order_id),
    line_number INTEGER,
    item_description TEXT,
    quantity DECIMAL(10,2),
    unit_price DECIMAL(10,2),
    line_total DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT NOW()
  );
  ```

**B. Caching Layer**
- **Technology**: Redis
- **Use Cases**:
  - Cache frequently accessed invoices
  - Store extraction results temporarily
  - Session management
  - Rate limiting counters
- **Cache Strategy**: 
  - TTL-based expiration (e.g., 1 hour for invoice data)
  - Cache-aside pattern
  - Invalidate on updates

**C. Read Replicas**
- For high-read workloads, implement PostgreSQL read replicas
- Route read queries to replicas, writes to primary
- Use connection pooling (PgBouncer)

### 3. Document Processing Optimization

#### A. Batch Processing
- **Implementation**: Process multiple documents in parallel
- **Technology**: Celery workers with concurrency
- **Workflow**:
  1. User uploads multiple files
  2. Create batch job
  3. Process files in parallel (configurable concurrency)
  4. Return batch results with individual statuses

#### B. Document Type Expansion
- **Current**: PDF, PNG, JPG, JPEG
- **Additional Types**:
  - **Office Documents**: DOCX, XLSX (using `python-docx`, `openpyxl`)
  - **Email Attachments**: Extract from .eml files
  - **Scanned Documents**: Enhanced OCR preprocessing
  - **Multi-page Documents**: Automatic page detection and merging
- **Architecture**:
  ```python
  class DocumentProcessor:
      def process(self, file, file_type):
          processors = {
              'pdf': PDFProcessor(),
              'image': ImageProcessor(),
              'docx': DOCXProcessor(),
              'xlsx': XLSXProcessor(),
              'eml': EmailProcessor()
          }
          return processors[file_type].extract(file)
  ```

#### C. Preprocessing Pipeline
- **Image Enhancement**: 
  - Auto-rotation correction
  - Noise reduction
  - Contrast adjustment
  - Deskewing
- **Technology**: OpenCV, PIL/Pillow
- **Benefits**: Improved OCR accuracy, especially for scanned documents

### 4. AI/ML Model Optimization

#### A. Model Selection & Fine-tuning
- **Current**: Single LLaMA 4 Scout model
- **Proposed**:
  - **Model Routing**: Route documents to specialized models based on:
    - Document language (detected via language detection)
    - Document complexity
    - Document type (invoice, receipt, purchase order)
  - **Fine-tuning**: Fine-tune models on domain-specific invoice data
  - **Ensemble Methods**: Combine multiple model outputs for better accuracy

#### B. Prompt Engineering & Templates
- **Template System**: 
  - Language-specific prompts
  - Industry-specific prompts (retail, healthcare, construction)
  - Document-type-specific prompts
- **A/B Testing**: Test different prompts and measure accuracy
- **Version Control**: Track prompt versions and their performance

#### C. Post-processing & Validation
- **Rule-based Validation**: 
  - Check date formats
  - Validate currency codes
  - Verify mathematical calculations (line totals, tax, grand total)
  - Cross-field validation (e.g., due date after invoice date)
- **Confidence Scores**: Return confidence scores for each extracted field
- **Human-in-the-Loop**: Flag low-confidence extractions for manual review

### 5. Performance Optimization

#### A. Image Processing Optimization
- **Lazy Loading**: Process images on-demand
- **Image Compression**: 
  - Compress before sending to Groq API
  - Maintain quality while reducing size
  - Adaptive quality based on document complexity
- **CDN**: Serve processed images via CDN (CloudFront, Cloudflare)

#### B. API Response Optimization
- **Streaming Responses**: Stream large responses
- **Pagination**: Implement pagination for invoice lists
- **Field Selection**: Allow clients to request specific fields only
- **Compression**: Enable gzip/brotli compression

#### C. Database Query Optimization
- **Indexing**: Strategic indexes on frequently queried columns
- **Query Optimization**: Analyze slow queries, use EXPLAIN
- **Connection Pooling**: Use SQLAlchemy connection pooling
- **Materialized Views**: For complex aggregations

### 6. Monitoring & Observability

#### A. Application Monitoring
- **APM Tools**: 
  - New Relic, Datadog, or Prometheus + Grafana
  - Track request latency, error rates, throughput
- **Logging**: 
  - Structured logging (JSON format)
  - Centralized logging (ELK stack, CloudWatch)
  - Log levels and correlation IDs
- **Tracing**: Distributed tracing (Jaeger, Zipkin) for request flow

#### B. Business Metrics
- **KPIs**:
  - Documents processed per hour/day
  - Extraction accuracy rate
  - Average processing time
  - Error rate by document type
  - API usage by customer
- **Dashboards**: Real-time dashboards for business stakeholders

#### C. Alerting
- **Error Alerts**: Alert on high error rates
- **Performance Alerts**: Alert on slow response times
- **Capacity Alerts**: Alert on queue depth, database connections

### 7. Security & Compliance

#### A. Authentication & Authorization
- **JWT Tokens**: Implement JWT-based authentication
- **Role-Based Access Control (RBAC)**: Different permissions for different users
- **API Keys**: Support API key authentication for programmatic access

#### B. Data Security
- **Encryption**: 
  - Encrypt data at rest (database encryption)
  - Encrypt data in transit (TLS/SSL)
- **PII Handling**: 
  - Mask sensitive data in logs
  - Support data deletion (GDPR compliance)
  - Audit trails for data access

#### C. Compliance
- **GDPR**: Right to deletion, data portability
- **SOC 2**: Security controls and audits
- **HIPAA** (if handling healthcare invoices): Additional security measures

### 8. Deployment & DevOps

#### A. Containerization
- **Docker**: 
  - Multi-stage builds for smaller images
  - Separate containers for frontend, backend, workers
- **Docker Compose**: For local development
- **Kubernetes**: For production orchestration

#### B. CI/CD Pipeline
- **GitHub Actions / GitLab CI**:
  - Automated testing (unit, integration, E2E)
  - Code quality checks (linting, type checking)
  - Security scanning
  - Automated deployments (staging, production)
- **Blue-Green Deployment**: Zero-downtime deployments

#### C. Infrastructure as Code
- **Terraform / CloudFormation**: Define infrastructure in code
- **Ansible**: Configuration management
- **Benefits**: Reproducible, version-controlled infrastructure

### 9. Cost Optimization

#### A. API Cost Management
- **Caching**: Cache extraction results to avoid redundant API calls
- **Batch Optimization**: Group similar documents for batch processing
- **Model Selection**: Use cheaper models for simple documents
- **Rate Limiting**: Prevent unnecessary API calls

#### B. Infrastructure Costs
- **Auto-scaling**: Scale down during low-traffic periods
- **Reserved Instances**: For predictable workloads
- **Spot Instances**: For non-critical batch processing
- **CDN**: Reduce bandwidth costs

### 10. User Experience Enhancements

#### A. Real-time Updates
- **WebSockets**: Real-time progress updates instead of polling
- **Server-Sent Events (SSE)**: Alternative to WebSockets for one-way updates

#### B. Advanced Features
- **Document Comparison**: Compare multiple invoices
- **Export Options**: Export to CSV, JSON, XML
- **Bulk Operations**: Bulk edit, bulk delete
- **Search & Filter**: Advanced search with filters
- **Analytics**: Invoice analytics dashboard

### Implementation Roadmap

**Phase 1 (Weeks 1-2): Foundation**
- Migrate to PostgreSQL
- Implement Redis caching
- Set up basic monitoring

**Phase 2 (Weeks 3-4): Async Processing**
- Implement Celery task queue
- Background job processing
- Job status API

**Phase 3 (Weeks 5-6): Scaling**
- Horizontal scaling setup
- Load balancer configuration
- Auto-scaling policies

**Phase 4 (Weeks 7-8): Advanced Features**
- Additional document types
- Enhanced preprocessing
- Model optimization

**Phase 5 (Ongoing): Optimization**
- Performance tuning
- Cost optimization
- Continuous monitoring and improvement

### Expected Improvements

- **Throughput**: From ~10 documents/minute to 1000+ documents/minute
- **Latency**: From 5-10 seconds to <2 seconds (with caching)
- **Availability**: From single point of failure to 99.9% uptime
- **Scalability**: From single server to auto-scaling cluster
- **Cost Efficiency**: 50-70% reduction in API costs through caching and optimization

## 📧 Support

For issues, questions, or contributions, please open an issue on the [GitHub repository](https://github.com/andre-harris-ai/invoice-extraction-case-study).

---

**Made with ❤️ using LLaMA 4 Scout and modern web technologies**
