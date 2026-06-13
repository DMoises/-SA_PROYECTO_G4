import os
import json
import zlib
import base64

def encode_plantuml(text):
    """Encodes text to a PlantUML compatible URL string."""
    # Compress the text using raw deflate
    compressor = zlib.compressobj(9, zlib.DEFLATED, -zlib.MAX_WBITS)
    compressed = compressor.compress(text.encode('utf-8')) + compressor.flush()
    
    # Standard base64 encode
    b64 = base64.b64encode(compressed).decode('utf-8')
    
    # Translate standard base64 characters to PlantUML base64 characters
    table = str.maketrans(
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",
        "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_"
    )
    return b64.translate(table)

def update_diagrams_json():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    json_path = os.path.join(base_dir, 'json urls de diagramas.json')
    
    new_diagramas = []
    
    for root, dirs, files in os.walk(base_dir):
        for file in files:
            if file == os.path.basename(__file__) or file == 'json urls de diagramas.json':
                continue
                
            file_path = os.path.join(root, file)
            
            # Calculate the relative folder name ("carpeta")
            rel_path = os.path.relpath(root, base_dir)
            carpeta = "" if rel_path == '.' else rel_path
            carpeta = carpeta.replace('\\', '/')
            
            url = ""
            # Only encode for PlantUML if the file has a .puml extension
            if file.endswith('.puml'):
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    encoded = encode_plantuml(content)
                    url = f"https://www.plantuml.com/plantuml/png/{encoded}"
                except Exception as e:
                    print(f"Error reading or encoding {file_path}: {e}")
                    url = ""
            
            new_diagramas.append({
                "carpeta": carpeta,
                "nombre_diagrama": file,
                "url": url
            })

    # Sort the diagrams by folder, then by name
    new_diagramas.sort(key=lambda x: (x['carpeta'], x['nombre_diagrama']))
    
    output_data = {"diagramas": new_diagramas}
    
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=4, ensure_ascii=False)
        
    print(f"Archivo JSON actualizado con {len(new_diagramas)} diagramas, usando URLs de PlantUML.")

if __name__ == '__main__':
    update_diagrams_json()
