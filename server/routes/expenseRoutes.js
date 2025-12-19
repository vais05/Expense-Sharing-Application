import express from 'express';
import {
  createExpense,
  getGroupExpenses,
  getExpenseById
} from '../controllers/expenseController.js';

const router = express.Router();

router.post('/', createExpense);
router.get('/group/:groupId', getGroupExpenses);
router.get('/:id', getExpenseById);

export default router;
