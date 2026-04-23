# Manual Test - Transfer Type Dropdown

## Quick Test in Browser Console

Open the browser console (F12) while the Transfer Stock form is open, and paste this:

```javascript
// Get the Transfer Type select
const select = document.querySelector('[data-testid="transfer-type-select"]');

// Log current value
console.log('Current value:', select.value);

// Change to "W to S"
select.value = 'W to S';

// Trigger change event
const event = new Event('change', { bubbles: true });
select.dispatchEvent(event);

// Check if labels changed
setTimeout(() => {
  const labels = Array.from(document.querySelectorAll('label'))
    .map(l => l.textContent.trim())
    .filter(t => t.includes('Source') || t.includes('Destination'));
  console.log('Labels after change:', labels);
}, 500);
```

## Expected Result
- Should see labels change to: "Source Warehouse *" and "Destination Store *"

## If it works:
- The React component is working correctly
- The issue is just with how Puppeteer triggers events

## If it doesn't work:
- There's a bug in the React component's onChange handler
