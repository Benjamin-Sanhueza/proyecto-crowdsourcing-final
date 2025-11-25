# 1. Usamos una imagen de Python ligera y oficial
FROM python:3.9-slim

# 2. Creamos una carpeta de trabajo dentro del servidor
WORKDIR /app

# 3. Instalamos herramientas básicas del sistema (necesarias para compilar algunas librerías de IA)
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# 4. Copiamos el archivo de requisitos primero (para aprovechar la caché de Docker)
COPY requirements.txt .

# 5. Instalamos las librerías (FastAPI, scikit-learn, RapidFuzz, etc.)
RUN pip install --no-cache-dir -r requirements.txt

# 6. Copiamos TODOS tus archivos (analyzer.py, patterns_es.txt, main.py, etc.) al servidor
COPY . .

# 7. Avisamos que el contenedor usará el puerto 5000
EXPOSE 5000

# 8. El comando para encender el servidor cuando arranque
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5000"]