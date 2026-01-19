import streamlit as st
import json
import base64
import os
from io import BytesIO
from utils import InvoiceData, GroqClient
from utils import (
    process_file_upload,
    process_image_url,
    display_image_preview,
    setup_page,
    select_input_method,
    show_extraction_button,
    display_results,
    display_error,
)

def main():
    # Get environment from environment variable (defaults to 'local')
    # Set STREAMLIT_ENVIRONMENT=cloud for cloud deployment
    environment = os.getenv('STREAMLIT_ENVIRONMENT', 'local')
    
    groq_api_key = None
    
    if environment == 'cloud':
        # Try to access secret values from Streamlit secrets
        try:
            groq_api_key = st.secrets["GROQ_API_KEY"]
        except (KeyError, FileNotFoundError, AttributeError):
            # If secrets not found, fall back to local mode
            from dotenv import load_dotenv
            load_dotenv()
            groq_api_key = os.getenv("GROQ_API_KEY")
    else:
        # Local mode: load from .env file
        from dotenv import load_dotenv
        load_dotenv()
        groq_api_key = os.getenv("GROQ_API_KEY")
    
    # Validate API key exists
    if not groq_api_key:
        st.error("❌ GROQ_API_KEY not found! Please set it in your .env file or Streamlit secrets.")
        st.stop()    

    # Store secrets in session_state
    #groqcloud
    if "groq_api_key" not in st.session_state:
        st.session_state.groq_api_key = groq_api_key

    setup_page()
    input_method = select_input_method()
    
    image_bytes = None
    image_url = None
    mime_type = "image/jpeg"
    total_pages = None
    selected_page = 0
    
    if input_method == "Upload Image 📤":
        uploaded_file = st.file_uploader(
            "Upload an invoice file (Image or PDF)", 
            type=["png", "jpg", "jpeg", "pdf"]
        )
        
        if uploaded_file:
            file_extension = uploaded_file.name.split(".")[-1].lower()
            
            # Handle PDF files with page selection
            if file_extension == "pdf":
                # Get total pages first to show page selector
                try:
                    from pypdf import PdfReader
                    pdf_bytes = uploaded_file.read()
                    pdf_reader = PdfReader(BytesIO(pdf_bytes))
                    total_pages = len(pdf_reader.pages)
                    uploaded_file.seek(0)  # Reset file pointer
                    
                    if total_pages > 1:
                        selected_page = st.selectbox(
                            f"Select page to process (PDF has {total_pages} page(s)):",
                            options=range(total_pages),
                            format_func=lambda x: f"Page {x + 1}",
                            key="pdf_page_selector"
                        )
                    else:
                        selected_page = 0
                    
                    # Process the selected PDF page
                    image_bytes, mime_type, _ = process_file_upload(uploaded_file, selected_page)
                except Exception as e:
                    display_error(f"Error processing PDF: {str(e)}")
                    image_bytes = None
            else:
                # Process image files
                image_bytes, mime_type, _ = process_file_upload(uploaded_file)
    else:
        image_url = st.text_input("Enter image URL:")
        if image_url:
            try:
                image_bytes = process_image_url(image_url)
                mime_type = "image/jpeg"  # Default for URL images
            except ValueError as e:
                display_error(str(e))
    
    if image_bytes:
        col1, col2 = st.columns([1, 2])
        with col1:
            st.subheader("Invoice Image")
            display_image_preview(image_bytes)
        
        with col2:
            st.subheader("Extracted Invoice Fields")
            if show_extraction_button():
                with st.spinner("Extracting data using LLaMA 4..."):
                    try:
                        groq_client = GroqClient(api_key=st.session_state.groq_api_key)
                        
                        prompt = f"""
                        You are an intelligent OCR extraction agent capable of understanding and processing documents in multiple languages.
                        Given an image of an invoice (which may have been converted from a PDF), extract all relevant information in structured JSON format.
                        The JSON object must use the schema: {json.dumps(InvoiceData.model_json_schema(), indent=2)}
                        If any field cannot be found in the invoice, return it as null. Return the final result strictly in JSON format.
                        """
                        
                        if input_method == "Upload Image 📤":
                            base64_image = base64.b64encode(image_bytes).decode("utf-8")
                            image_content = {
                                "type": "image_url",
                                "image_url": {"url": f"data:{mime_type};base64,{base64_image}"}
                            }
                        else:
                            image_content = {
                                "type": "image_url",
                                "image_url": {"url": image_url}
                            }
                        
                        extracted_data = groq_client.extract_invoice_data(prompt, image_content)
                        invoice = InvoiceData(**extracted_data)
                        display_results(invoice)
                    
                    except Exception as e:
                        display_error(f"Failed to parse invoice: {str(e)}")

# Streamlit runs the script directly, so we call main() at module level
main()
