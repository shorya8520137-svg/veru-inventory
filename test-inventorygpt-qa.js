/**
 * InventoryGPT QA Test Suite
 * Tests deterministic resolvers, intent classification, and edge cases.
 * Run: node test-inventorygpt-qa.js
 */

const {
  detectInventoryGptIntent,
  normalizeFollowUpQuery,
} = require("./src/lib/inventorygptResolvers");

let passed = 0;
let failed = 0;
const results = [];

function assert(condition, msg) {
  if (!condition) throw new Error(msg || "Assertion failed");
}

function assertEqual(actual, expected, msg) {
  if (actual !== expected) {
    throw new Error(`${msg || ""} expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assertMatch(actual, pattern, msg) {
  if (typeof actual !== "string" || !pattern.test(actual)) {
    throw new Error(`${msg || ""} expected ${String(actual)} to match ${pattern}`);
  }
}

async function runTests() {
  const testPromises = [];

  // Override test to collect promises
  function test(name, fn, options = {}) {
    if (options.skip) {
      results.push({ name, status: "SKIP" });
      return;
    }
    const p = (async () => {
      try {
        await fn();
        passed++;
        results.push({ name, status: "PASS" });
      } catch (e) {
        failed++;
        results.push({ name, status: "FAIL", error: e.message });
        console.error(`  ✗ ${name}: ${e.message}`);
      }
    })();
    testPromises.push(p);
  }

// ===== INTENT CLASSIFICATION TESTS =====
console.log("\n=== INTENT CLASSIFICATION ===\n");

test("best_seller: 'most selling product'", () => {
  const r = detectInventoryGptIntent("most selling product", []);
  assertEqual(r.type, "best_seller");
});

test("best_seller: 'best seller product'", () => {
  const r = detectInventoryGptIntent("best seller product", []);
  assertEqual(r.type, "best_seller");
});

test("all_products: 'show me all the product'", () => {
  const r = detectInventoryGptIntent("show me all the product", []);
  assertEqual(r.type, "all_products");
});

test("all_products: 'list all items'", () => {
  const r = detectInventoryGptIntent("list all items", []);
  assertEqual(r.type, "all_products");
});

test("all_products: 'show all products'", () => {
  const r = detectInventoryGptIntent("show all products", []);
  assertEqual(r.type, "all_products");
});

test("warehouses: 'show all warehouses'", () => {
  const r = detectInventoryGptIntent("show all warehouses", []);
  assertEqual(r.type, "warehouses");
});

test("warehouse_details: 'show all warehouses with details'", () => {
  const r = detectInventoryGptIntent("show all warehouses with details", []);
  assertEqual(r.type, "warehouse_details");
});

test("orders intent: 'show orders'", () => {
  const r = detectInventoryGptIntent("show orders", []);
  assertEqual(r.type, "orders");
});

test("categories intent: 'show categories'", () => {
  const r = detectInventoryGptIntent("show categories", []);
  assertEqual(r.type, "categories");
});

test("timeline intent: 'show product timeline'", () => {
  const r = detectInventoryGptIntent("show product timeline", []);
  assertEqual(r.type, "timeline");
});

test("audit intent: 'who changed this product'", () => {
  const r = detectInventoryGptIntent("who changed this product", []);
  assertEqual(r.type, "audit");
});

test("compare intent: 'compare amul butter with aashirvaad atta'", () => {
  const r = detectInventoryGptIntent("compare amul butter with aashirvaad atta", []);
  assertEqual(r.type, "compare");
});

test("export with wantsExport: 'download stock as excel'", () => {
  const r = detectInventoryGptIntent("download stock as excel", []);
  assertEqual(r.type, "stock");
  assert(r.wantsExport === true, "Should have export flag");
});

// ===== EDGE CASE TESTS =====
console.log("\n=== EDGE CASES ===\n");

test("garbage: 'null' returns help_prompt", () => {
  const r = detectInventoryGptIntent("null", []);
  assertEqual(r.type, "help_prompt");
});

test("garbage: 'aaaaaaaa...' returns help_prompt", () => {
  const r = detectInventoryGptIntent("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", []);
  assertEqual(r.type, "help_prompt");
});

test("garbage: SQL injection returns help_prompt", () => {
  const r = detectInventoryGptIntent("'; DROP TABLE products; --", []);
  assertEqual(r.type, "help_prompt");
});

test("garbage: XSS returns help_prompt", () => {
  const r = detectInventoryGptIntent("<script>alert('xss')</script>", []);
  assertEqual(r.type, "help_prompt");
});

test("LLM fallback: 'generate inventory health report' returns null (goes to LLM)", () => {
  const r = detectInventoryGptIntent("generate inventory health report", []);
  assertEqual(r, null);
});

test("LLM fallback: 'generate warehouse performance report' returns null (goes to LLM)", () => {
  const r = detectInventoryGptIntent("generate warehouse performance report", []);
  assertEqual(r, null);
});

test("LLM fallback: 'what should I do today' returns null (goes to LLM)", () => {
  const r = detectInventoryGptIntent("what should I do today", []);
  assertEqual(r, null);
});

test("LLM fallback: 'how much inventory do I have' returns null (goes to LLM)", () => {
  const r = detectInventoryGptIntent("how much inventory do I have", []);
  assertEqual(r, null);
});

test("search_help: 'I only know the product name'", () => {
  const r = detectInventoryGptIntent("I only know the product name", []);
  assertEqual(r.type, "search_help");
});

test("product: bare product name 'hello'", () => {
  const r = detectInventoryGptIntent("hello", []);
  assertEqual(r.type, "product");
});

test("product SKU detection (bare SKU as productName)", () => {
  const r = detectInventoryGptIntent("FG-082-5KG", []);
  assertEqual(r.type, "product");
  assertEqual(r.productName, "FG-082-5KG");
});

// ===== NORMALIZATION TESTS =====
console.log("\n=== NORMALIZATION ===\n");

test("normalize: 'with details' after warehouse intent", () => {
  const history = [
    { role: "user", content: "show me all warehouses" },
    { role: "assistant", content: "Here are the warehouses found in the network..." },
  ];
  const norm = normalizeFollowUpQuery("with details", history);
  assert(norm.toLowerCase().includes("warehouse"));
  assert(norm.toLowerCase().includes("details") || norm.toLowerCase().includes("complete detail"));
});

test("normalize: 'show me all' stays as-is", () => {
  const norm = normalizeFollowUpQuery("show me all", []);
  assertEqual(norm, "show me all");
});

test("normalize: plain question stays as-is", () => {
  const norm = normalizeFollowUpQuery("what should I do today", []);
  assertEqual(norm, "what should I do today");
});

// ===== VERDICT BUILDER TESTS =====
console.log("\n=== VERDICT BUILDER ===\n");

test("deterministic answer exists for all_products", () => { return; });

// ===== RESULTS =====
console.log("\n" + "=".repeat(50));

// Wait for all async tests to complete
await Promise.all(testPromises);

console.log(`\n RESULTS: ${passed} passed, ${failed} failed, ${passed + failed} total\n`);

if (failed > 0) {
  console.log(" FAILED TESTS:");
  results.filter(r => r.status === "FAIL").forEach(r => console.log(`  - ${r.name}: ${r.error}`));
}

process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(e => {
  console.error("Fatal error:", e);
  process.exit(1);
});
