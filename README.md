# NexusChatBot
# 🎓 VideoLearn - Chatbot Educativo con IA

Aplicativo web que integra videos educativos con un chatbot inteligente powered by Claude AI.

## ✨ Características

- 📹 Reproductor de video integrado
- 🤖 Chatbot con IA (Claude API)
- 📝 Sistema de transcripción automática
- 🌐 Modo Híbrido: Video + Conocimiento General
- 💾 Historial de conversación persistente
- 📱 Diseño responsivo

## 🚀 Instalación

1. Clona el repositorio:
```bash
git clone https://github.com/TU-USUARIO/videolearn-chatbot.git
cd videolearn-chatbot
```

2. Instala dependencias:
```bash
pip install -r requirements.txt
```

3. Configura tu API key:
```bash
export ANTHROPIC_API_KEY='tu-api-key-aqui'
```

4. Inicia el servidor:
```bash
python3 server.py
```

5. Abre tu navegador en: `http://localhost:8080`

## 📖 Documentación

- [Guía de Inicio Rápido](INICIO-RAPIDO-PYTHON.md)
- [Guía Completa](README-PYTHON.md)
- [Despliegue en Vercel](GUIA-VERCEL.md)
- [Modo Híbrido](MODO-HIBRIDO.md)

## 🛠️ Tecnologías

- Python + Flask
- Claude AI (Anthropic)
- HTML/CSS/JavaScript
- localStorage

## 📄 Licencia

MIT License

## 👤 Autor

[Tu Nombre]
```

4. Clic en **"Commit changes"**

---

### **PASO 5: Crear .gitignore**

1. En tu repositorio, clic en **"Add file"** → **"Create new file"**
2. Nombre del archivo: `.gitignore`
3. Contenido:
```
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
ENV/

# API Keys
.env
*.key

# Videos (muy pesados)
*.mp4
*.mov
*.avi
*.mkv

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo
```

4. Clic en **"Commit new file"**

---

### **PASO 6: ¡Listo! Tu Repositorio Está Público**

URL de tu proyecto:
```
https://github.com/TU-USUARIO/videolearn-chatbot
