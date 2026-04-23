# Manual Verification Steps for Self Transfer Form

## Issue
The Transfer Type dropdown is not changing when Puppeteer tries to select different options. This is because React's controlled component prevents external DOM manipulation.

## Manual Test Steps

1. **Login to the system**
   - URL: http://localhost:3000/login
   - Email: admin@company.com
   - Password: Admin@123

2. **Navigate to Inventory**
   - Click on Inventory in the sidebar
   - URL: http://localhost:3000/inventory

3. **Open Transfer Stock Form**
   - Click the "Transfer Stock" button in the top navbar
   - A modal should open with the Self Transfer form

4. **Test Transfer Type Selection**
   - The form should show "Transfer Type" dropdown with options:
     - Warehouse to Warehouse (W to W)
     - Warehouse to Store (W to S)
     - Store to Store (S to S)
     - Store to Warehouse (S to W)

5. **Test W to W (Warehouse to Warehouse)**
   - Select "Warehouse to Warehouse" from dropdown
   - Expected: 
     - Source label should be "Source Warehouse"
     - Destination label should be "Destination Warehouse"
     - Both dropdowns should show warehouse options

6. **Test W to S (Warehouse to Store)**
   - Select "Warehouse to Store" from dropdown
   - Expected:
     - Source label should be "Source Warehouse"
     - Destination label should be "Destination Store"
     - Source shows warehouses, Destination shows stores

7. **Test S to W (Store to Warehouse)**
   - Select "Store to Warehouse" from dropdown
   - Expected:
     - Source label should be "Source Store"
     - Destination label should be "Destination Warehouse"
     - Source shows stores, Destination shows warehouses

8. **Test S to S (Store to Store)**
   - Select "Store to Store" from dropdown
   - Expected:
     - Source label should be "Source Store"
     - Destination label should be "Destination Store"
     - Both dropdowns should show store options

## Expected Behavior
When you select a different transfer type, the form should:
1. Update the source/destination labels
2. Show/hide the appropriate dropdowns
3. Clear any previously selected values
4. Display the correct options in each dropdown

## If Test Fails
If the dropdown doesn't change when you click it, check:
1. Browser console for JavaScript errors
2. Network tab for failed API calls
3. React DevTools to see if the component state is updating
