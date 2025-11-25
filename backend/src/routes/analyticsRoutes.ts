import { Router } from 'express';
import { verifyToken, isAdmin } from '../middleware/authMiddleware';
import {
  upsertActiveStudents,
  listActiveStudents,
  regressionDataset, multiRegressionDataset,
} from '../controllers/analyticsController';

const router = Router();

router.use(verifyToken, isAdmin);

router.post('/active-students', upsertActiveStudents);
router.get('/active-students', listActiveStudents);
router.get('/regression-dataset', regressionDataset);
router.get('/multi-regression-dataset', multiRegressionDataset);
export default router;
