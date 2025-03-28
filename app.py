from flask import Flask, request, jsonify, send_file, send_from_directory
from werkzeug.utils import secure_filename
import os
import imageio.v2 as imageio
from PIL import Image
import io
import tempfile
import numpy as np
import traceback

app = Flask(__name__, static_url_path='', static_folder='static')
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
app.config['UPLOAD_FOLDER'] = 'uploads'

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def process_image(img, target_size=None, scale_up=False, interpolation_method=Image.Resampling.LANCZOS):
    """
    Process image with advanced resizing and interpolation options
    Args:
        img: PIL Image object
        target_size: tuple of (width, height)
        scale_up: whether to scale up images smaller than target_size
        interpolation_method: PIL interpolation method for resizing
    """
    # Convert to RGBA if not already
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    
    if target_size and img.size != target_size:
        orig_width, orig_height = img.size
        target_width, target_height = target_size
        
        # Calculate scaling ratios
        width_ratio = target_width / orig_width
        height_ratio = target_height / orig_height
        
        if not scale_up and (width_ratio > 1 or height_ratio > 1):
            # If image is smaller and we don't want to scale up,
            # center it with transparent padding
            new_img = Image.new('RGBA', target_size, (0, 0, 0, 0))
            paste_x = (target_width - orig_width) // 2
            paste_y = (target_height - orig_height) // 2
            new_img.paste(img, (paste_x, paste_y))
        else:
            # Scale image maintaining aspect ratio
            if width_ratio < height_ratio:
                # Fit to width
                new_width = target_width
                new_height = int(orig_height * width_ratio)
                resize_ratio = width_ratio
            else:
                # Fit to height
                new_height = target_height
                new_width = int(orig_width * height_ratio)
                resize_ratio = height_ratio
            
            # Use high-quality interpolation for downsizing, nearest neighbor for upsizing
            if resize_ratio < 1:
                # Downsizing - use specified interpolation method
                resized_img = img.resize((new_width, new_height), interpolation_method)
            else:
                # Upsizing - use NEAREST for pixel art-style scaling or BICUBIC for smooth scaling
                resized_img = img.resize((new_width, new_height), 
                                      Image.Resampling.NEAREST if resize_ratio > 2 else Image.Resampling.BICUBIC)
            
            # Create new image with padding
            new_img = Image.new('RGBA', target_size, (0, 0, 0, 0))
            paste_x = (target_width - new_width) // 2
            paste_y = (target_height - new_height) // 2
            new_img.paste(resized_img, (paste_x, paste_y))
        
        img = new_img
    
    return img

@app.route('/')
def index():
    return app.send_static_file('index.html')

@app.route('/generate-gif', methods=['POST'])
def generate_gif():
    try:
        # Get parameters from request
        frame_delay = float(request.form.get('frameDelay', 500)) / 1000.0  # Convert to seconds
        scale_up = request.form.get('scaleUp', 'false').lower() == 'true'
        quality = int(request.form.get('quality', 10))
        
        # Map quality setting to interpolation method
        interpolation_methods = {
            'low': Image.Resampling.NEAREST,    # Pixel art style
            'medium': Image.Resampling.BILINEAR,  # Smooth but faster
            'high': Image.Resampling.LANCZOS    # Best quality but slower
        }
        interpolation_method = interpolation_methods['high' if quality > 15 else 'medium' if quality > 8 else 'low']
        
        # Get uploaded files
        files = request.files.getlist('images')
        
        if not files:
            return jsonify({'error': 'No images provided'}), 400
            
        # Validate files
        for file in files:
            if not allowed_file(file.filename):
                return jsonify({'error': f'Invalid file type: {file.filename}'}), 400
        
        # Create a temporary directory for processing
        with tempfile.TemporaryDirectory() as temp_dir:
            # First save all files
            saved_files = []
            for file in files:
                filename = secure_filename(file.filename)
                filepath = os.path.join(temp_dir, filename)
                file.save(filepath)
                saved_files.append(filepath)
            
            # Determine target size from saved files
            max_width = 0
            max_height = 0
            
            print("Calculating target size...")  # Debug log
            for filepath in saved_files:
                with Image.open(filepath) as img:
                    max_width = max(max_width, img.size[0])
                    max_height = max(max_height, img.size[1])
            
            target_size = (max_width, max_height)
            print(f"Target size: {target_size}")  # Debug log
            
            # Process all images
            processed_images = []
            print("Starting image processing...")  # Debug log
            
            for filepath in saved_files:
                filename = os.path.basename(filepath)
                print(f"Processing {filename}")  # Debug log
                
                with Image.open(filepath) as img:
                    processed_img = process_image(img, target_size, scale_up, interpolation_method)
                    processed_images.append(processed_img)
                    print(f"Processed {filename}: mode={processed_img.mode}, size={processed_img.size}")  # Debug log
            
            if not processed_images:
                raise ValueError("No images were successfully processed")
            
            # Convert to numpy arrays
            frames = []
            for img in processed_images:
                # Convert RGBA to RGB with white background
                background = Image.new('RGB', img.size, (255, 255, 255))
                background.paste(img, mask=img.split()[3])
                frames.append(np.array(background))
            
            print(f"Number of frames: {len(frames)}")  # Debug log
            print(f"Frame shapes: {[frame.shape for frame in frames]}")  # Debug log
            
            # Create output buffer
            output_buffer = io.BytesIO()
            
            try:
                print("Starting GIF generation...")  # Debug log
                
                # Save as GIF using imageio
                imageio.mimsave(
                    output_buffer,
                    frames,
                    format='GIF',
                    duration=frame_delay,
                    loop=0  # Loop forever
                )
                
                print("GIF generation completed")  # Debug log
                
                # Reset buffer position
                output_buffer.seek(0)
                
                # Return the GIF
                return send_file(
                    output_buffer,
                    mimetype='image/gif',
                    as_attachment=True,
                    download_name='generated.gif'
                )
            except Exception as e:
                print(f"Error in GIF generation: {str(e)}")  # Debug log
                print(traceback.format_exc())  # Print full traceback
                raise
            
    except Exception as e:
        print(f"Error processing images: {str(e)}")  # Debug log
        print(traceback.format_exc())  # Print full traceback
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True) 