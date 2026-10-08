FROM python:3.10-slim

# Set working directory
WORKDIR /code

# Copy requirements and install
COPY requirements.txt /code/requirements.txt
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# Copy the entire app
COPY . /code

# Hugging Face Spaces runs on port 7860 by default
EXPOSE 7860

# We must give full read/write permissions so SQLite can create and edit the database file
RUN chmod -R 777 /code

# Start the FastAPI application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]
