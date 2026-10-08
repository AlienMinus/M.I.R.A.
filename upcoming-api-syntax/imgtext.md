<!DOCTYPE html>
<html>
<head>
    <title>OCR Extractor</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.css">
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f4f4f9;
            color: #333;
            display: flex;
            justify-content: center;
            padding-top: 50px;
            margin: 0;
        }

        .container {
            background: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            width: 100%;
            max-width: 800px;
            margin: 0 10px;
        }

        textarea {
            width: 100%;
            height: 300px;
            margin: 1rem 0;
            padding: 10px;
            border: 1px solid #ccc;
            border-radius: 4px;
            resize: vertical;
            font-family: monospace;
            box-sizing: border-box;
        }

        .hidden {
            display: none !important;
        }

        .button-group {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }

        button {
            padding: 10px 20px;
            cursor: pointer;
            border: none;
            border-radius: 4px;
            background-color: #007bff;
            color: white;
            font-size: 14px;
        }

        button:hover {
            background-color: #0056b3;
        }

        .btn-secondary {
            background-color: #6c757d;
        }

        .btn-secondary:hover {
            background-color: #545b62;
        }

        .loader {
            border: 5px solid #f3f3f3;
            border-top: 5px solid #007bff;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 20px auto;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .upload-container {
            display: flex;
            gap: 20px;
            margin-bottom: 1rem;
        }

        .upload-box {
            flex: 1;
            border: 2px dashed #ccc;
            border-radius: 8px;
            padding: 2rem;
            text-align: center;
            cursor: pointer;
            transition: border-color 0.3s, background-color 0.3s;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }

        .upload-box:hover, .upload-box.dragover {
            border-color: #007bff;
            background-color: #e9f5ff;
        }

        .upload-box i {
            color: #007bff;
            margin-bottom: 10px;
        }

        .preview-container {
            position: relative;
            margin-bottom: 1rem;
            text-align: center;
        }

        .img-container {
            max-width: 100%;
            max-height: 400px;
            overflow: hidden;
            margin: 0 auto;
        }

        .img-container img {
            max-width: 100%;
            display: block; /* Important for cropper.js */
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }

        .btn-icon-small {
            position: absolute;
            top: 5px;
            right: 5px;
            background: rgba(255, 255, 255, 0.8);
            border-radius: 50%;
            padding: 5px 8px;
            color: #dc3545;
        }

        .btn-icon {
            background: none;
            color: #6c757d;
            font-size: 1.2rem;
            margin-left: 10px;
        }

        .btn-icon:hover {
            background: none;
            color: #007bff;
        }

        .progress-container {
            width: 100%;
            background-color: #e9ecef;
            border-radius: 4px;
            margin-top: 1rem;
            height: 10px;
            overflow: hidden;
        }

        .progress-bar {
            height: 100%;
            background-color: #28a745;
            width: 0%;
            transition: width 0.2s ease;
        }

        .preview-actions {
            margin-top: 10px;
            display: flex;
            justify-content: center;
            gap: 10px;
        }

        .controls-group {
            display: flex;
            gap: 10px;
            margin-bottom: 1rem;
            align-items: center;
            justify-content: center;
            flex-wrap: wrap;
        }

        .form-select {
            padding: 10px;
            border-radius: 4px;
            border: 1px solid #ccc;
        }

        .translation-section {
            margin-top: 2rem;
            border-top: 1px solid #eee;
            padding-top: 1rem;
        }

        .btn-recording {
            background-color: #dc3545 !important;
            animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.7); }
            70% { box-shadow: 0 0 0 10px rgba(220, 53, 69, 0); }
            100% { box-shadow: 0 0 0 0 rgba(220, 53, 69, 0); }
        }

        .output-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .btn-danger {
            background-color: #dc3545;
            color: white;
            padding: 5px 15px;
        }

        .btn-danger:hover {
            background-color: #c82333;
        }
    </style>
</head>
<body>
    <div class="container">
        <h2>Upload Image</h2>
        
        <div class="upload-container">
            <div id="dropZone" class="upload-box">
                <i class="fas fa-cloud-upload-alt fa-3x"></i>
                <p>Upload File</p>
            </div>
            <div id="cameraBtn" class="upload-box">
                <i class="fas fa-camera fa-3x"></i>
                <p>Open Camera</p>
            </div>
        </div>
        <input type="file" id="fileInput" hidden accept="image/*" multiple>
        <input type="file" id="cameraInput" hidden accept="image/*" capture="environment">

        <div id="previewContainer" class="preview-container hidden">
            <div class="img-container">
                <img id="imagePreview" src="" alt="Image Preview">
            </div>
            <div class="preview-actions">
                <button id="cropBtn" class="btn-secondary btn-sm"><i class="fas fa-crop"></i> Crop</button>
                <button id="saveCropBtn" class="btn-primary btn-sm hidden"><i class="fas fa-check"></i> Save</button>
                <button id="cancelCropBtn" class="btn-secondary btn-sm hidden"><i class="fas fa-times"></i> Cancel</button>
            </div>
            <button id="clearPreview" class="btn-icon-small" title="Remove Image"><i class="fas fa-times"></i></button>
        </div>

        <div class="controls-group">
            <select id="languageSelect" class="form-select">
                <option value="auto" selected>Auto Detect</option>
                <option value="eng">English</option>
                <option value="spa">Spanish</option>
                <option value="fra">French</option>
                <option value="deu">German</option>
                <option value="ita">Italian</option>
            </select>
            <button id="extractBtn" class="btn-primary" title="Start Extraction"><i class="fas fa-search"></i> Extract Text</button>
        </div>

        <div id="progressContainer" class="progress-container hidden">
            <div id="progressBar" class="progress-bar"></div>
        </div>
        <div id="loader" class="loader hidden"></div>

        <div id="outputSection" class="hidden">
            <div class="output-header">
                <h3>Extracted Text</h3>
                <button id="clearTextBtn" class="btn-danger" title="Clear Text & History"><i class="fas fa-trash"></i> Clear</button>
            </div>
            <textarea id="extractedText" placeholder="Result will appear here..."></textarea>
            
            <div class="button-group">
                <button onclick="copyToClipboard()" class="btn-secondary" title="Copy to Clipboard"><i class="fas fa-copy"></i></button>
                <button onclick="correctSpelling()" class="btn-secondary" title="Auto Correct Spelling"><i class="fas fa-magic"></i></button>
                <button onclick="toggleSTT()" id="sttBtn" class="btn-secondary" title="Dictate (Speech to Text)"><i class="fas fa-microphone"></i></button>
                <button onclick="downloadAudio('extractedText', 'languageSelect')" class="btn-secondary" title="Download Audio"><i class="fas fa-file-audio"></i></button>
                <button onclick="speakText('extractedText', 'languageSelect')" class="btn-secondary" title="Read Aloud"><i class="fas fa-volume-up"></i></button>
                <button onclick="exportFile('docx')" class="btn-secondary" title="Export as DOCX"><i class="fas fa-file-word"></i></button>
                <button onclick="exportFile('pdf')" class="btn-secondary" title="Export as PDF"><i class="fas fa-file-pdf"></i></button>
                <button onclick="exportFile('xlsx')" class="btn-secondary" title="Export as Excel"><i class="fas fa-file-excel"></i></button>
                <button onclick="exportFile('md')" class="btn-secondary" title="Export as Markdown"><i class="fas fa-file-code"></i></button>
            </div>

            <div class="translation-section">
                <h3>Translate Text</h3>
                <div class="controls-group">
                    <select id="targetLang" class="form-select">
                        <option value="hi">Hindi</option>
                        <option value="or">Odia</option>
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                    </select>
                    <button id="translateActionBtn" class="btn-primary"><i class="fas fa-language"></i> Translate</button>
                </div>
                <textarea id="translatedText" class="hidden" placeholder="Translated text will appear here..."></textarea>
                <div id="translationActions" class="button-group hidden" style="margin-top: 10px;">
                    <button onclick="downloadAudio('translatedText', 'targetLang')" class="btn-secondary" title="Download Audio"><i class="fas fa-file-audio"></i></button>
                    <button onclick="speakText('translatedText', 'targetLang')" class="btn-secondary" title="Read Aloud"><i class="fas fa-volume-up"></i></button>
                </div>
            </div>
        </div>
    </div>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.js"></script>
    <script>
        const API_BASE_URL = "https://image-ocr-api-66vu.onrender.com";

        let selectedFiles = [];
        let cropper = null;
        let recognition = null;

        const dropZone = document.getElementById('dropZone');
        const fileInput = document.getElementById('fileInput');
        const cameraInput = document.getElementById('cameraInput');
        const cameraBtn = document.getElementById('cameraBtn');
        const previewContainer = document.getElementById('previewContainer');
        const imagePreview = document.getElementById('imagePreview');
        const clearPreviewBtn = document.getElementById('clearPreview');
        const cropBtn = document.getElementById('cropBtn');
        const saveCropBtn = document.getElementById('saveCropBtn');
        const cancelCropBtn = document.getElementById('cancelCropBtn');
        const progressContainer = document.getElementById('progressContainer');
        const progressBar = document.getElementById('progressBar');
        const translateActionBtn = document.getElementById('translateActionBtn');
        const translatedText = document.getElementById('translatedText');
        const translationActions = document.getElementById('translationActions');
        const clearTextBtn = document.getElementById('clearTextBtn');

        document.addEventListener('DOMContentLoaded', () => {
            const savedExtracted = localStorage.getItem('extractedText');
            if (savedExtracted) {
                document.getElementById('extractedText').value = savedExtracted;
                document.getElementById('outputSection').classList.remove('hidden');
            }
            
            const savedTranslated = localStorage.getItem('translatedText');
            if (savedTranslated) {
                translatedText.value = savedTranslated;
                translatedText.classList.remove('hidden');
                translationActions.classList.remove('hidden');
            }
        });

        // Keyboard Shortcuts
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                document.getElementById('extractBtn').click();
            }
        });

        // Drag and Drop Events
        dropZone.addEventListener('click', () => fileInput.click());

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('dragover');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            if (e.dataTransfer.files.length) {
                handleFiles(e.dataTransfer.files);
            }
        });

        // Input Events
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length) handleFiles(e.target.files);
        });

        cameraBtn.addEventListener('click', () => {
            cameraInput.click();
        });

        cameraInput.addEventListener('change', (e) => {
            if (e.target.files.length) handleFiles(e.target.files);
        });

        clearPreviewBtn.addEventListener('click', () => {
            destroyCropper();
            if (imagePreview.dataset.blobUrl) {
                URL.revokeObjectURL(imagePreview.dataset.blobUrl);
                imagePreview.dataset.blobUrl = '';
            }
            selectedFiles = [];
            previewContainer.classList.add('hidden');
            document.querySelector('.upload-container').classList.remove('hidden');
            fileInput.value = '';
            cameraInput.value = '';
        });

        // Cropper Events
        cropBtn.addEventListener('click', () => {
            if (cropper) return;
            cropper = new Cropper(imagePreview, {
                viewMode: 1,
                autoCropArea: 1,
            });
            cropBtn.classList.add('hidden');
            saveCropBtn.classList.remove('hidden');
            cancelCropBtn.classList.remove('hidden');
        });

        saveCropBtn.addEventListener('click', () => {
            if (!cropper) return;
            cropper.getCroppedCanvas().toBlob((blob) => {
                selectedFiles = [blob];
                // Re-create URL for the preview
                const url = URL.createObjectURL(blob);
                imagePreview.src = url;
                // Clean up old cropper
                destroyCropper();
            });
        });

        cancelCropBtn.addEventListener('click', () => {
            destroyCropper();
        });

        document.getElementById('extractBtn').addEventListener('click', async function() {
            
            if (selectedFiles.length === 0) {
                alert('Please select an image first.');
                return;
            }

            const formData = new FormData();
            for (let i = 0; i < selectedFiles.length; i++) {
                formData.append('image', selectedFiles[i]);
            }
            const language = document.getElementById('languageSelect').value;
            formData.append('language', language);

            document.getElementById('loader').classList.remove('hidden');
            document.getElementById('outputSection').classList.add('hidden');
            progressContainer.classList.remove('hidden');
            progressBar.style.width = '0%';

            try {
                // Use XMLHttpRequest for progress tracking
                const data = await new Promise((resolve, reject) => {
                    const xhr = new XMLHttpRequest();
                    xhr.open('POST', `${API_BASE_URL}/api/extract`);
                    
                    xhr.upload.onprogress = (e) => {
                        if (e.lengthComputable) {
                            const percent = (e.loaded / e.total) * 100;
                            progressBar.style.width = percent + '%';
                        }
                    };

                    xhr.onload = () => {
                        if (xhr.status === 200) {
                            resolve(JSON.parse(xhr.responseText));
                        } else {
                            reject(new Error('Extraction failed'));
                        }
                    };
                    xhr.onerror = () => reject(new Error('Network error'));
                    xhr.send(formData);
                });
                
                if (data.text) {
                    document.getElementById('extractedText').value = data.text;
                    localStorage.setItem('extractedText', data.text);
                    document.getElementById('outputSection').classList.remove('hidden');
                    translatedText.classList.add('hidden'); // Hide previous translations
                    translationActions.classList.add('hidden');
                    localStorage.removeItem('translatedText');
                } else {
                    alert('No text found in image.');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('An error occurred while extracting text.');
            } finally {
                document.getElementById('loader').classList.add('hidden');
                progressContainer.classList.add('hidden');
            }
        });

        translateActionBtn.addEventListener('click', async function() {
            const text = document.getElementById('extractedText').value;
            const targetLang = document.getElementById('targetLang').value;

            if (!text) {
                alert('No text to translate.');
                return;
            }

            translatedText.value = "Translating...";
            translatedText.classList.remove('hidden');
            translationActions.classList.add('hidden');

            try {
                const response = await fetch(`${API_BASE_URL}/api/translate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: text, target_lang: targetLang })
                });
                const data = await response.json();
                translatedText.value = data.translated_text;
                localStorage.setItem('translatedText', data.translated_text);
                translationActions.classList.remove('hidden');
            } catch (error) {
                console.error('Translation error:', error);
                translatedText.value = "Failed to translate text.";
            }
        });

        clearTextBtn.addEventListener('click', () => {
            document.getElementById('extractedText').value = '';
            translatedText.value = '';
            translatedText.classList.add('hidden');
            translationActions.classList.add('hidden');
            document.getElementById('outputSection').classList.add('hidden');
            localStorage.removeItem('extractedText');
            localStorage.removeItem('translatedText');
        });

        document.getElementById('extractedText').addEventListener('input', (e) => {
            localStorage.setItem('extractedText', e.target.value);
        });

        translatedText.addEventListener('input', (e) => {
            localStorage.setItem('translatedText', e.target.value);
        });

        function handleFiles(files) {
            destroyCropper();
            
            const validFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
            
            if (validFiles.length === 0) {
                alert('Please upload valid image files.');
                return;
            }
            
            // Resize the first image to prevent low memory crashes on mobile
            resizeImage(validFiles[0], 1280, 1280, (resizedBlob) => {
                selectedFiles = validFiles;
                // Replace the first file with the resized version for processing
                selectedFiles[0] = resizedBlob;
                
                const url = URL.createObjectURL(resizedBlob);
                
                if (imagePreview.dataset.blobUrl) {
                    URL.revokeObjectURL(imagePreview.dataset.blobUrl);
                }
                imagePreview.dataset.blobUrl = url;
                imagePreview.src = url;

                previewContainer.classList.remove('hidden');
                const uploadContainer = document.querySelector('.upload-container');
                if (uploadContainer) uploadContainer.classList.add('hidden');
                else dropZone.classList.add('hidden');
                
                if (selectedFiles.length > 1) {
                    cropBtn.classList.add('hidden');
                    alert(`Batch mode: ${selectedFiles.length} images selected. Cropping is disabled.`);
                } else {
                    cropBtn.classList.remove('hidden');
                }
            });
        }

        function destroyCropper() {
            if (cropper) {
                cropper.destroy();
                cropper = null;
            }
            cropBtn.classList.remove('hidden');
            saveCropBtn.classList.add('hidden');
            cancelCropBtn.classList.add('hidden');
        }

        async function exportFile(format) {
            const text = document.getElementById('extractedText').value;
            if (!text) {
                alert('No text to export.');
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/api/export`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: text, format: format })
                });

                if (!response.ok) throw new Error('Export failed');

                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `extracted_text.${format}`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
            } catch (error) {
                console.error('Error:', error);
                alert('Failed to export file.');
            }
        }

        async function copyToClipboard() {
            const text = document.getElementById('extractedText').value;
            if (!text) return;

            try {
                await navigator.clipboard.writeText(text);
                alert('Text copied to clipboard!');
            } catch (err) {
                console.error('Failed to copy:', err);
                alert('Failed to copy text.');
            }
        }

        function speakText(elementId, langSelectId) {
            const element = document.getElementById(elementId);
            const text = element.value;
            if (!text) return;

            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            
            if (langSelectId) {
                const langCode = document.getElementById(langSelectId).value;
                const langMap = {
                    'eng': 'en-US', 'spa': 'es-ES', 'fra': 'fr-FR', 'deu': 'de-DE', 'ita': 'it-IT',
                    'hi': 'hi-IN', 'or': 'or-IN', 'en': 'en-US', 'es': 'es-ES', 'fr': 'fr-FR', 'de': 'de-DE'
                };
                if (langMap[langCode]) utterance.lang = langMap[langCode];
            }

            // Real-time highlighting
            utterance.onboundary = function(event) {
                if (event.name === 'word') {
                    const charIndex = event.charIndex;
                    // Estimate word length since charLength is not always reliable
                    const textAfter = text.slice(charIndex);
                    const match = textAfter.match(/^\S+/); // Match until next whitespace
                    const wordLength = match ? match[0].length : 0;

                    element.focus();
                    element.setSelectionRange(charIndex, charIndex + wordLength);
                }
            };

            utterance.onend = function() {
                element.setSelectionRange(0, 0); // Clear selection
            };

            window.speechSynthesis.speak(utterance);
        }

        function toggleSTT() {
            const sttBtn = document.getElementById('sttBtn');
            const textArea = document.getElementById('extractedText');

            if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
                alert("Speech to text is not supported in this browser.");
                return;
            }

            if (recognition && recognition.started) {
                recognition.stop();
                return;
            }

            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = document.getElementById('languageSelect').value === 'auto' ? 'en-US' : document.getElementById('languageSelect').value;

            recognition.onstart = function() {
                recognition.started = true;
                sttBtn.classList.add('btn-recording');
            };

            recognition.onend = function() {
                recognition.started = false;
                sttBtn.classList.remove('btn-recording');
            };

            recognition.onresult = function(event) {
                let finalTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript + ' ';
                    }
                }
                if (finalTranscript) {
                    textArea.value += finalTranscript;
                }
            };

            recognition.start();
        }

        async function downloadAudio(elementId, langSelectId) {
            const text = document.getElementById(elementId).value;
            if (!text) {
                alert('No text to generate audio.');
                return;
            }
            
            const lang = document.getElementById(langSelectId).value;

            try {
                const response = await fetch(`${API_BASE_URL}/api/audio`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: text, language: lang })
                });

                if (!response.ok) throw new Error('Audio generation failed');

                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `audio_${Date.now()}.mp3`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
            } catch (error) {
                console.error('Error:', error);
                alert('Failed to download audio.');
            }
        }

        async function correctSpelling() {
            const text = document.getElementById('extractedText').value;
            if (!text) {
                alert('No text to correct.');
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/api/correct`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: text })
                });
                const data = await response.json();
                document.getElementById('extractedText').value = data.corrected_text;
            } catch (error) {
                console.error('Error:', error);
                alert('Failed to correct spelling.');
            }
        }

        function resizeImage(file, maxWidth, maxHeight, callback) {
            const img = new Image();
            const url = URL.createObjectURL(file);
            
            img.onload = () => {
                let width = img.width;
                let height = img.height;
                let shouldResize = false;

                if (width > maxWidth || height > maxHeight) {
                    shouldResize = true;
                    if (width > height) {
                        if (width > maxWidth) {
                            height = Math.round(height * (maxWidth / width));
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width = Math.round(width * (maxHeight / height));
                            height = maxHeight;
                        }
                    }
                }

                if (shouldResize) {
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    canvas.toBlob((blob) => {
                        URL.revokeObjectURL(url);
                        callback(blob);
                    }, file.type || 'image/jpeg', 0.8);
                } else {
                    URL.revokeObjectURL(url);
                    callback(file);
                }
            };
            
            img.onerror = () => {
                URL.revokeObjectURL(url);
                callback(file);
            };
            
            img.src = url;
        }
    </script>
</body>
</html>