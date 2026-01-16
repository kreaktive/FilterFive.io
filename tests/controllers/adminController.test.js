/**
 * Admin Controller Tests
 *
 * Tests for super admin functionality:
 * - Dashboard (tenant listing)
 * - Tenant creation with validation
 * - QR code generation
 */

const { resetAllMocks } = require('../helpers/mockServices');

// Mock dependencies
jest.mock('../../src/models', () => ({
  User: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock('qrcode', () => ({
  toDataURL: jest.fn(),
}));

jest.mock('../../src/services/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

jest.mock('../../src/services/validationService', () => ({
  isValidPassword: jest.fn(),
  getPasswordErrors: jest.fn(),
  isValidEmail: jest.fn(),
  sanitizeInput: jest.fn((input) => input?.trim()),
}));

const { User } = require('../../src/models');
const QRCode = require('qrcode');
const logger = require('../../src/services/logger');
const { isValidPassword, getPasswordErrors, isValidEmail, sanitizeInput } = require('../../src/services/validationService');
const {
  showAdminDashboard,
  showCreateTenant,
  createTenant,
  generateQrCode,
} = require('../../src/controllers/adminController');

describe('Admin Controller', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    jest.clearAllMocks();
    resetAllMocks();

    mockReq = {
      user: { id: 1, role: 'super_admin', email: 'admin@test.com' },
      query: {},
      body: {},
      params: {},
    };

    mockRes = {
      render: jest.fn(),
      redirect: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Default mock implementations
    isValidEmail.mockReturnValue(true);
    isValidPassword.mockReturnValue(true);
    getPasswordErrors.mockReturnValue([]);
    sanitizeInput.mockImplementation((input) => input?.trim());

    process.env.APP_URL = 'https://morestars.io';
  });

  // ===========================================
  // showAdminDashboard Tests
  // ===========================================
  describe('showAdminDashboard', () => {
    it('should render admin dashboard with all users', async () => {
      const mockUsers = [
        { id: 1, businessName: 'Business A', email: 'a@test.com', role: 'tenant', subscriptionStatus: 'active', isActive: true },
        { id: 2, businessName: 'Business B', email: 'b@test.com', role: 'tenant', subscriptionStatus: 'trial', isActive: true },
      ];
      User.findAll.mockResolvedValue(mockUsers);

      await showAdminDashboard(mockReq, mockRes);

      expect(User.findAll).toHaveBeenCalledWith({
        order: [['createdAt', 'DESC']],
        attributes: ['id', 'businessName', 'email', 'role', 'subscriptionStatus', 'isActive', 'createdAt'],
      });
      expect(mockRes.render).toHaveBeenCalledWith('admin/dashboard', {
        title: 'Super Admin - Tenant Management',
        users: mockUsers,
        currentUser: mockReq.user,
        success: null,
      });
    });

    it('should pass success message from query params', async () => {
      User.findAll.mockResolvedValue([]);
      mockReq.query.success = 'Tenant created successfully';

      await showAdminDashboard(mockReq, mockRes);

      expect(mockRes.render).toHaveBeenCalledWith(
        'admin/dashboard',
        expect.objectContaining({ success: 'Tenant created successfully' })
      );
    });

    it('should handle database error', async () => {
      User.findAll.mockRejectedValue(new Error('Database error'));

      await showAdminDashboard(mockReq, mockRes);

      expect(logger.error).toHaveBeenCalledWith('Error in showAdminDashboard', expect.any(Object));
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.render).toHaveBeenCalledWith('error', expect.objectContaining({
        title: 'Server Error',
        message: 'Failed to load tenant list.',
      }));
    });

    it('should render empty list when no users exist', async () => {
      User.findAll.mockResolvedValue([]);

      await showAdminDashboard(mockReq, mockRes);

      expect(mockRes.render).toHaveBeenCalledWith(
        'admin/dashboard',
        expect.objectContaining({ users: [] })
      );
    });
  });

  // ===========================================
  // showCreateTenant Tests
  // ===========================================
  describe('showCreateTenant', () => {
    it('should render create tenant form', () => {
      showCreateTenant(mockReq, mockRes);

      expect(mockRes.render).toHaveBeenCalledWith('admin/create', {
        title: 'Super Admin - Create New Tenant',
        currentUser: mockReq.user,
        error: null,
      });
    });

    it('should pass current user to template', () => {
      mockReq.user = { id: 5, role: 'super_admin', email: 'other@admin.com' };

      showCreateTenant(mockReq, mockRes);

      expect(mockRes.render).toHaveBeenCalledWith(
        'admin/create',
        expect.objectContaining({ currentUser: mockReq.user })
      );
    });
  });

  // ===========================================
  // createTenant Tests
  // ===========================================
  describe('createTenant', () => {
    beforeEach(() => {
      mockReq.body = {
        businessName: 'New Business',
        email: 'new@business.com',
        phone: '555-1234',
        password: 'SecurePassword123!',
      };
    });

    it('should create tenant successfully with valid data', async () => {
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue({ id: 10, email: 'new@business.com' });

      await createTenant(mockReq, mockRes);

      expect(User.create).toHaveBeenCalledWith({
        businessName: 'New Business',
        email: 'new@business.com',
        password: 'SecurePassword123!',
        role: 'tenant',
        subscriptionStatus: 'trial',
        isActive: true,
      });
      expect(mockRes.redirect).toHaveBeenCalledWith('/admin?success=Tenant created successfully');
      expect(logger.info).toHaveBeenCalledWith('New tenant created by super admin', expect.any(Object));
    });

    it('should require business name', async () => {
      mockReq.body.businessName = '';

      await createTenant(mockReq, mockRes);

      expect(mockRes.render).toHaveBeenCalledWith(
        'admin/create',
        expect.objectContaining({ error: 'Business Name, Email, and Password are required.' })
      );
      expect(User.create).not.toHaveBeenCalled();
    });

    it('should require email', async () => {
      mockReq.body.email = '';

      await createTenant(mockReq, mockRes);

      expect(mockRes.render).toHaveBeenCalledWith(
        'admin/create',
        expect.objectContaining({ error: 'Business Name, Email, and Password are required.' })
      );
    });

    it('should require password', async () => {
      mockReq.body.password = '';

      await createTenant(mockReq, mockRes);

      expect(mockRes.render).toHaveBeenCalledWith(
        'admin/create',
        expect.objectContaining({ error: 'Business Name, Email, and Password are required.' })
      );
    });

    it('should validate email format', async () => {
      isValidEmail.mockReturnValue(false);

      await createTenant(mockReq, mockRes);

      expect(mockRes.render).toHaveBeenCalledWith(
        'admin/create',
        expect.objectContaining({ error: 'Please enter a valid email address.' })
      );
      expect(User.create).not.toHaveBeenCalled();
    });

    it('should validate password strength', async () => {
      isValidPassword.mockReturnValue(false);
      getPasswordErrors.mockReturnValue(['At least 8 characters', 'At least one uppercase letter']);

      await createTenant(mockReq, mockRes);

      expect(mockRes.render).toHaveBeenCalledWith(
        'admin/create',
        expect.objectContaining({
          error: 'Password requirements: At least 8 characters, At least one uppercase letter',
        })
      );
      expect(User.create).not.toHaveBeenCalled();
    });

    it('should reject duplicate email', async () => {
      User.findOne.mockResolvedValue({ id: 5, email: 'new@business.com' });

      await createTenant(mockReq, mockRes);

      expect(mockRes.render).toHaveBeenCalledWith(
        'admin/create',
        expect.objectContaining({ error: 'A user with this email already exists.' })
      );
      expect(User.create).not.toHaveBeenCalled();
    });

    it('should normalize email to lowercase', async () => {
      mockReq.body.email = '  New@BUSINESS.COM  ';
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue({ id: 10 });

      await createTenant(mockReq, mockRes);

      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'new@business.com' })
      );
    });

    it('should sanitize business name', async () => {
      mockReq.body.businessName = '  My Business  ';
      sanitizeInput.mockReturnValue('My Business');
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue({ id: 10 });

      await createTenant(mockReq, mockRes);

      expect(sanitizeInput).toHaveBeenCalledWith('  My Business  ');
      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({ businessName: 'My Business' })
      );
    });

    it('should handle Sequelize validation error', async () => {
      User.findOne.mockResolvedValue(null);
      const sequelizeError = new Error('Validation failed');
      sequelizeError.name = 'SequelizeValidationError';
      User.create.mockRejectedValue(sequelizeError);

      await createTenant(mockReq, mockRes);

      expect(mockRes.render).toHaveBeenCalledWith(
        'admin/create',
        expect.objectContaining({ error: 'Invalid email format.' })
      );
    });

    it('should handle general database error', async () => {
      User.findOne.mockResolvedValue(null);
      User.create.mockRejectedValue(new Error('Database connection failed'));

      await createTenant(mockReq, mockRes);

      expect(logger.error).toHaveBeenCalledWith('Error in createTenant', expect.any(Object));
      expect(mockRes.render).toHaveBeenCalledWith(
        'admin/create',
        expect.objectContaining({ error: 'Failed to create tenant. Please try again.' })
      );
    });

    it('should set role to tenant', async () => {
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue({ id: 10 });

      await createTenant(mockReq, mockRes);

      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'tenant' })
      );
    });

    it('should set subscription status to trial', async () => {
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue({ id: 10 });

      await createTenant(mockReq, mockRes);

      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({ subscriptionStatus: 'trial' })
      );
    });

    it('should set isActive to true', async () => {
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue({ id: 10 });

      await createTenant(mockReq, mockRes);

      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: true })
      );
    });
  });

  // ===========================================
  // generateQrCode Tests
  // ===========================================
  describe('generateQrCode', () => {
    beforeEach(() => {
      mockReq.params = { userId: '5' };
    });

    it('should generate QR code for valid user', async () => {
      const mockUser = { id: 5, businessName: 'Test Business' };
      User.findByPk.mockResolvedValue(mockUser);
      QRCode.toDataURL.mockResolvedValue('data:image/png;base64,abc123...');

      await generateQrCode(mockReq, mockRes);

      expect(User.findByPk).toHaveBeenCalledWith('5');
      expect(QRCode.toDataURL).toHaveBeenCalledWith(
        'https://morestars.io/r/5',
        expect.objectContaining({
          errorCorrectionLevel: 'M',
          type: 'image/png',
          width: 400,
        })
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        qrUrl: 'https://morestars.io/r/5',
        qrCodeImage: 'data:image/png;base64,abc123...',
        businessName: 'Test Business',
        businessId: 5,
      });
    });

    it('should return 404 for non-existent user', async () => {
      User.findByPk.mockResolvedValue(null);

      await generateQrCode(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Business not found',
      });
      expect(QRCode.toDataURL).not.toHaveBeenCalled();
    });

    it('should log QR code generation', async () => {
      User.findByPk.mockResolvedValue({ id: 5, businessName: 'Test Business' });
      QRCode.toDataURL.mockResolvedValue('data:image/png;base64,abc123...');

      await generateQrCode(mockReq, mockRes);

      expect(logger.info).toHaveBeenCalledWith('QR code generated', {
        businessName: 'Test Business',
        userId: 5,
      });
    });

    it('should handle QR code generation error', async () => {
      User.findByPk.mockResolvedValue({ id: 5, businessName: 'Test' });
      QRCode.toDataURL.mockRejectedValue(new Error('QR generation failed'));

      await generateQrCode(mockReq, mockRes);

      expect(logger.error).toHaveBeenCalledWith('QR generation error', expect.any(Object));
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to generate QR code',
      });
    });

    it('should use APP_URL for QR code URL', async () => {
      process.env.APP_URL = 'https://custom.domain.com';
      User.findByPk.mockResolvedValue({ id: 10, businessName: 'Test' });
      QRCode.toDataURL.mockResolvedValue('data:image/png;base64,xyz...');

      await generateQrCode(mockReq, mockRes);

      expect(QRCode.toDataURL).toHaveBeenCalledWith(
        'https://custom.domain.com/r/10',
        expect.any(Object)
      );
    });

    it('should include QR code configuration options', async () => {
      User.findByPk.mockResolvedValue({ id: 5, businessName: 'Test' });
      QRCode.toDataURL.mockResolvedValue('data:image/png;base64,...');

      await generateQrCode(mockReq, mockRes);

      expect(QRCode.toDataURL).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          errorCorrectionLevel: 'M',
          type: 'image/png',
          quality: 0.92,
          margin: 2,
          width: 400,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        })
      );
    });

    it('should handle database error when fetching user', async () => {
      User.findByPk.mockRejectedValue(new Error('Database error'));

      await generateQrCode(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to generate QR code',
      });
    });
  });
});
