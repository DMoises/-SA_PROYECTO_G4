#!/bin/bash

# Script para generar las imágenes PNG de todos los mockups (.excalidraw) en el directorio.
# Utiliza la herramienta de Node.js "@swiftlysingh/excalidraw-cli".

echo "Iniciando la conversión de archivos .excalidraw a imágenes .png..."

# Verificar que existen archivos .excalidraw
archivos=(*.excalidraw)

if [ ! -e "${archivos[0]}" ]; then
  echo "No se encontraron archivos .excalidraw en este directorio."
  exit 1
fi

total=${#archivos[@]}
actual=1

for file in "${archivos[@]}"; do
  echo "[$actual/$total] Procesando: $file"
  # Ejecutar npx para hacer la conversión, el formato predeterminado es PNG
  npx -y @swiftlysingh/excalidraw-cli convert "$file" --format png
  
  if [ $? -eq 0 ]; then
    echo "  ✔ Imagen generada exitosamente."
  else
    echo "  ❌ Error al generar imagen para $file."
  fi
  
  ((actual++))
done

echo "¡Todas las imágenes han sido generadas!"
