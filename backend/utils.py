import json
import base64
import requests
from PIL import Image
from io import BytesIO
from typing import List, Optional, Tuple
from pydantic import BaseModel, Field
from groq import Groq
from pdf2image import convert_from_bytes
from pypdf import PdfReader


# ---------------------------
# Data Models
# ---------------------------

class LineItem(BaseModel):
    description: Optional[str] = Field(
        None, description="A brief description of the product or service provided."
    )
    quantity: Optional[float] = Field(
        None, description="The number of units of the product or service."
    )
    unit_price: Optional[float] = Field(
        None, description="The price per unit of the product or service."
    )
    total_price: Optional[float] = Field(
        None, description="The total price for the line item, calculated as quantity × unit price."
    )


class InvoiceData(BaseModel):
    invoice_number: Optional[str] = Field(
        None, description="The unique identifier or reference number of the invoice."
    )
    invoice_date: Optional[str] = Field(
        None, description="The date when the invoice was issued."
    )
    due_date: Optional[str] = Field(
        None, description="The payment due date."
    )
    billing_address: Optional[str] = Field(
        None, description="The address of the customer who is being billed."
    )
    shipping_address: Optional[str] = Field(
        None, description="The address where the goods/services are to be delivered."
    )
    vendor_name: Optional[str] = Field(
        None, description="The name of the company or individual issuing the invoice."
    )
    customer_name: Optional[str] = Field(
        None, description="The name of the person or organization being billed."
    )
    line_items: Optional[List[LineItem]] = Field(
        None, description="A list of items described in the invoice."
    )
    subtotal: Optional[float] = Field(
        None, description="The sum of all line item totals before taxes or additional fees."
    )
    tax: Optional[float] = Field(
        None, description="The tax amount applied to the subtotal."
    )
    total_amount: Optional[float] = Field(
        None, description="The final total to be paid including subtotal and taxes."
    )
    currency: Optional[str] = Field(
        None, description="The currency in which the invoice is issued (e.g., USD, EUR)."
    )


# -----------------------------------
# LLaMA Client Wrapper using Groq Api
# -----------------------------------

class GroqClient:
    def __init__(self, api_key):
        self.client = Groq(api_key=api_key)
    
    def extract_raw_text(self, image_content, model="meta-llama/llama-4-scout-17b-16e-instruct"):
        """Extract raw text from image using OCR"""
        ocr_prompt = """
        You are an OCR system. Extract ALL text from this invoice image exactly as it appears.
        Return the raw text content in a simple text format, preserving the layout and structure as much as possible.
        Do not interpret or structure the data, just extract the raw text.
        """
        
        # Ensure image_content is properly formatted
        if isinstance(image_content, dict) and "type" in image_content:
            content_item = image_content
        else:
            content_item = {
                "type": "image_url",
                "image_url": {"url": image_content} if isinstance(image_content, str) else image_content
            }
        
        messages = [{
            "role": "user",
            "content": [
                {"type": "text", "text": ocr_prompt},
                content_item
            ]
        }]
        
        try:
            response = self.client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=0.1,
                max_completion_tokens=2048,
                stream=False,
            )
            
            return response.choices[0].message.content
        except Exception as e:
            raise ValueError(f"Groq API error during OCR: {str(e)}")
    
    def extract_invoice_data(self, prompt, image_content, model="meta-llama/llama-4-scout-17b-16e-instruct"):
        # Ensure image_content is properly formatted
        if isinstance(image_content, dict) and "type" in image_content:
            content_item = image_content
        else:
            content_item = {
                "type": "image_url",
                "image_url": {"url": image_content} if isinstance(image_content, str) else image_content
            }
        
        messages = [{
            "role": "user",
            "content": [
                {"type": "text", "text": prompt},
                content_item
            ]
        }]
        
        try:
            response = self.client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=0.4,
                max_completion_tokens=1024,
                stream=False,
                response_format={"type": "json_object"},
            )
            
            raw_json = response.choices[0].message.content
            parsed_data = json.loads(raw_json)
            
            return parsed_data, raw_json
        except Exception as e:
            raise ValueError(f"Groq API error during extraction: {str(e)}")


# ---------------------------
# Image Handling Utilities
# ---------------------------

def process_pdf_upload(uploaded_file, page_number: int = 0) -> Tuple[Optional[bytes], Optional[str], int]:
    """
    Process PDF file and convert specified page to image.
    Returns: (image_bytes, mime_type, total_pages)
    """
    if not uploaded_file:
        raise ValueError("No file provided")
    
    try:
        # Ensure file pointer is at the beginning
        try:
            uploaded_file.seek(0)
        except:
            pass  # Some file objects don't support seek
        
        pdf_bytes = uploaded_file.read()
        
        if not pdf_bytes or len(pdf_bytes) == 0:
            raise ValueError("PDF file is empty or could not be read")
        
        # Get total number of pages
        pdf_reader = PdfReader(BytesIO(pdf_bytes))
        total_pages = len(pdf_reader.pages)
        
        if total_pages == 0:
            raise ValueError("PDF has no pages")
        
        if page_number < 0 or page_number >= total_pages:
            raise ValueError(f"Page number {page_number + 1} is out of range. PDF has {total_pages} page(s).")
        
        # Convert PDF page to image
        images = convert_from_bytes(pdf_bytes, first_page=page_number + 1, last_page=page_number + 1, dpi=300)
        
        if not images or len(images) == 0:
            raise ValueError(f"Failed to convert page {page_number + 1} to image.")
        
        # Convert PIL Image to RGB format and then to JPEG for better compatibility
        img = images[0]
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Save as JPEG to ensure compatibility with Groq API
        img_byte_arr = BytesIO()
        img.save(img_byte_arr, format='JPEG', quality=95)
        img_byte_arr.seek(0)
        image_bytes = img_byte_arr.getvalue()
        
        if not image_bytes or len(image_bytes) == 0:
            raise ValueError("Failed to convert image to bytes")
        
        return image_bytes, "image/jpeg", total_pages
    except Exception as e:
        raise ValueError(f"Error processing PDF: {str(e)}")

def process_image_upload(uploaded_file):
    if not uploaded_file:
        return None, None
    try:
        image_bytes = uploaded_file.read()
        
        # Validate that it's actually an image by trying to open it with PIL
        try:
            img = Image.open(BytesIO(image_bytes))
            # Convert to RGB if necessary (handles RGBA, P, etc.)
            if img.mode in ('RGBA', 'LA', 'P'):
                rgb_img = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'P':
                    img = img.convert('RGBA')
                rgb_img.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
                img = rgb_img
            elif img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Save as JPEG to ensure compatibility
            output = BytesIO()
            img.save(output, format='JPEG', quality=95)
            image_bytes = output.getvalue()
            mime_type = "image/jpeg"
        except Exception as img_error:
            # If PIL can't process it, try to use original bytes
            suffix = uploaded_file.name.split(".")[-1].lower() if uploaded_file.name else "jpg"
            mime_type = "image/jpeg" if suffix in ("jpg", "jpeg") else "image/png"
        
        return image_bytes, mime_type
    except Exception as e:
        raise ValueError(f"Error processing image: {str(e)}")

def process_file_upload(uploaded_file, page_number: int = 0) -> Tuple[Optional[bytes], Optional[str], Optional[int]]:
    """
    Process uploaded file (image or PDF) and return image bytes, mime type, and total pages (for PDFs).
    Returns: (image_bytes, mime_type, total_pages)
    """
    if not uploaded_file:
        raise ValueError("No file provided")
    
    # Get file extension
    filename = uploaded_file.filename or ""
    if not filename:
        raise ValueError("File has no filename")
    
    file_extension = filename.split(".")[-1].lower() if "." in filename else ""
    
    if not file_extension:
        raise ValueError("Cannot determine file type from filename")
    
    # Ensure file pointer is at the beginning
    try:
        uploaded_file.seek(0)
    except:
        pass  # Some file objects don't support seek
    
    if file_extension == "pdf":
        image_bytes, mime_type, total_pages = process_pdf_upload(uploaded_file, page_number)
        return image_bytes, mime_type, total_pages
    else:
        image_bytes, mime_type = process_image_upload(uploaded_file)
        return image_bytes, mime_type, None

def process_image_url(image_url):
    if not image_url:
        return None
    try:
        response = requests.get(image_url)
        response.raise_for_status()
        return response.content
    except Exception as e:
        raise ValueError(f"Error loading image from URL: {str(e)}")

def display_image_preview(image_bytes):
    """Convert image bytes to base64 for frontend display"""
    try:
        base64_image = base64.b64encode(image_bytes).decode("utf-8")
        return base64_image
    except Exception as e:
        raise ValueError(f"Error processing image: {str(e)}")
