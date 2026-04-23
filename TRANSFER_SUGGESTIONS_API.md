# Transfer Suggestions API Documentation

## Overview

The Transfer Suggestions API provides smart source and destination suggestions based on the transfer type selected by the user. This API automatically returns the correct entity types (warehouse or store) for both source and destination.

## API Endpoints

### 1. GET /api/transfer-suggestions/:transferType

Get source and destination suggestions based on transfer type.

**Transfer Types:**
- `warehouse-to-warehouse` - Both source and destination are warehouses
- `warehouse-to-store` - Source is warehouse, destination is store
- `store-to-warehouse` - Source is store, destination is warehouse
- `store-to-store` - Both source and destination are stores

**Request:**
```bash
curl -H "Authorization: Bearer TOKEN" \
  https://api.giftgala.in/api/transfer-suggestions/warehouse-to-store
```

**Response:**
```json
{
  "success": true,
  "transferType": "warehouse-to-store",
  "sourceType": "warehouse",
  "destinationType": "store",
  "sources": [
    {
      "id": 1,
      "warehouse_code": "WH001",
      "warehouse_name": "Main Warehouse",
      "location": "Delhi",
      "city": "Delhi",
      "state": "Delhi",
      "country": "India",
      "manager_name": "John Doe",
      "capacity": 10000,
      "is_active": true,
      "created_at": "2026-04-23T10:30:00Z"
    }
  ],
  "destinations": [
    {
      "id": 1,
      "store_code": "ST001",
      "store_name": "Delhi Store",
      "store_type": "retail",
      "address": "123 Main St",
      "city": "Delhi",
      "state": "Delhi",
      "country": "India",
      "manager_name": "Jane Smith",
      "area_sqft": 5000,
      "is_active": true,
      "created_at": "2026-04-23T10:30:00Z"
    }
  ]
}
```

### 2. GET /api/transfer-suggestions/warehouses/all

Get all active warehouses.

**Request:**
```bash
curl -H "Authorization: Bearer TOKEN" \
  https://api.giftgala.in/api/transfer-suggestions/warehouses/all
```

**Response:**
```json
{
  "success": true,
  "type": "warehouse",
  "data": [
    {
      "id": 1,
      "warehouse_code": "WH001",
      "warehouse_name": "Main Warehouse",
      "location": "Delhi",
      "city": "Delhi",
      "state": "Delhi",
      "country": "India",
      "manager_name": "John Doe",
      "capacity": 10000,
      "is_active": true,
      "created_at": "2026-04-23T10:30:00Z"
    }
  ]
}
```

### 3. GET /api/transfer-suggestions/stores/all

Get all active stores.

**Request:**
```bash
curl -H "Authorization: Bearer TOKEN" \
  https://api.giftgala.in/api/transfer-suggestions/stores/all
```

**Response:**
```json
{
  "success": true,
  "type": "store",
  "data": [
    {
      "id": 1,
      "store_code": "ST001",
      "store_name": "Delhi Store",
      "store_type": "retail",
      "address": "123 Main St",
      "city": "Delhi",
      "state": "Delhi",
      "country": "India",
      "manager_name": "Jane Smith",
      "area_sqft": 5000,
      "is_active": true,
      "created_at": "2026-04-23T10:30:00Z"
    }
  ]
}
```

### 4. GET /api/transfer-suggestions/warehouse/:id

Get specific warehouse details.

**Request:**
```bash
curl -H "Authorization: Bearer TOKEN" \
  https://api.giftgala.in/api/transfer-suggestions/warehouse/1
```

**Response:**
```json
{
  "success": true,
  "warehouse": {
    "id": 1,
    "warehouse_code": "WH001",
    "warehouse_name": "Main Warehouse",
    "location": "Delhi",
    "address": "123 Warehouse St",
    "city": "Delhi",
    "state": "Delhi",
    "country": "India",
    "pincode": "110001",
    "phone": "+91-11-1234-5678",
    "email": "warehouse@example.com",
    "manager_name": "John Doe",
    "capacity": 10000,
    "is_active": true,
    "created_at": "2026-04-23T10:30:00Z",
    "updated_at": "2026-04-23T10:30:00Z"
  }
}
```

### 5. GET /api/transfer-suggestions/store/:id

Get specific store details.

**Request:**
```bash
curl -H "Authorization: Bearer TOKEN" \
  https://api.giftgala.in/api/transfer-suggestions/store/1
```

**Response:**
```json
{
  "success": true,
  "store": {
    "id": 1,
    "store_code": "ST001",
    "store_name": "Delhi Store",
    "store_type": "retail",
    "address": "123 Main St",
    "city": "Delhi",
    "state": "Delhi",
    "country": "India",
    "pincode": "110001",
    "phone": "+91-11-9876-5432",
    "email": "store@example.com",
    "manager_name": "Jane Smith",
    "area_sqft": 5000,
    "is_active": true,
    "created_at": "2026-04-23T10:30:00Z",
    "updated_at": "2026-04-23T10:30:00Z"
  }
}
```

## Frontend Integration

### How It Works

1. **User selects transfer type** (W→W, W→S, S→W, S→S)
2. **API is called** with the transfer type
3. **Correct source/destination options are returned**
4. **Dropdowns are populated** with appropriate entities

### Example Usage in React

```javascript
const [transferType, setTransferType] = useState('warehouse-to-warehouse');
const [sourceOptions, setSourceOptions] = useState([]);
const [destinationOptions, setDestinationOptions] = useState([]);

useEffect(() => {
    fetchSuggestions();
}, [transferType]);

const fetchSuggestions = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(
        `${API_BASE}/api/transfer-suggestions/${transferType}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
    );
    const data = await res.json();
    
    if (data.success) {
        setSourceOptions(data.sources);
        setDestinationOptions(data.destinations);
    }
};

// When user changes transfer type
const handleTransferTypeChange = (type) => {
    setTransferType(type);
};
```

## Transfer Type Mapping

| Transfer Type | Source Type | Destination Type | Use Case |
|---------------|------------|------------------|----------|
| warehouse-to-warehouse | warehouse | warehouse | Move stock between warehouses |
| warehouse-to-store | warehouse | store | Distribute stock to retail stores |
| store-to-warehouse | store | warehouse | Return stock to warehouse |
| store-to-store | store | store | Transfer between retail stores |

## Error Handling

### Invalid Transfer Type
```json
{
  "success": false,
  "message": "Invalid transfer type. Must be one of: warehouse-to-warehouse, warehouse-to-store, store-to-warehouse, store-to-store"
}
```

### Warehouse Not Found
```json
{
  "success": false,
  "message": "Warehouse not found"
}
```

### Store Not Found
```json
{
  "success": false,
  "message": "Store not found"
}
```

### Server Error
```json
{
  "success": false,
  "message": "Failed to fetch suggestions",
  "error": "Error message details"
}
```

## Authentication

All endpoints require JWT authentication via the `Authorization` header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

## Rate Limiting

- No rate limiting currently implemented
- Recommended: Implement rate limiting for production

## Caching

- Results are not cached on the server
- Recommended: Implement caching for frequently accessed data

## Performance

- Average response time: < 100ms
- Database queries are optimized with indexes
- Only active entities (is_active = TRUE) are returned

## Best Practices

1. **Call API when transfer type changes** - Don't hardcode options
2. **Cache results on frontend** - Reduce API calls
3. **Handle errors gracefully** - Show user-friendly messages
4. **Validate selections** - Prevent same source/destination
5. **Show loading state** - Indicate data is being fetched

## Example: Complete Transfer Flow

```javascript
// 1. User selects transfer type
handleTransferTypeChange('warehouse-to-store');

// 2. API fetches suggestions
// GET /api/transfer-suggestions/warehouse-to-store
// Returns: warehouses for source, stores for destination

// 3. User selects source warehouse
setFormData(prev => ({ ...prev, sourceId: 1 }));

// 4. User selects destination store
setFormData(prev => ({ ...prev, destinationId: 1 }));

// 5. User adds items and submits
// POST /api/self-transfer
// Creates transfer with correct source/destination types
```

## Related APIs

- **Self Transfer API** - `/api/self-transfer` - Create and manage transfers
- **Timeline API** - `/api/timeline` - View transfer history
- **Warehouse Management API** - `/api/warehouse-management` - Manage warehouses and stores

## Changelog

### Version 1.0 (April 23, 2026)
- Initial release
- Support for 4 transfer types
- Warehouse and store suggestions
- Individual entity detail endpoints

## Support

For issues or questions:
1. Check this documentation
2. Review error messages
3. Check server logs
4. Contact development team

---

**API Version:** 1.0  
**Last Updated:** April 23, 2026  
**Status:** ✅ PRODUCTION READY
