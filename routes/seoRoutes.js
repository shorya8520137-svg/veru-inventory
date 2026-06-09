const express = require('express');
const router = express.Router();
const SEOController = require('../controllers/seoController');
const { authenticateToken } = require('../middleware/auth');

router.post('/audit/run', authenticateToken, SEOController.runAudit);
router.get('/audit/status', authenticateToken, SEOController.getAuditStatus);

router.get('/keywords', authenticateToken, SEOController.getKeywords);
router.post('/keywords/add', authenticateToken, SEOController.addKeyword);

router.get('/competitors', authenticateToken, SEOController.getCompetitors);

router.get('/tasks', authenticateToken, SEOController.getTasks);
router.get('/tasks/:id', authenticateToken, SEOController.getTaskDetail);
router.post('/tasks/:id/execute', authenticateToken, SEOController.executeTask);
router.post('/tasks/approve/:id', authenticateToken, SEOController.approveTask);
router.post('/tasks/skip/:id', authenticateToken, SEOController.skipTask);

router.get('/copilot/status', authenticateToken, SEOController.getCopilotStatus);
router.post('/copilot/toggle', authenticateToken, SEOController.toggleCopilot);
router.post('/copilot/pause', authenticateToken, SEOController.pauseCopilot);
router.get('/copilot/history', authenticateToken, SEOController.getCopilotHistory);

router.post('/inventorygpt-query', authenticateToken, SEOController.inventorygptQuery);
router.post('/llm-query', authenticateToken, SEOController.llmQuery);
router.post('/llm-phase', authenticateToken, SEOController.llmPhaseQuery);
router.get('/research', authenticateToken, SEOController.getResearch);
router.get('/local-seo', authenticateToken, SEOController.getLocalSEO);
router.get('/quality-assurance', authenticateToken, SEOController.getQualityAssurance);

router.get('/execution-log', authenticateToken, SEOController.getExecutionLog);
router.get('/execution-stats', authenticateToken, SEOController.getExecutionStats);

router.post('/insights/generate', authenticateToken, SEOController.generateInsight);
router.post('/insights/execute', authenticateToken, SEOController.executeInsight);

router.get('/analytics/dashboard', authenticateToken, SEOController.getAnalyticsDashboard);

router.get('/schema/:pageId', authenticateToken, SEOController.getSchema);
router.post('/schema/:pageId', authenticateToken, SEOController.applySchema);

router.get('/implementation/meta/:pageId', authenticateToken, SEOController.getMeta);
router.post('/implementation/meta/:pageId', authenticateToken, SEOController.applyMeta);

module.exports = router;
