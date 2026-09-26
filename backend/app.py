import sys
from pathlib import Path

current_dir = Path(__file__).resolve().parent
if str(current_dir) not in sys.path:
    sys.path.insert(0, str(current_dir))

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from config import SERVER_CONFIG, DEVICE
from services.pipeline_service import PipelineService

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)

print(f'[Backend] Starting MIRA AI Backend on device: {DEVICE}...')
pipeline = PipelineService(device=DEVICE)
print('[Backend] Pipeline ready to serve requests.')

@app.route('/')
def serve_index():
    return send_from_directory(current_dir, 'index.html')

@app.route('/health', methods=['GET'])
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'device': DEVICE,
        'server': 'waitress',
        'services': {
            'web_search': True,
            'web_scraper': True,
            'pytorch_gpt': True,
            'pytorch_lstm': True,
            'nltk_formatting': True
        }
    })

@app.route('/generate', methods=['POST'])
@app.route('/api/generate', methods=['POST'])
def generate_endpoint():
    data = request.get_json(silent=True) or {}
    prompt = data.get('prompt', '').strip()
    requested_format = data.get('format', 'auto')

    if not prompt:
        return jsonify({'error': 'No prompt provided', 'success': False}), 400

    try:
        result = pipeline.run_pipeline(prompt=prompt, requested_format=requested_format)
        return jsonify(result), 200

    except Exception as e:
        print(f'[Backend Error] /generate failed: {e}')
        return jsonify({
            'error': str(e),
            'success': False,
            'generated_text': f'Error processing request: {str(e)}'
        }), 500

@app.route('/search', methods=['POST'])
@app.route('/api/search', methods=['POST'])
def search_endpoint():
    data = request.get_json(silent=True) or {}
    query = data.get('query', '').strip()

    if not query:
        return jsonify({'error': 'No query provided', 'success': False}), 400

    try:
        results = pipeline.search_service.search(query)
        scraped = pipeline.scraper_service.scrape_sources(results)
        return jsonify({
            'success': True,
            'query': query,
            'results': results,
            'scraped': scraped
        }), 200
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500

if __name__ == '__main__':
    from waitress import serve
    host = SERVER_CONFIG.get('host', '0.0.0.0')
    port = SERVER_CONFIG.get('port', 5000)
    threads = SERVER_CONFIG.get('threads', 4)
    print(f'[Backend] Running with Waitress production WSGI server on http://{host}:{port} ({threads} threads)...')
    serve(app, host=host, port=port, threads=threads)
