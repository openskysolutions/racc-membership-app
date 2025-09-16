const express = require('express');
const calendarsRoutes = require('./calendars');
const companiesRoutes = require('./companies');
const contactsRoutes = require('./contacts');
const conversationsRoutes = require('./conversations');
const coursesRoutes = require('./courses');
const customFieldsRoutes = require('./customFields');
const emailsRoutes = require('./emails');
const invoicesRoutes = require('./invoices');
const linksRoutes = require('./links');
const locationsRoutes = require('./locations');
const mediasRoutes = require('./medias');
const surveysRoutes = require('./surveys');
const usersRoutes = require('./users');

const router = express.Router();

router.use('/calendars', calendarsRoutes);
router.use('/companies', companiesRoutes);
router.use('/contacts', contactsRoutes);
router.use('/conversations', conversationsRoutes);
router.use('/courses', coursesRoutes);
router.use('/customFields', customFieldsRoutes);
router.use('/emails', emailsRoutes);
router.use('/invoices', invoicesRoutes);
router.use('/links', linksRoutes);
router.use('/locations', locationsRoutes);
router.use('/medias', mediasRoutes);
router.use('/surveys', surveysRoutes);
router.use('/users', usersRoutes);

module.exports = router;