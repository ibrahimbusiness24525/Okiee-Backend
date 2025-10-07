# Shop Logo System Documentation

## Overview
This system provides complete logo management functionality for shops, including upload, retrieval, and deletion of logo images.

## Features
- ✅ File upload with validation (image types only)
- ✅ Automatic file naming with user ID and timestamp
- ✅ File size limit (5MB)
- ✅ Old logo cleanup when uploading new ones
- ✅ Direct file serving with caching
- ✅ Error handling and cleanup
- ✅ Database integration

## API Endpoints

### 1. Upload Logo
**POST** `/api/shop/upload-logo`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Body:**
```
logo: <image file>
```

**Response:**
```json
{
  "success": true,
  "message": "Logo uploaded successfully!",
  "logo": "/uploads/shop-logos/userId_timestamp_filename.jpg",
  "shop": { ... }
}
```

### 2. Get Logo
**GET** `/api/shop/logo`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Logo retrieved successfully",
  "logo": "/uploads/shop-logos/userId_timestamp_filename.jpg"
}
```

### 3. Delete Logo
**DELETE** `/api/shop/logo`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Logo deleted successfully",
  "shop": { ... }
}
```

### 4. Serve Logo File (Direct Access)
**GET** `/api/shop/logo/:filename`

**Response:** Direct image file with proper headers and caching

## Frontend Integration

### Upload Logo (React/JavaScript)
```javascript
const uploadLogo = async (file) => {
  const formData = new FormData();
  formData.append('logo', file);
  
  try {
    const response = await fetch('/api/shop/upload-logo', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    const data = await response.json();
    if (data.success) {
      console.log('Logo uploaded:', data.logo);
      // Update UI with new logo
    }
  } catch (error) {
    console.error('Upload failed:', error);
  }
};
```

### Get Logo
```javascript
const getLogo = async () => {
  try {
    const response = await fetch('/api/shop/logo', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    if (data.success) {
      // Display logo: <img src={data.logo} alt="Shop Logo" />
      return data.logo;
    }
  } catch (error) {
    console.error('Failed to get logo:', error);
  }
};
```

### Display Logo in Frontend
```jsx
// React component example
const ShopLogo = () => {
  const [logoUrl, setLogoUrl] = useState(null);
  
  useEffect(() => {
    const fetchLogo = async () => {
      const logo = await getLogo();
      if (logo) {
        setLogoUrl(`http://localhost:8080${logo}`);
      }
    };
    fetchLogo();
  }, []);
  
  return (
    <div>
      {logoUrl ? (
        <img src={logoUrl} alt="Shop Logo" style={{maxWidth: '200px', maxHeight: '200px'}} />
      ) : (
        <p>No logo uploaded</p>
      )}
    </div>
  );
};
```

## File Structure
```
uploads/
└── shop-logos/
    ├── userId1_timestamp1_filename1.jpg
    ├── userId2_timestamp2_filename2.png
    └── ...
```

## Database Schema
The `logo` field in the Shop schema stores the relative path to the logo file:
```javascript
logo: {
  type: String,
  required: false,
}
```

## Security Features
- ✅ File type validation (only images)
- ✅ File size limits (5MB max)
- ✅ User authentication required
- ✅ Automatic cleanup of old files
- ✅ Unique filename generation

## Error Handling
- File not provided: 400 Bad Request
- Shop not found: 404 Not Found
- Invalid file type: 400 Bad Request
- File too large: 400 Bad Request
- Server errors: 500 Internal Server Error

## Usage Examples

### 1. Upload a new logo
```bash
curl -X POST http://localhost:8080/api/shop/upload-logo \
  -H "Authorization: Bearer your_token" \
  -F "logo=@/path/to/logo.jpg"
```

### 2. Get current logo
```bash
curl -X GET http://localhost:8080/api/shop/logo \
  -H "Authorization: Bearer your_token"
```

### 3. Delete logo
```bash
curl -X DELETE http://localhost:8080/api/shop/logo \
  -H "Authorization: Bearer your_token"
```

### 4. Access logo directly
```
http://localhost:8080/uploads/shop-logos/userId_timestamp_filename.jpg
```

## Notes
- Logo files are stored in `uploads/shop-logos/` directory
- Files are automatically cleaned up when new logos are uploaded
- Direct file access is available through the `/uploads/` static route
- All operations require user authentication
- Logo paths are stored relative to the uploads directory
