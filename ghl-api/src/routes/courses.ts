import express from 'express';
import { 
  listCourses, 
  getCourseById, 
  createCourse, 
  updateCourse, 
  deleteCourse 
} from '@/controllers/coursesController';
const router = express.Router();

/**
 * @swagger
 * /courses:
 *   get:
 *     summary: List all courses (PUBLIC ACCESS)
 *     tags:
 *       - Courses
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Array of Course objects
 */
router.get('/', listCourses);

/**
 * @swagger
 * /courses/{id}:
 *   get:
 *     summary: Retrieve a course by ID
 *     tags:
 *       - Courses
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Course object
 */
router.get('/:id', getCourseById);

/**
 * @swagger
 * /courses:
 *   post:
 *     summary: Create a new course
 *     tags:
 *       - Courses
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Course created successfully
 */
router.post('/', createCourse);

/**
 * @swagger
 * /courses/{id}:
 *   put:
 *     summary: Update a course by ID
 *     tags:
 *       - Courses
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Course updated successfully
 */
router.put('/:id', updateCourse);

/**
 * @swagger
 * /courses/{id}:
 *   delete:
 *     summary: Delete a course by ID
 *     tags:
 *       - Courses
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       204:
 *         description: Course deleted successfully
 */
router.delete('/:id', deleteCourse);

export default router;