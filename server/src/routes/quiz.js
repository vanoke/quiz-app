import { Router } from 'express';
import {
  listMyQuizzes,
  getQuiz,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  uploadImage,
  createQuestion,
  updateQuestion,
  deleteQuestion,
} from '../controllers/quizController.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

router.use(authMiddleware);

// Список и CRUD квизов
router.get('/my', requireRole('host'), listMyQuizzes);
router.post('/', requireRole('host'), createQuiz);
router.put('/:id', requireRole('host'), updateQuiz);
router.delete('/:id', requireRole('host'), deleteQuiz);

// Вопросы
router.post('/:quizId/questions', requireRole('host'), createQuestion);
router.put('/questions/:questionId', requireRole('host'), updateQuestion);
router.delete('/questions/:questionId', requireRole('host'), deleteQuestion);

// Загрузка картинки
router.post('/upload', requireRole('host'), upload.single('image'), uploadImage);

// Просмотр квиза (в конце — чтобы не перехватывал /my, /upload и т.д.)
router.get('/:id', getQuiz);

export default router;