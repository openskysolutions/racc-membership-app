/**
 * Minimal RACC API Server for Testing
 * Simple Express server with just the members endpoint
 */

const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Demo members data
const members = [
  {
    id: 'member_001',
    email: 'admin@racc.com',
    firstName: 'Sarah',
    lastName: 'Johnson',
    businessName: 'Johnson Real Estate Group',
    phone: '(435) 555-0101',
    website: 'https://johnsonrealestate.com',
    avatar: '/profile-placeholder.png',
    role: 'admin',
    status: 'active',
    memberSince: '2020-01-15',
    specialties: ['Commercial Real Estate', 'Property Management'],
    bio: 'Leading commercial real estate expert in Richfield with over 15 years of experience.',
    address: {
      street: '123 Main Street',
      city: 'Richfield',
      state: 'UT',
      zipCode: '84701'
    }
  },
  {
    id: 'member_002',
    email: 'demo@racc.com',
    firstName: 'Michael',
    lastName: 'Davis',
    businessName: 'Davis Construction LLC',
    phone: '(435) 555-0102',
    website: 'https://davisconstruction.com',
    avatar: '/profile-placeholder.png',
    role: 'member',
    status: 'active',
    memberSince: '2021-03-22',
    specialties: ['Residential Construction', 'Home Renovation'],
    bio: 'Quality construction services for Central Utah families and businesses.',
    address: {
      street: '456 Oak Avenue',
      city: 'Richfield',
      state: 'UT',
      zipCode: '84701'
    }
  },
  {
    id: 'member_003',
    email: 'moderator@racc.com',
    firstName: 'Jennifer',
    lastName: 'Smith',
    businessName: 'Smith Financial Services',
    phone: '(435) 555-0103',
    website: 'https://smithfinancial.com',
    avatar: '/profile-placeholder.png',
    role: 'moderator',
    status: 'active',
    memberSince: '2019-08-10',
    specialties: ['Financial Planning', 'Insurance', 'Investment Management'],
    bio: 'Helping Central Utah families and businesses achieve their financial goals.',
    address: {
      street: '789 Pine Street',
      city: 'Richfield',
      state: 'UT',
      zipCode: '84701'
    }
  },
  {
    id: 'member_004',
    email: 'member@racc.com',
    firstName: 'Robert',
    lastName: 'Wilson',
    businessName: 'Wilson Auto Repair',
    phone: '(435) 555-0104',
    website: 'https://wilsonauto.com',
    avatar: '/profile-placeholder.png',
    role: 'member',
    status: 'active',
    memberSince: '2022-01-05',
    specialties: ['Auto Repair', 'Diagnostics', 'Fleet Maintenance'],
    bio: 'Trusted automotive service for the Richfield community since 2022.',
    address: {
      street: '321 Elm Drive',
      city: 'Richfield',
      state: 'UT',
      zipCode: '84701'
    }
  },
  {
    id: 'member_005',
    email: 'lisa.anderson@example.com',
    firstName: 'Lisa',
    lastName: 'Anderson',
    businessName: 'Anderson Marketing Solutions',
    phone: '(435) 555-0105',
    website: 'https://andersonmarketing.com',
    avatar: '/profile-placeholder.png',
    role: 'member',
    status: 'active',
    memberSince: '2021-11-18',
    specialties: ['Digital Marketing', 'Social Media', 'Brand Development'],
    bio: 'Creative marketing solutions for local businesses throughout Central Utah.',
    address: {
      street: '654 Maple Lane',
      city: 'Richfield',
      state: 'UT',
      zipCode: '84701'
    }
  },
  {
    id: 'member_006',
    email: 'david.brown@example.com',
    firstName: 'David',
    lastName: 'Brown',
    businessName: 'Brown\'s Hardware Store',
    phone: '(435) 555-0106',
    website: 'https://brownshardware.com',
    avatar: '/profile-placeholder.png',
    role: 'member',
    status: 'active',
    memberSince: '2018-05-30',
    specialties: ['Hardware', 'Tools', 'Home Improvement'],
    bio: 'Your local hardware store serving Richfield for over 40 years.',
    address: {
      street: '987 Cedar Road',
      city: 'Richfield',
      state: 'UT',
      zipCode: '84701'
    }
  }
];

// Members API endpoint
app.get('/api/members', (req, res) => {
  try {
    const { limit = 20, offset = 0, search = '', role = '' } = req.query;
    
    let filteredMembers = members.filter(member => member.status === 'active');
    
    // Filter by search term (name, business, email)
    if (search) {
      const searchLower = search.toLowerCase();
      filteredMembers = filteredMembers.filter(member => 
        member.firstName?.toLowerCase().includes(searchLower) ||
        member.lastName?.toLowerCase().includes(searchLower) ||
        member.businessName?.toLowerCase().includes(searchLower) ||
        member.email?.toLowerCase().includes(searchLower) ||
        member.specialties?.some(s => s.toLowerCase().includes(searchLower))
      );
    }
    
    // Filter by role
    if (role) {
      filteredMembers = filteredMembers.filter(member => member.role === role);
    }
    
    // Apply pagination
    const startIndex = parseInt(offset) || 0;
    const pageSize = parseInt(limit) || 20;
    const paginatedMembers = filteredMembers.slice(startIndex, startIndex + pageSize);
    
    res.json({
      members: paginatedMembers,
      total: filteredMembers.length,
      limit: pageSize,
      offset: startIndex
    });
  } catch (error) {
    console.error('Error fetching members:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Single member endpoint
app.get('/api/members/:id', (req, res) => {
  try {
    const { id } = req.params;
    const member = members.find(m => m.id === id && m.status === 'active');
    
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }
    
    res.json(member);
  } catch (error) {
    console.error('Error fetching member by ID:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Simple news endpoint
app.get('/api/news', (req, res) => {
  res.json({
    news: [
      {
        id: 'news_001',
        title: 'RACC September Networking Luncheon',
        excerpt: 'Join us for our monthly networking luncheon featuring guest speaker Sarah Johnson.',
        publishedDate: '2024-09-01',
        category: 'events'
      }
    ],
    total: 1
  });
});

// Simple jobs endpoint
app.get('/api/jobs', (req, res) => {
  res.json({
    jobs: [
      {
        id: 'job_001',
        title: 'Marketing Manager',
        company: 'Johnson Real Estate Group',
        location: 'Richfield, UT',
        type: 'Full-time',
        salary: '$45,000 - $60,000'
      }
    ],
    total: 1
  });
});

// Simple events endpoint
app.get('/api/events', (req, res) => {
  res.json({
    events: [
      {
        id: 'event_001',
        title: 'September Networking Luncheon',
        date: '2024-09-25',
        location: 'Richfield Community Center'
      }
    ],
    total: 1
  });
});

// Simple nominations endpoint
app.get('/api/nominations', (req, res) => {
  res.json({
    nominations: [],
    total: 0
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'RACC API is running' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Not Found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 RACC API Server running at http://localhost:${PORT}/api`);
  console.log(`📋 Members endpoint: http://localhost:${PORT}/api/members`);
  console.log(`✅ Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
