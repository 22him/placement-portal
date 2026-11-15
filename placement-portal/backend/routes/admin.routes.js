import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import * as place from '../controllers/placement.controller.js';
import * as dash from '../controllers/dashboard.controller.js';
import { crud } from '../controllers/crud.js';
import CodingQuestion from '../models/CodingQuestion.js';
import AptitudeTest from '../models/AptitudeTest.js';

const r = Router();
r.use(protect, authorize('admin'));

const coding = crud(CodingQuestion, { searchFields: ['title', 'topic'], sort: { topic: 1, title: 1 }, label: 'Question' });
const aptitude = crud(AptitudeTest, { searchFields: ['title', 'topic'], sort: { category: 1, title: 1 }, label: 'Test' });

const mount = (path, c) => {
  r.get(path, c.list);
  r.post(path, c.create);
  r.get(`${path}/:id`, c.get);
  r.put(`${path}/:id`, c.update);
  r.delete(`${path}/:id`, c.remove);
};

r.get('/students', place.listStudents);
r.put('/students/:id', place.updateStudent);
r.delete('/students/:id', place.deleteStudent);

mount('/companies', place.companies);
r.get('/drives/:id/eligible', place.eligibleStudents);
mount('/drives', place.drives);

r.get('/applications', place.allApplications);
r.put('/applications/:id', place.updateApplication);

mount('/coding', coding);
mount('/aptitude', aptitude);

r.get('/analytics', dash.adminAnalytics);
r.get('/report', dash.placementReport);

export default r;
