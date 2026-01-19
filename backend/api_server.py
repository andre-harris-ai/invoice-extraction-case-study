from flask import Flask, request, jsonify, Response, stream_with_context
from flask_cors import CORS
import json
import base64
import os
import time
from io import BytesIO
from dotenv import load_dotenv
from utils import InvoiceData, GroqClient, process_file_upload, process_image_url
from excel_handler import ExcelDatabase

app = Flask(__name__)
CORS(app)  # Enable CORS for Next.js frontend

# Load environment variables
load_dotenv()
groq_api_key = os.getenv("GROQ_API_KEY")

if not groq_api_key:
    print("WARNING: GROQ_API_KEY not found in environment variables!")

# Initialize Excel database
excel_db = ExcelDatabase()

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok", "api_key_configured": bool(groq_api_key)})

@app.route('/api/extract', methods=['POST'])
def extract_invoice():
    try:
        if not groq_api_key:
            return jsonify({"error": "GROQ_API_KEY not configured"}), 500
        
        # Get input method - check if it's JSON or form data
        if request.is_json:
            data = request.json
            input_method = data.get('input_method', 'url')
        else:
            # Form data (file upload)
            input_method = request.form.get('input_method', 'upload')
            data = request.form
        
        image_bytes = None
        mime_type = "image/jpeg"
        image_content = None
        
        if input_method == 'upload':
            # Handle file upload
            if 'file' not in request.files:
                return jsonify({"error": "No file provided"}), 400
            
            file = request.files['file']
            
            # Check if file is empty
            if file.filename == '':
                return jsonify({"error": "No file selected"}), 400
            
            # Get page number, default to 0
            try:
                page_number = int(request.form.get('page_number', 0))
            except (ValueError, TypeError):
                page_number = 0
            
            # Process the file
            try:
                # Reset file pointer in case it was read before
                file.seek(0)
                image_bytes, mime_type, total_pages = process_file_upload(file, page_number)
            except Exception as e:
                import traceback
                error_details = traceback.format_exc()
                print(f"Error processing file: {str(e)}")
                print(f"Traceback: {error_details}")
                return jsonify({"error": f"Failed to process file: {str(e)}"}), 400
            
            if not image_bytes:
                return jsonify({"error": "Failed to process file: No image data generated"}), 400
            
            # Validate image bytes - just check if we have data
            if len(image_bytes) == 0:
                return jsonify({"error": "Invalid image: Empty image data"}), 400
            
            # Basic validation - check if bytes look like an image (have minimum size)
            if len(image_bytes) < 100:  # Images should be at least 100 bytes
                return jsonify({"error": "Invalid image: File too small to be a valid image"}), 400
            
            # Ensure image is in JPEG format for Groq API compatibility
            # Check if bytes are already JPEG (from PDF conversion or already processed)
            is_already_jpeg = len(image_bytes) >= 2 and image_bytes[:2] == b'\xff\xd8'
            
            if not is_already_jpeg:
                # Need to convert to JPEG
                try:
                    from PIL import Image
                    
                    # Create a fresh BytesIO object from the image bytes
                    img_stream = BytesIO(image_bytes)
                    img = Image.open(img_stream)
                    img.load()  # Force load to ensure it's readable
                    
                    # Convert to RGB if necessary
                    if img.mode != 'RGB':
                        if img.mode == 'RGBA':
                            rgb_img = Image.new('RGB', img.size, (255, 255, 255))
                            if len(img.split()) >= 4:
                                rgb_img.paste(img, mask=img.split()[3])  # Use alpha channel as mask
                            else:
                                rgb_img.paste(img)
                            img.close()
                            img = rgb_img
                        elif img.mode == 'P':
                            img = img.convert('RGBA')
                            rgb_img = Image.new('RGB', img.size, (255, 255, 255))
                            if len(img.split()) >= 4:
                                rgb_img.paste(img, mask=img.split()[3])
                            else:
                                rgb_img.paste(img)
                            img.close()
                            img = rgb_img
                        else:
                            img = img.convert('RGB')
                    
                    # Resize if image is too large (Groq has size limits)
                    max_size = 4096  # Maximum dimension
                    if img.width > max_size or img.height > max_size:
                        img.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
                    
                    # Save as JPEG to ensure compatibility
                    output = BytesIO()
                    img.save(output, format='JPEG', quality=90, optimize=True)
                    image_bytes = output.getvalue()
                    mime_type = "image/jpeg"
                    
                    # Validate the JPEG bytes
                    if len(image_bytes) < 100:
                        raise ValueError("Converted image is too small")
                    
                    # Verify it's a valid JPEG by checking magic bytes
                    if image_bytes[:2] != b'\xff\xd8':
                        raise ValueError("Image is not a valid JPEG after conversion")
                    
                    img.close()
                    output.close()
                    img_stream.close()
                except Exception as e:
                    return jsonify({"error": f"Failed to process image: {str(e)}"}), 400
            else:
                # Already JPEG, just ensure mime_type is set correctly
                mime_type = "image/jpeg"
            
            # Convert to base64
            try:
                base64_image = base64.b64encode(image_bytes).decode("utf-8")
                if not base64_image:
                    return jsonify({"error": "Failed to encode image to base64"}), 400
                
                # Validate base64 string
                if len(base64_image) < 100:
                    return jsonify({"error": "Base64 encoded image too small"}), 400
                
                # Check base64 is valid (basic check)
                try:
                    base64.b64decode(base64_image, validate=True)
                except Exception:
                    return jsonify({"error": "Invalid base64 encoding"}), 400
            except Exception as e:
                return jsonify({"error": f"Failed to encode image: {str(e)}"}), 400
            
            # Create data URL - ensure mime type is image/jpeg for Groq compatibility
            # Groq expects: data:image/jpeg;base64,{base64_string}
            data_url = f"data:image/jpeg;base64,{base64_image}"
            
            image_content = {
                "type": "image_url",
                "image_url": {"url": data_url}
            }
            
        elif input_method == 'url':
            # Handle image URL
            image_url = data.get('image_url')
            if not image_url:
                return jsonify({"error": "No image URL provided"}), 400
            
            image_bytes = process_image_url(image_url)
            mime_type = "image/jpeg"
            
            image_content = {
                "type": "image_url",
                "image_url": {"url": image_url}
            }
        else:
            return jsonify({"error": "Invalid input_method. Use 'upload' or 'url'"}), 400
        
        # Extract invoice data with progress tracking
        groq_client = GroqClient(api_key=groq_api_key)
        
        # First, extract raw OCR text
        raw_ocr_text = groq_client.extract_raw_text(image_content)
        
        # Then, extract structured data
        prompt = f"""
        You are an intelligent OCR extraction agent capable of understanding and processing documents in multiple languages.
        Given an image of an invoice (which may have been converted from a PDF), extract all relevant information in structured JSON format.
        The JSON object must use the schema: {json.dumps(InvoiceData.model_json_schema(), indent=2)}
        If any field cannot be found in the invoice, return it as null. Return the final result strictly in JSON format.
        """
        
        extracted_data, raw_json_response = groq_client.extract_invoice_data(prompt, image_content)
        invoice = InvoiceData(**extracted_data)
        
        return jsonify({
            "success": True,
            "data": invoice.dict(),
            "raw_ocr_text": raw_ocr_text,
            "raw_json_response": raw_json_response
        })
    
    except Exception as e:
        return jsonify({"error": f"Failed to parse invoice: {str(e)}"}), 500

@app.route('/api/pdf-info', methods=['POST'])
def get_pdf_info():
    """Get PDF page count for page selection"""
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400
        
        file = request.files['file']
        from pypdf import PdfReader
        
        pdf_bytes = file.read()
        pdf_reader = PdfReader(BytesIO(pdf_bytes))
        total_pages = len(pdf_reader.pages)
        
        return jsonify({
            "success": True,
            "total_pages": total_pages
        })
    
    except Exception as e:
        return jsonify({"error": f"Failed to read PDF: {str(e)}"}), 500

def sanitize_data(data):
    """Recursively sanitize data to replace NaN with None"""
    import math
    if isinstance(data, dict):
        return {k: sanitize_data(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [sanitize_data(item) for item in data]
    elif isinstance(data, float):
        if math.isnan(data) or not math.isfinite(data):
            return None
        return data
    else:
        return data

@app.route('/api/save-invoice', methods=['POST'])
def save_invoice():
    """Save invoice data to Excel database"""
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        # Sanitize data to remove NaN values
        sanitized_data = sanitize_data(data)
        
        result = excel_db.save_invoice(sanitized_data)
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
    except Exception as e:
        return jsonify({"error": f"Failed to save invoice: {str(e)}"}), 500

@app.route('/api/update-invoice', methods=['POST'])
def update_invoice():
    """Update existing invoice in Excel database"""
    try:
        data = request.json
        if not data or 'order_id' not in data:
            return jsonify({"error": "OrderID and data required"}), 400
        
        order_id = data['order_id']
        invoice_data = {k: v for k, v in data.items() if k != 'order_id'}
        
        result = excel_db.update_invoice(order_id, invoice_data)
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
    except Exception as e:
        return jsonify({"error": f"Failed to update invoice: {str(e)}"}), 500

@app.route('/api/get-invoices', methods=['GET'])
def get_invoices():
    """Get all invoices from database"""
    try:
        result = excel_db.get_all_invoices()
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": f"Failed to get invoices: {str(e)}"}), 500

@app.route('/api/get-invoice/<int:order_id>', methods=['GET'])
def get_invoice(order_id):
    """Get specific invoice by OrderID"""
    try:
        result = excel_db.get_invoice_by_id(order_id)
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 404
    except Exception as e:
        return jsonify({"error": f"Failed to get invoice: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
