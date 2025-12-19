import express from 'express';
import {
  createGroup,
  getUserGroups,
  getGroupById,
  addGroupMember
} from '../controllers/groupController.js';

const router = express.Router();

router.post('/', createGroup);
router.get('/user/:userId', getUserGroups);
router.get('/:id', getGroupById);
router.post('/:groupId/members', addGroupMember);

export default router;
