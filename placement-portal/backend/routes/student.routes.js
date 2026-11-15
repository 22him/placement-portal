import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { uploadPdf } from '../middleware/upload.js';
import * as profile from '../controllers/profile.controller.js';
import * as dash from '../controllers/dashboard.controller.js';
import * as resume from '../controllers/resume.controller.js';
import * as interview from '../controllers/interview.controller.js';
import * as apt from '../controllers/aptitude.controller.js';
import * as coding from '../controllers/coding.controller.js';
import * as roadmap from '../controllers/roadmap.controller.js';
import * as place from '../controllers/placement.controller.js';
import * as rec from '../controllers/recommendation.controller.js';

const r = Router();
r.use(protect, authorize('student'));

r.get('/profile', profile.getProfile);
r.put('/profile', profile.updateProfile);
r.get('/dashboard', dash.studentDashboard);
r.get('/analytics', dash.studentAnalytics);

r.get('/resume/roles', resume.roles);
r.post('/resume/analyze', uploadPdf, resume.analyzeResume);
r.get('/resume', resume.listResumes);
r.get('/resume/:id', resume.getResume);
r.delete('/resume/:id', resume.deleteResume);

r.post('/interview/generate', interview.generate);
r.get('/interview', interview.list);
r.get('/interview/:id', interview.get);
r.post('/interview/:id/answer', interview.answer);
r.post('/interview/:id/finish', interview.finish);
r.delete('/interview/:id', interview.remove);

r.get('/aptitude/tests', apt.listTests);
r.get('/aptitude/tests/:id', apt.getTest);
r.post('/aptitude/tests/:id/submit', apt.submitTest);
r.get('/aptitude/results', apt.myResults);
r.get('/aptitude/recommendations', apt.recommendations);

r.get('/coding', coding.list);
r.get('/coding/progress', coding.progress);
r.get('/coding/recommendations', coding.recommendations);
r.post('/coding/:id/submit', coding.submit);
r.delete('/coding/:id/submit', coding.unmark);

r.get('/roadmap', roadmap.current);
r.post('/roadmap/generate', roadmap.generate);
r.patch('/roadmap/:id/task', roadmap.toggleTask);
r.delete('/roadmap/:id', roadmap.remove);

r.get('/drives', place.studentDrives);
r.post('/drives/:id/apply', place.apply);
r.delete('/drives/:id/apply', place.withdraw);
r.get('/applications', place.myApplications);
r.get('/recommendations/companies', rec.companyRecommendations);

export default r;
