const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// Mock members data that matches frontend expectations
const mockMembers = [
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
    email: 'boardmember@racc.com',
    firstName: 'Jennifer',
    lastName: 'Smith',
    businessName: 'Smith Financial Services',
    phone: '(435) 555-0103',
    website: 'https://smithfinancial.com',
    avatar: '/profile-placeholder.png',
    role: 'board_member',
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

// GET /api/members - Public route for member directory
app.get('/api/members', (req, res) => {
  try {
    const { limit = 100, offset = 0, search = '', role = '' } = req.query;
    
    let filteredMembers = mockMembers.filter(member => member.status === 'active');
    
    // Filter by search term (name, business, email)
    if (search && typeof search === 'string') {
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
    if (role && typeof role === 'string') {
      filteredMembers = filteredMembers.filter(member => member.role === role);
    }
    
    // Apply pagination
    const startIndex = parseInt(offset) || 0;
    const pageSize = parseInt(limit) || 100;
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

// GET /api/members/:id - Public route for member details
app.get('/api/members/:id', (req, res) => {
  try {
    const { id } = req.params;
    const member = mockMembers.find(m => m.id === id && m.status === 'active');
    
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }
    
    res.json(member);
  } catch (error) {
    console.error('Error fetching member by ID:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ message: 'Not Found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Simple RACC API server running at http://localhost:${PORT}/api`);
});
