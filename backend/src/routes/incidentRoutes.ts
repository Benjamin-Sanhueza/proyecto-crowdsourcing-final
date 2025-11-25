import { Router } from 'express';
import { verifyToken, isAdmin } from '../middleware/authMiddleware';
import upload from '../middleware/multerConfig';
import { deleteIncident } from '../controllers/incidentController';

import {
  createIncident,
  getAllIncidents,
  getUserIncidents,
  updateIncidentStatus,
} from '../controllers/incidentController';

const router = Router();

router.use(verifyToken);

router.post('/', upload.array('images', 3), createIncident);
router.get('/user', getUserIncidents);

router.get('/', isAdmin, getAllIncidents);
router.put('/:id', isAdmin, updateIncidentStatus);
router.delete('/:id', isAdmin, deleteIncident);
router.delete('/:id', isAdmin, deleteIncident);

export default router;