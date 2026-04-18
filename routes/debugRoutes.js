const express = require('express');
const router = express.Router();
const debugController = require('../controllers/debugController');
const http = require('http');

router.get('/dispatch-dimensions/:barcode?', debugController.testDispatchDimensions);

/**
 * Test n8n webhook connectivity directly from server
 * Usage: GET /api/debug/test-webhook?message=hello&language=ta&source=admin
 */
router.get('/test-webhook', async (req, res) => {
    const { message = 'hello', language = 'ta', source = 'admin' } = req.query;
    const body = JSON.stringify({ type: 'message', message, language, source });
    console.log(`[DEBUG test-webhook] Sending → ${body}`);

    const options = {
        hostname: '13.215.172.213',
        port: 5678,
        path: '/webhook/6ba285e1-413c-4c00-9a93-d653daaa1030',
        method: 'POST',
        timeout: 10000,
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body, 'utf8')
        }
    };

    const result = await new Promise((resolve) => {
        const r = http.request(options, (resp) => {
            let data = '';
            resp.setEncoding('utf8');
            resp.on('data', chunk => data += chunk);
            resp.on('end', () => resolve({ status: resp.statusCode, body: data }));
        });
        r.on('error', e => resolve({ error: e.message }));
        r.on('timeout', () => { r.destroy(); resolve({ error: 'timeout after 10s' }); });
        r.write(body, 'utf8');
        r.end();
    });

    console.log(`[DEBUG test-webhook] Response →`, result);
    res.json({ sent: JSON.parse(body), received: result });
});

module.exports = router;
