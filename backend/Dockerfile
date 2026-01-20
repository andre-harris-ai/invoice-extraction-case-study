# Use the official lightweight image
FROM python:3.10-slim

# Install system dependencies required for PDF processing
RUN apt-get update && apt-get install -y \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory
WORKDIR /app

# Copy the requirements file and install dependencies
COPY requirements.txt /app
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code
COPY . /app

# Create Results directory if it doesn't exist
RUN mkdir -p /app/Results

# Expose the port Flask API runs on
EXPOSE 5000

# Set environment variables
ENV FLASK_APP=api_server.py
ENV FLASK_ENV=production

# Run the Flask API server
CMD ["python", "api_server.py"]
