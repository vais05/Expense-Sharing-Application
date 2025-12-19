import express from 'express';
import { createSettlement, getGroupSettlements } from '../controllers/settlementController.js';

const router = express.Router();

router.post('/', createSettlement);
router.get('/group/:groupId', getGroupSettlements);

export default router;
