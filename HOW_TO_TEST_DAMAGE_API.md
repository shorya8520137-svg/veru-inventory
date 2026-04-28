# 🧪 Damage API Test Kaise Karein

## Step 1: Token Nikalo

1. **Browser mein app kholo** (localhost ya production)
2. **Login karo**
3. **F12 press karo** (Developer Console)
4. **Console tab mein jao**
5. **Yeh command run karo:**
   ```javascript
   localStorage.getItem('token')
   ```
6. **Token copy karo** (quotes ke bina)

## Step 2: API Test Karo

Terminal mein yeh command run karo:

```bash
cd veru-inventory-main
node test-damage-api-direct.js "YOUR_TOKEN_HERE"
```

**Example:**
```bash
node test-damage-api-direct.js "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## Expected Output

### ✅ Success Case:
```
🧪 Testing Damage API Directly

═══════════════════════════════════════════════

📤 Request:
   Endpoint: https://api.giftgala.in/api/damage-recovery/damage
   Payload: {
     "product_type": "bra Product 178",
     "barcode": "433967585453",
     "inventory_location": "GGM_WH",
     "quantity": 1,
     "action_type": "damage",
     "processed_by": "Mahesh"
   }

═══════════════════════════════════════════════

📥 Response Status: 201 Created

✅ SUCCESS!

Response: {
  "success": true,
  "message": "Damage reported successfully",
  "damage_id": 123,
  "stock_updated": true
}

═══════════════════════════════════════════════
✅ Damage API is working correctly!
═══════════════════════════════════════════════
```

### ❌ Error Case:
```
📥 Response Status: 400 Bad Request

❌ FAILED!

Response: {
  "success": false,
  "message": "Insufficient stock. Available: 0, Required: 1"
}

═══════════════════════════════════════════════
❌ Error Details:
   Status: 400
   Message: Insufficient stock. Available: 0, Required: 1
═══════════════════════════════════════════════
```

## Common Errors

### 1. "Insufficient stock"
**Reason:** Product ka stock nahi hai warehouse mein  
**Solution:** 
- Inventory page pe check karo stock
- Different product select karo jiska stock ho
- Ya pehle stock add karo

### 2. "product_type, barcode, inventory_location are required"
**Reason:** Required fields missing hain  
**Solution:** Payload check karo, saare fields bhare hone chahiye

### 3. "quantity must be greater than 0"
**Reason:** Quantity 0 ya negative hai  
**Solution:** Quantity 1 ya usse zyada honi chahiye

### 4. 401 Unauthorized
**Reason:** Token invalid ya expired hai  
**Solution:** Naya token nikalo (Step 1 repeat karo)

## Test Different Products

Script mein `testPayload` change karke different products test kar sakte ho:

```javascript
const testPayload = {
    product_type: "Your Product Name",
    barcode: "YOUR_BARCODE",
    inventory_location: "BLR_WH",  // or GGM_WH, etc.
    quantity: 1,
    action_type: "damage",
    processed_by: "Your Name"
};
```

## Agar API Kaam Kar Raha Hai

Agar direct API test successful hai, toh problem frontend mein hai:
1. Modal 2 baar submit ho raha hai (already fixed)
2. Wrong product select ho raha hai
3. Cache issue hai

## Agar API Kaam Nahi Kar Raha

Agar direct API test fail ho raha hai, toh problem backend mein hai:
1. Database connection issue
2. Stock calculation wrong
3. Transaction rollback ho raha hai

---

**Pehle yeh test karo, phir batao kya result aaya!** 🚀
