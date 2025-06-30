FROM python:3.12

WORKDIR /app

# Copy the code directory contents to /app
COPY code/ /app/

# Install Python dependencies
RUN pip3 config set global.index-url https://mirrors.cloud.tencent.com/pypi/simple && \
    pip3 install -r requirements.txt
# Expose the port the app runs on
EXPOSE 8000

# Run the application
CMD ["python3", "manage.py", "runserver", "0.0.0.0:8000"]