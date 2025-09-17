const { HighLevel } = require('@gohighlevel/api-client');
const client = new HighLevel({ privateIntegrationToken: process.env.PRIVATE_INTEGRATION_TOKEN });
const svc = client.contacts;
const axios = require('axios');

const integrationToken = process.env.PRIVATE_INTEGRATION_TOKEN;
const locationId = process.env.LOCATION_ID;
const ghlApiBaseUrl = process.env.GHL_API_BASE_URL || 'https://services.leadconnectorhq.com';
const groupId = process.env.GROUP_ID;

/**
 * Search contacts with advanced filters
 */

async function searchContactsAdvanced(req, res, next) {
  try {
    req.body.locationId = process.env.LOCATION_ID;
    req.body.pageLimit = req.body.pageLimit || 20;
    const result = await svc.searchContactsAdvanced(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * Proxy contact search to the LeadConnectorHQ /contacts/search/2 endpoint
 */
async function membersList(req, res, next) {
  try {
    const url = `${ghlApiBaseUrl}/contacts/search`;
    // Prepare headers: forward token-id and include integration auth
    if (!integrationToken) throw new Error('PRIVATE_INTEGRATION_TOKEN is not set');
    if (!locationId) throw new Error('LOCATION_ID is not set');

    // console.log('membersList: req.body before modification:', req.body);

    const headers = {
      'Authorization': `Bearer ${integrationToken}`,
      'Content-Type': 'application/json',
      'Version': '2021-07-28',
    };
    const reqBody = {
      "locationId": locationId,
      "page": req.body?.page || 1,
      "pageLimit": req.body?.pageLimit || 20,
      "sort": req.body?.sort || [],
      "filters": [
        {
          "group": "AND",
          "filters": [
            {
              "field": "activeCommunityGroups",
              "operator": "eq",
              "value": [groupId]
            }
          ]
        }
      ],
      ...req.body
    };

    const axiosConfig = {
      // If you need to set any axios config, do it here
      url: url,
      method: 'POST',
      headers: headers,
      data: reqBody
    };

    // console.log('axiosConfig:', axiosConfig);
    
    // console.log('membersList: axiosConfig:', axiosConfig);
    const response = await axios(axiosConfig);
    // console.log('membersList: response.data:', response.data);
    res.json(response.data);
  } catch (err) {
    console.error('Error in membersList:', err.message);
    next(err);
  }
}

// Get Contact by ID
async function getContactById(req, res, next) {
  try {
    const url = `${ghlApiBaseUrl}/contacts/${req.params.contactId}`;
    // Prepare headers: forward token-id and include integration auth
    if (!integrationToken) throw new Error('PRIVATE_INTEGRATION_TOKEN is not set');
    if (!locationId) throw new Error('LOCATION_ID is not set');

    // console.log('membersList: req.body before modification:', req.body);

    const headers = {
      'Authorization': `Bearer ${integrationToken}`,
      'Content-Type': 'application/json',
      'Version': '2021-07-28',
    };
    // const result = await svc.getContactById({ contactId: req.params.contactId }, { headers: req.headers });

    const axiosConfig = {
      // If you need to set any axios config, do it here
      url: url,
      method: 'GET',
      headers: headers,
    };

    console.log('axiosConfig:', axiosConfig);
    
    // console.log('membersList: axiosConfig:', axiosConfig);
    const response = await axios(axiosConfig);
    // console.log('membersList: response.data:', response.data);
    res.json(response.data.contact);
  } catch (err) {
    next(err);
  }
}

async function getDuplicateContact(req, res, next) {
  try {
    const params = { locationId: req.query.locationId, number: req.query.number, email: req.query.email };
    const result = await svc.getDuplicateContact(params, { headers: req.headers });
    res.json(result);
  } catch (err) {
    next(err);
  }
}



async function getAllTasks(req, res, next) {
  try {
    const result = await svc.getAllTasks({ contactId: req.query.contactId }, { headers: req.headers });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function createTask(req, res, next) {
  try {
    const { contactId, ...body } = req.body;
    const result = await svc.createTask({ contactId }, body, { headers: req.headers });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function getTask(req, res, next) {
  try {
    const params = { contactId: req.query.contactId, taskId: req.query.taskId };
    const result = await svc.getTask(params, { headers: req.headers });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function updateTask(req, res, next) {
  try {
    const { contactId, taskId, ...body } = req.body;
    const result = await svc.updateTask({ contactId, taskId }, body, { headers: req.headers });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function deleteTask(req, res, next) {
  try {
    const params = { contactId: req.query.contactId, taskId: req.query.taskId };
    await svc.deleteTask(params, { headers: req.headers });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

// Get Appointments for Contact
async function getAppointmentsForContact(req, res, next) {
  try {
    const result = await svc.getAppointmentsForContact({ contactId: req.query.contactId }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

// Add Tags to Contact
async function addTags(req, res, next) {
  try {
    const { contactId, ...body } = req.body;
    const result = await svc.addTags({ contactId }, body, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

// Remove Tags from Contact
async function removeTags(req, res, next) {
  try {
    const { contactId, ...body } = req.body;
    const result = await svc.removeTags({ contactId }, body, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

// Notes: Get, Create, Update, Delete
async function getAllNotes(req, res, next) {
  try {
    const result = await svc.getAllNotes({ contactId: req.query.contactId }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}
async function createNote(req, res, next) {
  try {
    const { contactId, ...body } = req.body;
    const result = await svc.createNote({ contactId }, body, { headers: req.headers });
    res.status(201).json(result);
  } catch (err) { next(err); }
}
async function getNote(req, res, next) {
  try {
    const params = { contactId: req.query.contactId, id: req.query.id };
    const result = await svc.getNote(params, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}
async function updateNote(req, res, next) {
  try {
    const { contactId, id, ...body } = req.body;
    const result = await svc.updateNote({ contactId, id }, body, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}
async function deleteNote(req, res, next) {
  try {
    const params = { contactId: req.query.contactId, id: req.query.id };
    await svc.deleteNote(params, { headers: req.headers });
    res.status(204).end();
  } catch (err) { next(err); }
}

// Upsert Contact
async function upsertContact(req, res, next) {
  try {
    const result = await svc.upsertContact(req.body, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

// Get Contacts by Business ID
async function getContactsByBusinessId(req, res, next) {
  try {
    const params = { businessId: req.query.businessId, limit: req.query.limit, skip: req.query.skip };
    const result = await svc.getContactsByBusinessId(params, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

// Add/Remove Followers
async function addFollowersContact(req, res, next) {
  try {
    const { contactId, ...body } = req.body;
    const result = await svc.addFollowersContact({ contactId }, body, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}
async function removeFollowersContact(req, res, next) {
  try {
    const { contactId, ...body } = req.body;
    const result = await svc.removeFollowersContact({ contactId }, body, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

// Bulk tag and business operations
async function createAssociation(req, res, next) {
  try {
    const { type, ...body } = req.body;
    const result = await svc.createAssociation({ type }, body, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}
async function addRemoveContactFromBusiness(req, res, next) {
  try {
    const result = await svc.addRemoveContactFromBusiness(req.body, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

// Campaign workflow operations
async function addContactToCampaign(req, res, next) {
  try {
    const { contactId, campaignId } = req.body;
    const result = await svc.addContactToCampaign({ contactId, campaignId }, req.body, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}
async function removeContactFromCampaign(req, res, next) {
  try {
    const { contactId, campaignId } = req.body;
    const result = await svc.removeContactFromCampaign({ contactId, campaignId }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}
async function removeContactFromEveryCampaign(req, res, next) {
  try {
    const { contactId } = req.body;
    const result = await svc.removeContactFromEveryCampaign({ contactId }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

// Workflow operations
async function addContactToWorkflow(req, res, next) {
  try {
    const { contactId, workflowId } = req.body;
    const result = await svc.addContactToWorkflow({ contactId, workflowId }, req.body, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}
async function deleteContactToWorkflow(req, res, next) {
  try {
    const { contactId, workflowId } = req.body;
    const result = await svc.deleteContactToWorkflow({ contactId, workflowId }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

module.exports = {
  searchContactsAdvanced,
  membersList,
  getDuplicateContact,
  getContactById,
  getAllTasks,
  createTask,
  getTask,
  updateTask,
  deleteTask,
  getAppointmentsForContact,
  addTags,
  removeTags,
  getAllNotes,
  createNote,
  getNote,
  updateNote,
  deleteNote,
  upsertContact,
  getContactsByBusinessId,
  addFollowersContact,
  removeFollowersContact,
  createAssociation,
  addRemoveContactFromBusiness,
  addContactToCampaign,
  removeContactFromCampaign,
  removeContactFromEveryCampaign,
  addContactToWorkflow,
  deleteContactToWorkflow
};