#!/usr/bin/env python3
"""
VideoLearn - Servidor Backend en Python con Flask
Servidor web que sirve el frontend y maneja las peticiones a la API de Claude
"""

import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from anthropic import Anthropic
import json

# ========== CONFIGURACIÓN ==========
# ⚠️ IMPORTANTE: Pega tu API key aquí o usa variable de entorno
ANTHROPIC_API_KEY = os.environ.get('ANTHROPIC_API_KEY', 'TU_API_KEY_AQUI')

# Cargar transcripción desde archivo
TRANSCRIPCION = ""
try:
    # Intentar cargar desde transcripcion.py
    with open('transcripcion.py', 'r', encoding='utf-8') as f:
        content = f.read()
        # Extraer el texto entre las comillas triples
        if '"""' in content:
            parts = content.split('"""')
            if len(parts) >= 3:
                TRANSCRIPCION = parts[1].strip()
                print(f"✅ Transcripción cargada: {len(TRANSCRIPCION)} caracteres")
except FileNotFoundError:
    print("⚠️ Archivo transcripcion.py no encontrado. Usando transcripción vacía.")
except Exception as e:
    print(f"⚠️ Error al cargar transcripción: {e}")

# Configuración de la aplicación
app = Flask(__name__, static_folder='.')
CORS(app)  # Permite peticiones desde cualquier origen

# Inicializar cliente de Anthropic
try:
    client = Anthropic(api_key=ANTHROPIC_API_KEY)
    print("✅ Cliente de Anthropic inicializado correctamente")
except Exception as e:
    print(f"⚠️ Error al inicializar cliente: {e}")
    client = None


# ========== RUTAS DEL SERVIDOR ==========

@app.route('/')
def serve_index():
    """Sirve la página principal"""
    return send_from_directory('.', 'index.html')


@app.route('/<path:path>')
def serve_static(path):
    """Sirve archivos estáticos (CSS, JS, imágenes, videos)"""
    return send_from_directory('.', path)


@app.route('/api/chat', methods=['POST'])
def chat():
    """
    Endpoint principal para el chatbot
    Recibe mensajes del frontend y los envía a Claude API
    """
    try:
        # Validar API key
        if ANTHROPIC_API_KEY == 'TU_API_KEY_AQUI':
            return jsonify({
                'error': 'Por favor configura tu API key en server.py o como variable de entorno ANTHROPIC_API_KEY'
            }), 500

        # Obtener datos del request
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No se recibieron datos'}), 400
        
        # Extraer parámetros
        messages = data.get('messages', [])
        system_prompt = data.get('system', '')
        model = data.get('model', 'claude-sonnet-4-20250514')
        max_tokens = data.get('max_tokens', 1000)
        use_auto_transcription = data.get('use_auto_transcription', True)
        
        if not messages:
            return jsonify({'error': 'Se requiere al menos un mensaje'}), 400
        
        # Si hay transcripción cargada automáticamente y el frontend lo permite, usarla
        if use_auto_transcription and TRANSCRIPCION and 'TRANSCRIPCIÓN DEL VIDEO' not in system_prompt:
            system_prompt = system_prompt.replace(
                '⚠️ IMPORTANTE: Aún no se ha proporcionado la transcripción del video.',
                f'=== TRANSCRIPCIÓN DEL VIDEO (CARGADA AUTOMÁTICAMENTE) ===\n{TRANSCRIPCION}\n\n=== INSTRUCCIONES ===\nResponde las preguntas del usuario basándote EXCLUSIVAMENTE en el contenido de esta transcripción.'
            )
        
        print(f"\n📨 Nueva petición recibida")
        print(f"   Modelo: {model}")
        print(f"   Mensajes: {len(messages)}")
        print(f"   System prompt: {'Sí' if system_prompt else 'No'}")
        print(f"   Transcripción auto: {'Sí' if (use_auto_transcription and TRANSCRIPCION) else 'No'}")
        
        # Llamar a la API de Claude
        print(f"🚀 Enviando petición a Claude API...")
        
        response = client.messages.create(
            model=model,
            max_tokens=max_tokens,
            system=system_prompt,
            messages=messages
        )
        
        print(f"✅ Respuesta recibida de Claude API")
        
        # Convertir respuesta a formato JSON serializable
        response_dict = {
            'id': response.id,
            'type': response.type,
            'role': response.role,
            'content': [
                {
                    'type': block.type,
                    'text': block.text
                }
                for block in response.content
            ],
            'model': response.model,
            'stop_reason': response.stop_reason,
            'usage': {
                'input_tokens': response.usage.input_tokens,
                'output_tokens': response.usage.output_tokens
            }
        }
        
        return jsonify(response_dict), 200
        
    except Exception as e:
        error_msg = str(e)
        print(f"❌ Error en /api/chat: {error_msg}")
        
        # Manejar errores específicos de la API
        if 'authentication' in error_msg.lower() or '401' in error_msg:
            return jsonify({
                'error': 'Error de autenticación. Verifica tu API key.'
            }), 401
        elif 'rate_limit' in error_msg.lower() or '429' in error_msg:
            return jsonify({
                'error': 'Has excedido el límite de solicitudes. Espera un momento.'
            }), 429
        elif 'overloaded' in error_msg.lower():
            return jsonify({
                'error': 'El servidor de Claude está sobrecargado. Intenta de nuevo en unos segundos.'
            }), 503
        else:
            return jsonify({
                'error': f'Error al procesar la petición: {error_msg}'
            }), 500


@app.route('/api/health', methods=['GET'])
def health_check():
    """Endpoint para verificar que el servidor está funcionando"""
    return jsonify({
        'status': 'ok',
        'message': 'VideoLearn server está funcionando correctamente',
        'api_key_configured': ANTHROPIC_API_KEY != 'TU_API_KEY_AQUI',
        'transcription_loaded': len(TRANSCRIPCION) > 0,
        'transcription_length': len(TRANSCRIPCION)
    }), 200


@app.route('/api/transcription', methods=['GET'])
def get_transcription():
    """Endpoint para obtener la transcripción cargada"""
    return jsonify({
        'transcription': TRANSCRIPCION,
        'length': len(TRANSCRIPCION),
        'loaded': len(TRANSCRIPCION) > 0
    }), 200


# ========== INICIO DEL SERVIDOR ==========

if __name__ == '__main__':
    print("\n" + "="*60)
    print("  🚀 VideoLearn - Servidor Python con Flask")
    print("="*60)
    print(f"  📡 Servidor corriendo en: http://localhost:5000")
    print(f"  🌐 Abre tu navegador en: http://localhost:5000")
    print("="*60)
    
    if ANTHROPIC_API_KEY == 'TU_API_KEY_AQUI':
        print("\n⚠️  ADVERTENCIA: API key no configurada")
        print("   Configura tu API key en server.py o como variable de entorno")
        print("   export ANTHROPIC_API_KEY='tu-api-key'\n")
    else:
        print(f"\n✅ API key configurada correctamente")
    
    print("\n💡 Para detener el servidor: Ctrl + C\n")
    
    # Iniciar servidor Flask
    # debug=True permite ver errores detallados y recarga automática
    app.run(host='0.0.0.0', port=8080, debug=True)
