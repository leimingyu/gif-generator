# GIF Generator

A modern web application that allows users to create custom GIFs from multiple images with an intuitive drag-and-drop interface.

![GIF Generator Interface](screenshots/main-interface.png)

## Features

### Image Upload and Management
- Drag and drop multiple images or click to select files
- Supports JPG and PNG image formats
- 3x3 grid layout with vertical scrolling for multiple images
- Real-time image preview
- Reorder frames through drag-and-drop functionality
- Remove individual frames with one click
- Clear frame numbering for easy sequence tracking
- Visual indicators during drag-and-drop operations

### GIF Customization
- Adjustable frame delay
- Automatic image resizing and optimization
- Maintains aspect ratio of original images

### User Interface
- Clean, modern design with intuitive controls
- Responsive layout that works on different screen sizes
- Visual feedback for drag and drop operations
- Clear frame numbering and sequence visualization
- Easy-to-use control panel for GIF settings
- Preview section for the generated GIF
- One-click download of generated GIFs
- Reset functionality to start over

## Screenshots

### Main Interface
![Main Interface](screenshots/main-interface.png)
*The main interface showing the upload area and image grid*

### Image Sequence Grid
![Image Sequence](screenshots/image-sequence.png)
*3x3 grid layout with frame numbers and drag-drop functionality*

### GIF Generation Controls
![GIF Controls](screenshots/gif-controls.png)
*Controls for adjusting frame delay and quality settings*

### Generated GIF Preview
![GIF Preview](screenshots/gif-preview.png)
*Preview section showing the generated GIF with download option*

## Development Setup

### Prerequisites
- Python 3.x
- Node.js (for development tools)
- Git
- VSCode or your preferred IDE

### Setting Up the Development Environment

1. **Clone and Setup Virtual Environment**
```bash
# Clone the repository
git clone [repository-url]
cd gif-generator

# Create and activate virtual environment
python -m venv venv

# On Windows
venv\Scripts\activate

# On macOS/Linux
source venv/bin/activate

# Install development dependencies
pip install -r requirements-dev.txt
```

2. **Install Development Tools**
```bash
# Install Flask development server with debug mode
pip install flask-debug-toolbar

# Install testing frameworks
pip install pytest pytest-cov

# Install linting tools
pip install flake8 black isort
```

3. **Configure IDE (VSCode)**
- Install Python extension
- Set Python interpreter to virtual environment
- Configure linting and formatting:
```json
{
    "python.linting.enabled": true,
    "python.linting.flake8Enabled": true,
    "python.formatting.provider": "black",
    "editor.formatOnSave": true
}
```

### Development Workflow

1. **Running in Development Mode**
```bash
# Set development environment
export FLASK_ENV=development  # On Windows: set FLASK_ENV=development
export FLASK_DEBUG=1         # On Windows: set FLASK_DEBUG=1

# Start development server
python app.py
```

2. **Code Style and Quality**
```bash
# Format code
black .

# Sort imports
isort .

# Run linter
flake8

# Run tests with coverage
pytest --cov=.
```

3. **Building for Production**
```bash
# Set production environment
export FLASK_ENV=production  # On Windows: set FLASK_ENV=production

# Run production server (using gunicorn)
gunicorn app:app
```

## API Documentation

### REST Endpoints

#### Upload Images
```http
POST /api/upload
Content-Type: multipart/form-data

Request Body:
- files: Array of image files (JPG/PNG)

Response:
{
    "success": boolean,
    "message": string,
    "files": [
        {
            "filename": string,
            "size": number,
            "type": string
        }
    ]
}
```

#### Generate GIF
```http
POST /api/generate
Content-Type: application/json

Request Body:
{
    "frame_delay": number,  // milliseconds (100-2000)
    "quality": number,      // 1-20
    "files": [string]      // Array of filenames
}

Response:
{
    "success": boolean,
    "message": string,
    "gif_url": string      // URL to download generated GIF
}
```

#### Delete Image
```http
DELETE /api/images/:filename

Response:
{
    "success": boolean,
    "message": string
}
```

### Error Codes

| Code | Description |
|------|-------------|
| 200  | Success |
| 400  | Invalid request parameters |
| 413  | File too large |
| 415  | Unsupported file type |
| 500  | Server error |

### Rate Limits

- Maximum 10 requests per minute per IP
- Maximum 50MB total upload size per request
- Maximum 20 images per GIF

### WebSocket Events

#### Client -> Server
```javascript
// Update frame order
socket.emit('reorder_frames', {
    frames: ['frame1.jpg', 'frame2.jpg', ...]
});

// Update GIF settings
socket.emit('update_settings', {
    frame_delay: number,
    quality: number
});
```

#### Server -> Client
```javascript
// Progress updates
socket.on('generation_progress', {
    percent: number,
    stage: string
});

// Error notifications
socket.on('error', {
    code: string,
    message: string
});
```

## Troubleshooting

### Common Issues

1. **Upload Failures**
   - Check file size limits (max 50MB total)
   - Verify file formats (JPG/PNG only)
   - Ensure proper file permissions

2. **GIF Generation Issues**
   - Memory usage too high: Reduce image sizes
   - Slow generation: Reduce quality or number of frames
   - Black frames: Check image color modes

3. **Performance Issues**
   - Clear browser cache
   - Check browser console for errors
   - Monitor server logs for backend issues

### Debug Mode

To run the application in debug mode:
```bash
export FLASK_DEBUG=1
python app.py --debug
```

Debug logs will be available in:
- Browser console for frontend issues
- Terminal/log file for backend issues

## Technical Details

### Dependencies
- Python 3.x
- Flask (Web framework)
- Pillow (Image processing)
- imageio (GIF generation)
- numpy (Image array handling)

### Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd gif-generator
```

2. Install the required Python packages:
```bash
pip install -r requirements.txt
```

3. Start the Flask application:
```bash
python app.py
```

4. Open your web browser and navigate to:
```
http://localhost:5000
```

## Usage Guide

1. **Upload Images**
   - Drag and drop images onto the upload area, or
   - Click the upload area to select files from your computer

2. **Arrange Frames**
   - Drag images left or right to reorder them
   - Frame numbers update automatically
   - Click the × button to remove any frame
   - Use vertical scrolling to view all frames if you have more than 9 images

3. **Customize GIF Settings**
   - Adjust the frame delay (in milliseconds) to control animation speed
   - Use the quality slider to balance file size and image quality

4. **Generate and Download**
   - Click "Generate GIF" to create your animation
   - Preview the generated GIF in the result section
   - Click "Download GIF" to save to your computer

5. **Start Over**
   - Use the "Reset" button to clear all images and settings

## Browser Compatibility

The application has been tested and works on:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Notes

- Maximum recommended image size: 1920px (larger images will be automatically resized)
- Supported image formats: JPG, PNG
- GIF generation time may vary based on the number and size of input images
- The application processes images client-side for optimal performance

## Contributing

Feel free to submit issues, fork the repository, and create pull requests for any improvements.