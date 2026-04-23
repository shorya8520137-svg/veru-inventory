# Quick Start Guide - Self Transfer & Timeline

## 🚀 Quick Overview

The Self Transfer Module allows you to move inventory between warehouses and stores with full audit traceability. The Store Timeline shows all inventory movements for each store.

## 📋 What's Ready

✅ Database tables created  
✅ Backend APIs implemented  
✅ Frontend components built  
✅ All routes registered  
✅ Documentation complete  

## 🎯 How to Use

### Self Transfer Module

1. **Navigate to Inventory → Self Transfer**
2. **Select Transfer Type:**
   - Warehouse → Warehouse (W→W)
   - Warehouse → Store (W→S)
   - Store → Warehouse (S→W)
   - Store → Store (S→S)

3. **Fill Form:**
   - Select Source (Warehouse/Store)
   - Select Destination (Warehouse/Store)
   - Add Items (Product, Quantity, Unit)
   - Optional: Enable Shipment, Select Courier, Set Delivery Date
   - Add Notes

4. **Submit:**
   - Click "Initiate Transfer"
   - System creates transfer record
   - Timeline events created automatically

### Store Timeline

1. **Navigate to Inventory → Store Timeline**
2. **Select Store** from dropdown
3. **Filter Events** (All, Incoming, Outgoing, Initial Stock)
4. **View Timeline:**
   - Color-coded events
   - Stock before/after
   - Timestamps
   - Notes
5. **Export** if needed

## 🔌 API Endpoints

### Create Transfer
```bash
POST /api/self-transfer
{
  "sourceType": "warehouse",
  "sourceId": 1,
  "destinationType": "store",
  "destinationId": 1,
  "items": [{"productId": 1, "transferQty": 10, "unit": "pcs"}],
  "requiresShipment": true,
  "courierPartner": "fedex",
  "notes": "Transfer notes"
}
```

### Get Timeline
```bash
GET /api/timeline?entityType=store&entityId=1&type=all
```

### Get All Transfers
```bash
GET /api/self-transfer
```

## 📊 Database Tables

| Table | Purpose |
|-------|---------|
| inventory_transfers | Transfer records |
| transfer_items | Items in each transfer |
| timeline_events | Audit trail of events |

## 🧪 Testing

### Test API
```bash
node test-self-transfer-api.js
```

### Verify Tables
```bash
cmd /c verify-tables.cmd
```

## 📁 Key Files

### Frontend
- `src/app/inventory/SelfTransferModule.jsx` - Transfer UI
- `src/app/inventory/StoreTimeline.jsx` - Timeline UI

### Backend
- `routes/selfTransferRoutes.js` - Transfer API
- `routes/timelineRoutes.js` - Timeline API
- `routes/warehouseManagementRoutes.js` - Warehouse/Store API

### Database
- `migrations/self_transfer_timeline.sql` - Migration

### Documentation
- `DATABASE_ANALYSIS_REPORT.md` - Database details
- `SELF_TRANSFER_IMPLEMENTATION_GUIDE.md` - Full guide
- `SELF_TRANSFER_STATUS_SUMMARY.md` - Status summary

## ⚙️ Configuration

### Environment Variables
```
NEXT_PUBLIC_API_BASE=https://api.giftgala.in
DB_HOST=api.giftgala.in
DB_USER=inventory_user
DB_PASSWORD=StrongPass@123
DB_NAME=inventory_db
```

### Server
- Backend: Node.js + Express
- Database: MySQL
- Frontend: Next.js + React

## 🔍 Troubleshooting

### Transfer Won't Create
- Check source and destination are different
- Verify available stock at source
- Ensure all required fields filled

### Timeline Not Showing
- Verify transfer was created
- Check store ID is correct
- Verify timeline events were created

### API Returns 404
- Check endpoint URL
- Verify authentication token
- Check server is running

## 📞 Support

### Documentation
1. Read `SELF_TRANSFER_IMPLEMENTATION_GUIDE.md`
2. Check `DATABASE_ANALYSIS_REPORT.md`
3. Review API examples in guide

### Testing
1. Run `test-self-transfer-api.js`
2. Check server logs
3. Verify database connection

### Deployment
1. Pull latest code: `git pull origin main`
2. Restart server: `pm2 restart server`
3. Verify: `pm2 logs server`

## ✅ Checklist

- [ ] Database tables verified
- [ ] Backend APIs tested
- [ ] Frontend components loaded
- [ ] Transfer created successfully
- [ ] Timeline events showing
- [ ] All CRUD operations working
- [ ] Shipment tracking working
- [ ] Export functionality working

## 🎓 Learning Resources

1. **API Documentation** - See SELF_TRANSFER_IMPLEMENTATION_GUIDE.md
2. **Database Schema** - See DATABASE_ANALYSIS_REPORT.md
3. **Code Examples** - See test-self-transfer-api.js
4. **Status Report** - See SELF_TRANSFER_STATUS_SUMMARY.md

## 🚀 Next Steps

1. Pull code to server
2. Restart Node.js
3. Test with real data
4. Verify timeline events
5. Train staff
6. Go live

---

**Status:** ✅ READY FOR TESTING  
**Last Updated:** April 23, 2026
