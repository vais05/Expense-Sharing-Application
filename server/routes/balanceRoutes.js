import express from 'express';
import { getGroupBalances, getUserBalances } from '../controllers/balanceController.js';

const router = express.Router();

router.get('/group/:groupId', getGroupBalances);
router.get('/user/:userId', getUserBalances);

export default router;
