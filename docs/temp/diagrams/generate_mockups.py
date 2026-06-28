import json
import uuid

elements = []

def add_rect(x, y, w, h, bg="transparent", stroke="#000000", fill="hachure"):
    elements.append({
        "id": str(uuid.uuid4()),
        "type": "rectangle",
        "x": x, "y": y, "width": w, "height": h,
        "strokeColor": stroke, "backgroundColor": bg, "fillStyle": fill,
        "strokeWidth": 1, "strokeStyle": "solid", "roughness": 1, "opacity": 100,
        "groupIds": [], "roundness": {"type": 3},
        "seed": 12345, "version": 1, "versionNonce": 12345, "isDeleted": False,
        "boundElements": None
    })

def add_text(x, y, text, fontSize=20, align="left", color="#000000"):
    elements.append({
        "id": str(uuid.uuid4()),
        "type": "text",
        "x": x, "y": y,
        "width": len(text) * fontSize * 0.6, "height": fontSize * 1.2,
        "strokeColor": color, "backgroundColor": "transparent", "fillStyle": "hachure",
        "strokeWidth": 1, "strokeStyle": "solid", "roughness": 1, "opacity": 100,
        "groupIds": [], "roundness": None,
        "seed": 12345, "version": 1, "versionNonce": 12345, "isDeleted": False,
        "boundElements": None,
        "text": text, "fontSize": fontSize, "fontFamily": 1, "textAlign": align,
        "verticalAlign": "top", "baseline": y + fontSize
    })

# Screen 1: Dashboard / Catálogo
add_rect(0, 0, 800, 600) # Container
add_rect(0, 0, 200, 600, stroke="#cccccc") # Sidebar
add_text(20, 20, "Quetxal TV Admin", 24)
add_text(20, 80, ">> Catálogo")
add_text(20, 120, "   Reportes / Logs")

add_text(220, 20, "Gestión de Catálogo", 28)
add_rect(220, 80, 250, 40, stroke="#000000", bg="#e0e0e0", fill="solid") # Button
add_text(230, 90, "+ Agregar Contenido", 16)

add_rect(220, 140, 550, 400) # Table
add_rect(220, 140, 550, 40, stroke="#000000", bg="#cccccc", fill="solid") # Table header
add_text(230, 150, "ID   | Título               | Tipo    | Estreno      | Acciones", 16)
add_text(230, 190, "1    | El Padrino           | Peli    | 2026-07-01   | [Editar] [Borrar]", 16)
add_text(230, 230, "2    | Breaking Bad         | Serie   | 2026-07-10   | [Editar] [Borrar]", 16)

# Screen 2: Formulario Contenido
add_rect(900, 0, 800, 600) # Container
add_text(920, 20, "Formulario de Contenido (CRUD / Programación)", 28)

add_text(920, 80, "Título:")
add_rect(920, 110, 400, 40, stroke="#cccccc")

add_text(920, 160, "Tipo (Película/Serie):")
add_rect(920, 190, 400, 40, stroke="#cccccc")

add_text(920, 240, "Archivo Video (Bucket GCS URL):")
add_rect(920, 270, 400, 40, stroke="#cccccc")

add_text(920, 320, "Portada Imagen (Bucket GCS URL):")
add_rect(920, 350, 400, 40, stroke="#cccccc")

add_text(920, 400, "Fecha de Estreno (Calendarización):")
add_rect(920, 430, 400, 40, stroke="#cccccc")

add_rect(920, 500, 120, 40, bg="#4caf50", fill="solid")
add_text(940, 510, "Guardar", 16, color="#ffffff")
add_rect(1060, 500, 120, 40, bg="#f44336", fill="solid")
add_text(1080, 510, "Cancelar", 16, color="#ffffff")

# Screen 3: Auditoría y Reportes
add_rect(0, 700, 800, 600) # Container
add_rect(0, 700, 200, 600, stroke="#cccccc") # Sidebar
add_text(20, 720, "Quetxal TV Admin", 24)
add_text(20, 780, "   Catálogo")
add_text(20, 820, ">> Reportes / Logs")

add_text(220, 720, "Auditoría Transaccional (Logs)", 28)

add_rect(220, 780, 150, 40, bg="#2196f3", fill="solid")
add_text(230, 790, "Descargar CSV", 16, color="#ffffff")
add_rect(390, 780, 150, 40, bg="#ff9800", fill="solid")
add_text(400, 790, "Descargar PDF", 16, color="#ffffff")

add_rect(220, 840, 550, 340) # Table
add_rect(220, 840, 550, 40, bg="#cccccc", fill="solid", stroke="#000000") # Table header
add_text(230, 850, "User | Timestamp        | Tabla  | Acción | Detalles (Ant -> Nuevo)", 14)
add_text(230, 890, "adm  | 2026-06-18 10:00 | Movies | UPDATE | Status: Draft -> Published", 14)
add_text(230, 930, "adm  | 2026-06-18 10:05 | Movies | INSERT | Nuevo titulo agregado", 14)

# Screen 4: Reproductor de Video
add_rect(900, 700, 800, 600) # Container
add_text(920, 720, "Quetxal TV - Vista Usuario (Reproductor GCS)", 28)

add_rect(920, 780, 760, 420, bg="#222222", fill="solid") # Video Player
add_text(1150, 950, "► REPRODUCIENDO DESDE GCS", 20, align="center", color="#ffffff")

add_rect(940, 1140, 720, 10, bg="#cccccc", fill="solid") # Progress Bar
add_rect(940, 1140, 200, 10, bg="#ff0000", fill="solid") # Progress Fill
add_text(940, 1160, "▶ ||   [■] Fullscreen", 16, color="#ffffff")
add_text(1450, 1160, "Duración: 00:25:10 / 01:50:00", 16, color="#ffffff")

excalidraw_data = {
    "type": "excalidraw",
    "version": 2,
    "source": "https://excalidraw.com",
    "elements": elements,
    "appState": {
        "gridSize": None,
        "viewBackgroundColor": "#ffffff"
    },
    "files": {}
}

with open('/home/voupi/Docs Local/GIT/-SA_PROYECTO_G4/docs/temp/diagrams/mockups_ui_quetxal_tv.excalidraw', 'w', encoding='utf-8') as f:
    json.dump(excalidraw_data, f, indent=2, ensure_ascii=False)
