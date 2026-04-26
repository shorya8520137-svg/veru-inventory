# Store Inventory Fix - Deployment Checklist

## Pre-Deployment Checklist

### 1. Code Review
- [ ] Review `services/StockReductionService.js`
- [ ] Review `services/TimelineService.js`
- [ ] Review `services/BillingIntegrationService.js`
- [ ] Review `repositories/StockBatchRepository.js`
- [ ] Review `routes/storeTimelineRoutes.js`
- [ ] Review `routes/selfTransferRoutes.NEW.js`

### 2. Database Preparation
- [ ] Backup production database
- [ ] Review migration SQL: `migrations/create_store_timeline_table.sql`
- [ ] Test migration on staging database
- [ ] Verify `store_timeline` table created successfully
- [ ] Verify indexes created on `store_timeline`

### 3. Environment Check
- [ ] Node.js version compatible (v14+)
- [ ] Database connection pool size adequate
- [ ] Sufficient disk space for new table
- [ ] Application has write permissions to database

### 4. Backup Current System
- [ ] Backup current `routes/selfTransferRoutes.js`
- [ ] Backup current `server.js`
- [ ] Document current transfer behavior
- [ ] Export recent transfer records for comparison

## Deployment Steps

### Step 1: Database Migration
```bash
# Connect to production database
mysql -u username -p database_name

# Run migration
source migrations/create_store_timeline_table.sql;

# Verify table created
SHOW TABLES LIKE 'store_timeline';
DESCRIBE store_timeline;
SHOW INDEX FROM store_timeline;
```

**Verification:**
- [ ] `store_timeline` table exists
- [ ] All columns present (id, store_code, product_barcode, etc.)
- [ ] Indexes created (idx_store_product, idx_created_at, idx_reference)

### Step 2: Deploy Code
```powershell
# Run deployment script
cd veru-inventory-main
.\deploy-store-inventory-fix.ps1
```

**Verification:**
- [ ] Backup created: `routes/selfTransferRoutes.BACKUP.js`
- [ ] New routes deployed: `routes/selfTransferRoutes.js`
- [ ] All services exist in `services/` directory
- [ ] `server.js` has `storeTimelineRoutes` registered

### Step 3: Restart Application
```bash
# Option 1: PM2
pm2 restart veru-inventory

# Option 2: Direct
npm run start

# Option 3: Docker
docker-compose restart veru-inventory
```

**Verification:**
- [ ] Application started without errors
- [ ] No startup errors in logs
- [ ] Database connection successful
- [ ] All routes registered

### Step 4: Smoke Tests
```bash
# Test 1: Health check
curl http://localhost:3000/

# Test 2: Timeline API
curl http://localhost:3000/api/store-timeline/GURUGRAM-NH48?limit=5

# Test 3: Balance API
curl http://localhost:3000/api/store-timeline/GURUGRAM-NH48/balance/TEST123
```

**Verification:**
- [ ] Health check returns 200
- [ ] Timeline API returns valid JSON
- [ ] Balance API returns valid JSON
- [ ] No 500 errors in logs

## Post-Deployment Testing

### Test 1: Store-to-Store Transfer
```bash
curl -X POST http://localhost:3000/api/self-transfer \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "sourceType": "store",
    "sourceId": "GURUGRAM-NH48",
    "destinationType": "store",
    "destinationId": "BANGALORE-MG",
    "items": [
      {
        "productId": "Test Product | TEST123 | TEST123",
        "transferQty": 1
      }
    ],
    "notes": "Test transfer"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Store-to-store transfer completed successfully with billing integration",
  "transferId": "STF-1234567890",
  "transferType": "S to S",
  "billingIntegration": true,
  "transferResults": [...]
}
```

**Verification:**
- [ ] Response has `billingIntegration: true`
- [ ] Transfer ID returned
- [ ] No errors in response

### Test 2: Verify Billing Entry
```sql
SELECT * FROM bills 
WHERE invoice_number LIKE 'STF-%' 
AND bill_type = 'INTERNAL_TRANSFER'
ORDER BY created_at DESC 
LIMIT 1;
```

**Verification:**
- [ ] Billing entry exists
- [ ] `bill_type = 'INTERNAL_TRANSFER'`
- [ ] `customer_name` contains source and destination stores
- [ ] `items` JSON contains product details

### Test 3: Verify Stock Batches
```sql
-- Check source store (should have reduced stock)
SELECT * FROM stock_batches 
WHERE warehouse = 'GURUGRAM-NH48' 
AND prodcode = 'TEST123'
ORDER BY created_at DESC;

-- Check destination store (should have new batch)
SELECT * FROM stock_batches 
WHERE warehouse = 'BANGALORE-MG' 
AND prodcode = 'TEST123'
AND source_type = 'SELF_TRANSFER'
ORDER BY created_at DESC;
```

**Verification:**
- [ ] Source batch quantity reduced
- [ ] Destination batch created
- [ ] Destination batch has `parent_batch_id` linking to source
- [ ] Destination batch has `source_type = 'SELF_TRANSFER'`

### Test 4: Verify Timeline
```sql
SELECT * FROM store_timeline 
WHERE reference LIKE 'STF-%'
ORDER BY created_at DESC 
LIMIT 10;
```

**Verification:**
- [ ] Source OUT entry exists
- [ ] Destination IN entry exists
- [ ] Both entries have same reference number
- [ ] `balance_after` values are correct

### Test 5: Verify Timeline API
```bash
curl http://localhost:3000/api/store-timeline/GURUGRAM-NH48?limit=10
```

**Verification:**
- [ ] Returns timeline entries
- [ ] Entries include recent transfer
- [ ] `balance_after` values match database

## Monitoring Setup

### Log Monitoring
Monitor application logs for these messages:

**Success Messages:**
- `✅ Billing entry created: STF-xxx`
- `✅ Stock transfer completed: X units`
- `✅ Timeline entries created`
- `✅ Transaction committed successfully`

**Error Messages:**
- `❌ Transfer with billing failed:`
- `❌ Insufficient stock`
- `🔄 Transaction rolled back`

### Metrics to Track
- [ ] Transfer success rate (target: >99%)
- [ ] Billing entry creation rate (target: 100% for store-to-store)
- [ ] Average transfer time (target: <500ms)
- [ ] Transaction rollback rate (target: <1%)

### Alerts to Set Up
- [ ] Alert on transfer failures (>5 in 1 hour)
- [ ] Alert on transaction rollbacks (>10 in 1 hour)
- [ ] Alert on missing billing entries
- [ ] Alert on stock inconsistencies

## Rollback Procedure

### If Critical Issues Arise

**Step 1: Stop Application**
```bash
pm2 stop veru-inventory
```

**Step 2: Restore Previous Routes**
```powershell
Copy-Item routes/selfTransferRoutes.BACKUP.js routes/selfTransferRoutes.js -Force
```

**Step 3: Restart Application**
```bash
pm2 start veru-inventory
```

**Step 4: Verify Rollback**
```bash
# Test that transfers work with old logic
curl -X POST http://localhost:3000/api/self-transfer \
  -H "Content-Type: application/json" \
  -d '{...}'
```

**Step 5: Investigate Issues**
- [ ] Review application logs
- [ ] Check database errors
- [ ] Verify data consistency
- [ ] Document issues for fix

### Data Cleanup (If Needed)

**Find incomplete transfers:**
```sql
SELECT st.* FROM self_transfer st
LEFT JOIN bills b ON st.transfer_reference = b.invoice_number
WHERE st.transfer_type = 'S to S'
AND st.created_at > '2024-01-01'
AND b.id IS NULL;
```

**Rebuild timeline for affected stores:**
```bash
curl -X POST http://localhost:3000/api/store-timeline/GURUGRAM-NH48/rebuild \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Success Criteria

### Deployment Successful If:
- [ ] All smoke tests pass
- [ ] Store-to-store transfers create billing entries
- [ ] Stock is reduced using FIFO batches
- [ ] Timeline is updated with transfer entries
- [ ] No errors in application logs
- [ ] Transfer success rate >99%
- [ ] Response times <500ms

### Deployment Failed If:
- [ ] Transfers fail with errors
- [ ] Billing entries not created
- [ ] Stock not reduced
- [ ] Timeline not updated
- [ ] High error rate in logs
- [ ] Database errors

## Post-Deployment Tasks

### Day 1
- [ ] Monitor logs for errors
- [ ] Check transfer success rate
- [ ] Verify billing entries created
- [ ] Verify stock consistency
- [ ] Verify timeline completeness

### Week 1
- [ ] Review transfer patterns
- [ ] Check for data inconsistencies
- [ ] Optimize slow queries if needed
- [ ] Gather user feedback
- [ ] Document any issues

### Month 1
- [ ] Analyze transfer metrics
- [ ] Review stock accuracy
- [ ] Plan UI component development
- [ ] Consider enhancements
- [ ] Update documentation

## Support Contacts

### Technical Issues
- **Developer:** [Your Name]
- **Database Admin:** [DBA Name]
- **DevOps:** [DevOps Name]

### Escalation Path
1. Check logs and error messages
2. Review this checklist
3. Consult `IMPLEMENTATION_COMPLETE.md`
4. Contact developer
5. Rollback if critical

## Documentation References

- **Implementation Guide:** `.kiro/specs/store-inventory-fix/IMPLEMENTATION_COMPLETE.md`
- **Requirements:** `.kiro/specs/store-inventory-fix/requirements.md`
- **Architecture:** `.kiro/specs/store-inventory-fix/architecture_selection.md`
- **Design:** `.kiro/specs/store-inventory-fix/design.md`
- **Execution Summary:** `STORE_INVENTORY_FIX_EXECUTION_SUMMARY.md`

## Sign-Off

### Pre-Deployment
- [ ] Code reviewed by: _________________ Date: _______
- [ ] Database migration tested by: _________________ Date: _______
- [ ] Deployment plan approved by: _________________ Date: _______

### Post-Deployment
- [ ] Deployment completed by: _________________ Date: _______
- [ ] Smoke tests passed by: _________________ Date: _______
- [ ] Production verified by: _________________ Date: _______

---

**Deployment Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Complete | ⬜ Rolled Back

**Notes:**
_______________________________________________________________________
_______________________________________________________________________
_______________________________________________________________________
