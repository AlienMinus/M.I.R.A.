doc-converter-vdh0.onrender.com/


document.addEventListener("DOMContentLoaded", function () {
  const loadingOverlay = document.getElementById("loading-overlay");
  const resultsSection = document.getElementById("results-section");
  const resultsBody = document.getElementById("results-body");
  const clearBtn = document.getElementById("clear-results");
  const copyBtn = document.getElementById("copy-results");

  clearBtn.addEventListener("click", () => {
    resultsSection.style.display = "none";
    resultsBody.innerHTML = "";
  });

  copyBtn.addEventListener("click", () => {
    let textToCopy = "";
    const textarea = resultsBody.querySelector("textarea");
    const codeBlock = resultsBody.querySelector("code");

    if (textarea) {
      textToCopy = textarea.value;
    } else if (codeBlock) {
      textToCopy = codeBlock.textContent;
    } else {
      textToCopy = resultsBody.innerText;
    }

    if (textToCopy) {
      navigator.clipboard
        .writeText(textToCopy)
        .then(() => {
          const originalHtml = copyBtn.innerHTML;
          copyBtn.innerHTML = '<i class="bi bi-check-lg"></i>';
          copyBtn.classList.remove("btn-outline-secondary");
          copyBtn.classList.add("btn-success");

          setTimeout(() => {
            copyBtn.innerHTML = originalHtml;
            copyBtn.classList.remove("btn-success");
            copyBtn.classList.add("btn-outline-secondary");
          }, 2000);
        })
        .catch((err) => {
          console.error("Failed to copy: ", err);
          alert("Failed to copy to clipboard");
        });
    }
  });

  const forms = document.querySelectorAll("form");
  forms.forEach((form) => {
    // Set API endpoints based on the hidden input 'feature'
    const featureInput = form.querySelector('input[name="feature"]');
    if (featureInput) {
      form.setAttribute("data-endpoint", "/api/" + featureInput.value);
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      loadingOverlay.style.display = "flex";
      resultsSection.style.display = "none";
      resultsBody.innerHTML = "";

      const formData = new FormData(form);

      // Capture the submitter button value (for Preview vs Download)
      if (e.submitter && e.submitter.name) {
        formData.append(e.submitter.name, e.submitter.value);
      }

      const endpoint = form.getAttribute("data-endpoint");

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          body: formData,
        });

        const contentType = response.headers.get("content-type");

        if (!response.ok) {
          let errorMsg = "An error occurred";
          if (contentType && contentType.includes("application/json")) {
            const errData = await response.json();
            errorMsg = errData.error || errorMsg;
          } else {
            errorMsg = `Error ${response.status}: ${response.statusText}`;
          }
          throw new Error(errorMsg);
        }

        if (contentType.includes("application/json")) {
          const data = await response.json();
          renderJSONResults(data);
          resultsSection.style.display = "block";
        } else {
          // Assume blob/file download
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          // Try to get filename from header or default
          const disposition = response.headers.get("content-disposition");
          let filename = "download.docx";
          if (disposition && disposition.indexOf("attachment") !== -1) {
            const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
            const matches = filenameRegex.exec(disposition);
            if (matches != null && matches[1]) {
              filename = matches[1].replace(/['"]/g, "");
            }
          }
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          a.remove();
        }
      } catch (error) {
        alert(error.message);
      } finally {
        loadingOverlay.style.display = "none";
      }
    });
  });

  function renderJSONResults(data) {
    if (data.metadata) {
      let html = '<table class="table table-striped"><tbody>';
      for (const [key, value] of Object.entries(data.metadata)) {
        html += `<tr><th scope="row" style="width: 30%">${key}</th><td>${value}</td></tr>`;
      }
      html += "</tbody></table>";
      resultsBody.innerHTML = html;
    } else if (data.text) {
      resultsBody.innerHTML = `<textarea class="form-control" rows="10">${data.text}</textarea>`;
    } else if (typeof data.markdown !== "undefined") {
      // Escape HTML to ensure it displays as code
      const escaped = (data.markdown || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      resultsBody.innerHTML = `<pre><code class="language-markdown" style="border-radius: 8px;">${escaped}</code></pre>`;
      if (window.hljs) {
        hljs.highlightElement(resultsBody.querySelector("code"));
      }
    } else if (data.images) {
      let html = '<div class="row">';
      data.images.forEach((img) => {
        html += `
                    <div class="col-md-4 mb-4">
                        <div class="card h-100">
                            <img src="data:${img.mime};base64,${img.data}" class="card-img-top" style="max-height: 200px; object-fit: contain; padding: 10px;">
                            <div class="card-body text-center">
                                <p class="card-text small text-muted">${img.filename}</p>
                            </div>
                        </div>
                    </div>`;
      });
      html += "</div>";
      resultsBody.innerHTML = html;
    } else if (data.tables) {
      let html = "";
      data.tables.forEach((table, index) => {
        html += `<h5>Table ${index + 1}</h5><table class="table table-bordered table-sm mb-4">`;
        table.forEach((row) => {
          html += "<tr>";
          row.forEach((cell) => {
            html += `<td>${cell}</td>`;
          });
          html += "</tr>";
        });
        html += "</table>";
      });
      resultsBody.innerHTML = html;
    }
  }
});

import os
import tempfile
import subprocess
import platform
from io import BytesIO
from flask import Flask, render_template, request, send_file, flash, jsonify
from pdf2docx import Converter
from docx2pdf import convert as convert_to_pdf
from flask_cors import CORS

app = Flask(__name__)
app.secret_key = 'super_secret_key_for_demo_purposes'
CORS(app, resources={r"/api/*": {"origins": "*"}})
# --- API Endpoints ---

@app.route('/api/pdf-to-docx', methods=['POST'])
def api_pdf_to_docx():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file and file.filename.endswith('.pdf'):
        try:
            # Create temp files
            with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_pdf:
                file.save(tmp_pdf.name)
                tmp_pdf_path = tmp_pdf.name
            
            tmp_docx_path = tmp_pdf_path.replace('.pdf', '.docx')
            
            # Convert
            cv = Converter(tmp_pdf_path)
            cv.convert(tmp_docx_path)
            cv.close()
            
            # Read into memory
            with open(tmp_docx_path, 'rb') as f:
                output_stream = BytesIO(f.read())
            
            # Cleanup
            os.remove(tmp_pdf_path)
            os.remove(tmp_docx_path)
            
            output_stream.seek(0)
            return send_file(
                output_stream,
                as_attachment=True,
                download_name=f"{os.path.splitext(file.filename)[0]}.docx",
                mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            )
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    return jsonify({'error': 'Invalid file format'}), 400

@app.route('/api/docx-to-pdf', methods=['POST'])
def api_docx_to_pdf():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file and file.filename.endswith('.docx'):
        try:
            # Create temp files
            with tempfile.NamedTemporaryFile(delete=False, suffix='.docx') as tmp_docx:
                file.save(tmp_docx.name)
                tmp_docx_path = tmp_docx.name
            
            tmp_pdf_path = tmp_docx_path.replace('.docx', '.pdf')
            
            # Convert
            if platform.system() == 'Linux':
                # Use LibreOffice in Docker/Linux environment
                subprocess.run(['libreoffice', '--headless', '--convert-to', 'pdf', '--outdir', os.path.dirname(tmp_pdf_path), tmp_docx_path], check=True)
            else:
                convert_to_pdf(tmp_docx_path, tmp_pdf_path)
            
            # Read into memory
            with open(tmp_pdf_path, 'rb') as f:
                output_stream = BytesIO(f.read())
                
            # Cleanup
            os.remove(tmp_docx_path)
            os.remove(tmp_pdf_path)
            
            output_stream.seek(0)
            return send_file(
                output_stream,
                as_attachment=True,
                download_name=f"{os.path.splitext(file.filename)[0]}.pdf",
                mimetype='application/pdf'
            )
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    return jsonify({'error': 'Invalid file format'}), 400

@app.route('/', methods=['GET', 'POST'])
def index():
    result = {}
    form_data = {}
    active_feature = 'pdf-to-docx'
    
    if request.method == 'POST':
        form_data = request.form
        feature = form_data.get('feature')
        active_feature = feature

        # Map features to their corresponding API functions
        api_functions = {
            'pdf-to-docx': api_pdf_to_docx,
            'docx-to-pdf': api_docx_to_pdf
        }

        if feature in api_functions:
            # Call the API function internally (uses the same global 'request' object)
            response = api_functions[feature]()

            # Handle File Download (Success for Replace/Generate)
            if response.mimetype == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
                return response
            
            # Handle JSON Response (Data or Error)
            if response.is_json:
                data = response.get_json()
                if response.status_code >= 400:
                    flash(data.get('error', 'An error occurred'))
                else:
                    # Merge API data (e.g., {'text': ...}) into result for template
                    result.update(data)
            else:
                # Fallback for unexpected responses
                if response.status_code >= 400:
                    flash("An error occurred processing the request.")

    return render_template('index.html', result=result, form_data=form_data, active_feature=active_feature)

if __name__ == '__main__':
    # Use waitress for production serving (requires: pip install waitress)
    from waitress import serve
    print("Production server running on http://127.0.0.1:5000")
    serve(app, host='0.0.0.0', port=5000)