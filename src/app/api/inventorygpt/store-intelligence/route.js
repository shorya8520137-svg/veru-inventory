import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const code = searchParams.get('code')
    if (!code) return NextResponse.json({ error: 'code required' }, { status: 400 })

    const conn = await pool.getConnection()

    // 1) Store details
    const [stores] = await conn.query(
      `SELECT * FROM stores WHERE store_code = ? AND is_active = 1 LIMIT 1`,
      [code]
    )
    if (!stores.length) { conn.release(); return NextResponse.json({ error: 'store not found' }, { status: 404 }) }
    const store = stores[0]

    // 2) Inventory snapshot
    const [inventory] = await conn.query(
      `SELECT COUNT(*) as totalItems, COALESCE(SUM(stock),0) as totalStock,
              SUM(stock*price) as inventoryValue,
              SUM(CASE WHEN stock>0 AND stock<=10 THEN 1 ELSE 0 END) as lowStockItems,
              SUM(CASE WHEN stock=0 THEN 1 ELSE 0 END) as outOfStockItems
       FROM store_inventory WHERE store_code = ?`,
      [code]
    )
    const inv = inventory[0]

    const [topProducts] = await conn.query(
      `SELECT product_name, barcode, stock, price, (stock*price) as value
       FROM store_inventory WHERE store_code = ? ORDER BY stock*price DESC LIMIT 10`,
      [code]
    )

    const [lowStock] = await conn.query(
      `SELECT product_name, barcode, stock FROM store_inventory
       WHERE store_code = ? AND stock > 0 AND stock <= 10 ORDER BY stock ASC LIMIT 10`,
      [code]
    )

    const [deadStock] = await conn.query(
      `SELECT si.product_name, si.barcode, si.stock, si.price
       FROM store_inventory si
       LEFT JOIN store_inventory_logs sil ON si.barcode = sil.barcode AND sil.movement_type = 'SALE'
       WHERE si.store_code = ? AND si.stock > 0
       GROUP BY si.id
       HAVING COALESCE(SUM(sil.quantity),0) = 0
       LIMIT 10`,
      [code]
    )

    // 3) Billing history (sales from the store)
    const [billingStats] = await conn.query(
      `SELECT COUNT(*) as totalBills, COALESCE(SUM(grand_total),0) as totalRevenue,
              COALESCE(AVG(grand_total),0) as avgBillValue,
              MAX(created_at) as lastBillDate
       FROM bills WHERE store_code = ?`,
      [code]
    )
    const bs = billingStats[0]

    const [recentBills] = await conn.query(
      `SELECT id, invoice_number as bill_number, created_at as bill_date, grand_total as total_amount, payment_mode, customer_name
       FROM bills WHERE store_code = ? ORDER BY created_at DESC LIMIT 10`,
      [code]
    )

    const [dailySales7] = await conn.query(
      `SELECT DATE(created_at) as date, COUNT(*) as bills, SUM(grand_total) as revenue
       FROM bills WHERE store_code = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
       GROUP BY DATE(created_at) ORDER BY date`,
      [code]
    )

    // 4) Performance score
    const stockScore = inv.totalItems > 0
      ? Math.round((1 - (inv.outOfStockItems + (inv.lowStockItems||0)*0.5) / inv.totalItems) * 40)
      : 0
    const revenueScore = bs.totalRevenue > 0
      ? Math.min(30, Math.round(Math.log10(bs.totalRevenue) * 6))
      : 0
    const activityScore = bs.totalBills > 0
      ? Math.min(20, Math.round((bs.totalBills / 30) * 20))
      : 0
    const recentScore = bs.lastBillDate
      ? Math.min(10, Math.round((1 - (Date.now() - new Date(bs.lastBillDate).getTime()) / (30*24*60*60*1000)) * 10))
      : 0
    const performanceScore = Math.min(100, stockScore + revenueScore + activityScore + recentScore)

    let healthStatus = 'Excellent'
    if (performanceScore < 40) healthStatus = 'Critical'
    else if (performanceScore < 60) healthStatus = 'Needs Attention'
    else if (performanceScore < 80) healthStatus = 'Good'

    // 5) AI summary
    const lines = []
    const activeStockPct = inv.totalItems > 0
      ? Math.round(((inv.totalItems - inv.outOfStockItems) / inv.totalItems) * 100)
      : 0
    if (inv.outOfStockItems > 0) {
      lines.push(`⚠️ ${inv.outOfStockItems} product(s) are out of stock — needs immediate restock.`)
    }
    if (inv.lowStockItems > 0) {
      lines.push(`📦 ${inv.lowStockItems} product(s) running low (≤10 units).`)
    }
    if (deadStock.length > 0) {
      const dv = deadStock.reduce((s, p) => s + Number(p.price) * p.stock, 0)
      lines.push(`🪦 ${deadStock.length} dead-stock items worth ₹${dv.toLocaleString()} — consider discounting.`)
    }
    if (bs.totalBills > 0) {
      lines.push(`💰 ${bs.totalBills} bills totalling ₹${Number(bs.totalRevenue).toLocaleString()} (avg ₹${Number(bs.avgBillValue).toFixed(0)}/bill).`)
    }
    if (bs.lastBillDate) {
      const daysSince = Math.floor((Date.now() - new Date(bs.lastBillDate).getTime()) / (24*60*60*1000))
      lines.push(`📅 Last sale was ${daysSince === 0 ? 'today' : daysSince + ' day(s) ago'}.`)
    }
    lines.push(`${activeStockPct}% of inventory is in-stock. Performance score: ${performanceScore}/100 (${healthStatus}).`)

    conn.release()

    return NextResponse.json({
      success: true,
      store: {
        id: store.id,
        code: store.store_code,
        name: store.store_name,
        type: store.store_type,
        address: store.address,
        city: store.city,
        state: store.state,
        pincode: store.pincode,
        phone: store.phone,
        email: store.email,
        manager: store.manager_name,
        area_sqft: store.area_sqft,
      },
      inventory: {
        totalItems: inv.totalItems,
        totalStock: inv.totalStock,
        inventoryValue: inv.inventoryValue,
        lowStockItems: inv.lowStockItems,
        outOfStockItems: inv.outOfStockItems,
        topProducts,
        lowStock,
        deadStock,
      },
      billing: {
        totalBills: bs.totalBills,
        totalRevenue: bs.totalRevenue,
        avgBillValue: bs.avgBillValue,
        lastBillDate: bs.lastBillDate,
        recentBills,
        dailySales7,
      },
      performance: {
        score: performanceScore,
        status: healthStatus,
        breakdown: { stockScore, revenueScore, activityScore, recentScore },
      },
      aiSummary: lines.join('\n'),
    })
  } catch (err) {
    console.error('store-intelligence error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
