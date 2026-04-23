// This script verifies the Transfer Form logic by checking the React component state
// Run this in the browser console while the Transfer Stock form is open

console.log('=== Transfer Form Verification ===\n');

// 1. Check if the select element exists
const select = document.querySelector('[data-testid="transfer-type-select"]');
if (!select) {
    console.error('❌ Transfer Type select not found!');
} else {
    console.log('✅ Transfer Type select found');
    console.log('   Current value:', select.value);
    console.log('   Options:', Array.from(select.options).map(o => o.value).join(', '));
}

// 2. Check if labels are rendering correctly for current transfer type
const labels = Array.from(document.querySelectorAll('label'))
    .map(l => l.textContent.trim())
    .filter(t => t.includes('Source') || t.includes('Destination'));

console.log('\n✅ Current labels visible:');
labels.forEach(l => console.log('   -', l));

// 3. Test changing the value
console.log('\n🧪 Testing value change...');
console.log('Changing to "W to S"...');

select.value = 'W to S';
const changeEvent = new Event('change', { bubbles: true, cancelable: true });
select.dispatchEvent(changeEvent);

// Wait a bit for React to update
setTimeout(() => {
    const newLabels = Array.from(document.querySelectorAll('label'))
        .map(l => l.textContent.trim())
        .filter(t => t.includes('Source') || t.includes('Destination'));
    
    console.log('\n✅ Labels after change:');
    newLabels.forEach(l => console.log('   -', l));
    
    if (newLabels.some(l => l.includes('Destination Store'))) {
        console.log('\n✅ SUCCESS! Form logic is working correctly!');
    } else {
        console.log('\n❌ FAILED! Labels did not change. React onChange not triggered.');
    }
}, 500);
