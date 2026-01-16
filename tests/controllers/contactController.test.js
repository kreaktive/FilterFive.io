/**
 * Contact Controller Tests
 *
 * Tests for the contact form functionality:
 * - GET /contact - Display contact form
 * - POST /contact - Submit contact form
 *
 * Customer-facing endpoint for sales inquiries, support requests,
 * partnership opportunities, and general questions.
 */

const { resetAllMocks } = require('../helpers/mockServices');

// Mock dependencies
jest.mock('../../src/services/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
}));

jest.mock('../../src/services/emailService', () => ({
  sendContactNotification: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../src/services/validationService', () => ({
  isValidEmail: jest.fn((email) => {
    if (!email) return false;
    // Trim whitespace before validating (matches real service behavior)
    const trimmed = email.trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
  }),
}));

// Mock ContactSubmission model
const mockSubmission = {
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  phone: '5551234567',
  businessName: 'Test Business',
  topic: 'sales',
  message: 'I am interested in your product.',
  status: 'new',
  createdAt: new Date(),
};

jest.mock('../../src/models', () => ({
  ContactSubmission: {
    create: jest.fn(),
    findOne: jest.fn(),
  },
}));

// Mock sequelize Op
jest.mock('sequelize', () => ({
  Op: {
    gt: Symbol('gt'),
  },
}));

const { ContactSubmission } = require('../../src/models');
const emailService = require('../../src/services/emailService');
const logger = require('../../src/services/logger');

describe('Contact Controller', () => {
  let mockReq;
  let mockRes;
  let contactController;

  beforeEach(() => {
    jest.clearAllMocks();
    resetAllMocks();

    mockReq = {
      body: {},
      ip: '127.0.0.1',
      connection: { remoteAddress: '127.0.0.1' },
      get: jest.fn().mockReturnValue('Mozilla/5.0 Test Browser'),
    };

    mockRes = {
      render: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        csrfToken: 'test-csrf-token-123',
      },
    };

    // Default mocks
    ContactSubmission.create.mockResolvedValue(mockSubmission);
    ContactSubmission.findOne.mockResolvedValue(null); // No duplicates by default

    jest.isolateModules(() => {
      contactController = require('../../src/controllers/contactController');
    });
  });

  // ===========================================
  // GET /contact (showContact)
  // ===========================================
  describe('GET /contact (showContact)', () => {
    test('should render contact page with correct title', () => {
      contactController.showContact(mockReq, mockRes);

      expect(mockRes.render).toHaveBeenCalledWith('contact', expect.objectContaining({
        title: 'Contact Us - Get in Touch | MoreStars',
      }));
    });

    test('should include meta description for SEO', () => {
      contactController.showContact(mockReq, mockRes);

      expect(mockRes.render).toHaveBeenCalledWith('contact', expect.objectContaining({
        description: expect.stringContaining('MoreStars'),
      }));
    });

    test('should pass CSRF token to template', () => {
      contactController.showContact(mockReq, mockRes);

      expect(mockRes.render).toHaveBeenCalledWith('contact', expect.objectContaining({
        csrfToken: 'test-csrf-token-123',
      }));
    });

    test('should handle render errors gracefully', () => {
      mockRes.render.mockImplementationOnce(() => {
        throw new Error('Template not found');
      });

      // Second call for error page should work
      mockRes.render.mockImplementationOnce(() => {});

      contactController.showContact(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(logger.error).toHaveBeenCalledWith(
        'Contact page render error',
        expect.objectContaining({ error: 'Template not found' })
      );
    });
  });

  // ===========================================
  // POST /contact (submitContact)
  // ===========================================
  describe('POST /contact (submitContact)', () => {
    const validContactData = {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '5551234567',
      businessName: 'Test Business LLC',
      topic: 'sales',
      message: 'I am interested in your product and would like to learn more.',
    };

    describe('Happy Path', () => {
      test('should create submission and return success for valid data', async () => {
        mockReq.body = { ...validContactData };

        await contactController.submitContact(mockReq, mockRes);

        expect(ContactSubmission.create).toHaveBeenCalledWith(expect.objectContaining({
          name: 'John Doe',
          email: 'john@example.com',
          phone: '5551234567',
          businessName: 'Test Business LLC',
          topic: 'sales',
          status: 'new',
        }));

        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: true,
          message: expect.stringContaining('Thank you'),
        });
      });

      test('should send email notification to support', async () => {
        mockReq.body = { ...validContactData };

        await contactController.submitContact(mockReq, mockRes);

        expect(emailService.sendContactNotification).toHaveBeenCalledWith(expect.objectContaining({
          name: 'John Doe',
          email: 'john@example.com',
          phone: '5551234567',
          businessName: 'Test Business LLC',
          topic: 'sales',
        }));
      });

      test('should log successful submission', async () => {
        mockReq.body = { ...validContactData };

        await contactController.submitContact(mockReq, mockRes);

        expect(logger.info).toHaveBeenCalledWith(
          'Contact form submitted',
          expect.objectContaining({
            submissionId: 1,
            email: 'john@example.com',
            topic: 'sales',
          })
        );
      });

      test('should capture IP address', async () => {
        mockReq.body = { ...validContactData };
        mockReq.ip = '192.168.1.100';

        await contactController.submitContact(mockReq, mockRes);

        expect(ContactSubmission.create).toHaveBeenCalledWith(expect.objectContaining({
          ipAddress: '192.168.1.100',
        }));
      });

      test('should fall back to connection.remoteAddress for IP', async () => {
        mockReq.body = { ...validContactData };
        mockReq.ip = undefined;
        mockReq.connection = { remoteAddress: '10.0.0.50' };

        await contactController.submitContact(mockReq, mockRes);

        expect(ContactSubmission.create).toHaveBeenCalledWith(expect.objectContaining({
          ipAddress: '10.0.0.50',
        }));
      });

      test('should capture user agent', async () => {
        mockReq.body = { ...validContactData };
        mockReq.get.mockReturnValue('Chrome/120.0');

        await contactController.submitContact(mockReq, mockRes);

        expect(ContactSubmission.create).toHaveBeenCalledWith(expect.objectContaining({
          userAgent: 'Chrome/120.0',
        }));
      });

      test('should still succeed if email notification fails', async () => {
        mockReq.body = { ...validContactData };
        emailService.sendContactNotification.mockRejectedValue(new Error('Email service down'));

        await contactController.submitContact(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: true,
          message: expect.stringContaining('Thank you'),
        });
        expect(logger.error).toHaveBeenCalledWith(
          'Failed to send contact notification email',
          expect.objectContaining({ error: 'Email service down' })
        );
      });

      test('should sanitize HTML in inputs', async () => {
        mockReq.body = {
          ...validContactData,
          name: '<script>alert("xss")</script>John',
          message: 'Hello <b>world</b> this is a test message.',
        };

        await contactController.submitContact(mockReq, mockRes);

        expect(ContactSubmission.create).toHaveBeenCalledWith(expect.objectContaining({
          name: expect.not.stringContaining('<script>'),
          message: expect.not.stringContaining('<b>'),
        }));
      });

      test('should trim whitespace from inputs', async () => {
        mockReq.body = {
          ...validContactData,
          name: '  John Doe  ',
          email: '  john@example.com  ',
          phone: '  5551234567  ',
          businessName: '  Test Business  ',
          message: '  This is my message with spaces.  ',
        };

        await contactController.submitContact(mockReq, mockRes);

        expect(ContactSubmission.create).toHaveBeenCalledWith(expect.objectContaining({
          phone: '5551234567',
        }));
      });
    });

    describe('Validation Errors', () => {
      describe('Name Validation', () => {
        test('should return 400 when name is missing', async () => {
          mockReq.body = { ...validContactData, name: undefined };

          await contactController.submitContact(mockReq, mockRes);

          expect(mockRes.status).toHaveBeenCalledWith(400);
          expect(mockRes.json).toHaveBeenCalledWith({
            success: false,
            errors: expect.objectContaining({
              name: 'Name is required',
            }),
          });
        });

        test('should return 400 when name is too short', async () => {
          mockReq.body = { ...validContactData, name: 'J' };

          await contactController.submitContact(mockReq, mockRes);

          expect(mockRes.status).toHaveBeenCalledWith(400);
          expect(mockRes.json).toHaveBeenCalledWith({
            success: false,
            errors: expect.objectContaining({
              name: expect.stringContaining('at least 2'),
            }),
          });
        });

        test('should return 400 when name is too long', async () => {
          mockReq.body = { ...validContactData, name: 'a'.repeat(256) };

          await contactController.submitContact(mockReq, mockRes);

          expect(mockRes.status).toHaveBeenCalledWith(400);
          expect(mockRes.json).toHaveBeenCalledWith({
            success: false,
            errors: expect.objectContaining({
              name: expect.stringContaining('less than 255'),
            }),
          });
        });
      });

      describe('Email Validation', () => {
        test('should return 400 when email is missing', async () => {
          mockReq.body = { ...validContactData, email: undefined };

          await contactController.submitContact(mockReq, mockRes);

          expect(mockRes.status).toHaveBeenCalledWith(400);
          expect(mockRes.json).toHaveBeenCalledWith({
            success: false,
            errors: expect.objectContaining({
              email: 'Email is required',
            }),
          });
        });

        test('should return 400 when email is invalid', async () => {
          mockReq.body = { ...validContactData, email: 'not-an-email' };

          await contactController.submitContact(mockReq, mockRes);

          expect(mockRes.status).toHaveBeenCalledWith(400);
          expect(mockRes.json).toHaveBeenCalledWith({
            success: false,
            errors: expect.objectContaining({
              email: expect.stringContaining('valid email'),
            }),
          });
        });
      });

      describe('Phone Validation', () => {
        test('should return 400 when phone is missing', async () => {
          mockReq.body = { ...validContactData, phone: undefined };

          await contactController.submitContact(mockReq, mockRes);

          expect(mockRes.status).toHaveBeenCalledWith(400);
          expect(mockRes.json).toHaveBeenCalledWith({
            success: false,
            errors: expect.objectContaining({
              phone: 'Phone number is required',
            }),
          });
        });

        test('should return 400 when phone is too short', async () => {
          mockReq.body = { ...validContactData, phone: '12345' };

          await contactController.submitContact(mockReq, mockRes);

          expect(mockRes.status).toHaveBeenCalledWith(400);
          expect(mockRes.json).toHaveBeenCalledWith({
            success: false,
            errors: expect.objectContaining({
              phone: expect.stringContaining('valid phone'),
            }),
          });
        });

        test('should return 400 when phone is too long', async () => {
          mockReq.body = { ...validContactData, phone: '1'.repeat(21) };

          await contactController.submitContact(mockReq, mockRes);

          expect(mockRes.status).toHaveBeenCalledWith(400);
          expect(mockRes.json).toHaveBeenCalledWith({
            success: false,
            errors: expect.objectContaining({
              phone: expect.stringContaining('too long'),
            }),
          });
        });
      });

      describe('Business Name Validation', () => {
        test('should return 400 when businessName is missing', async () => {
          mockReq.body = { ...validContactData, businessName: undefined };

          await contactController.submitContact(mockReq, mockRes);

          expect(mockRes.status).toHaveBeenCalledWith(400);
          expect(mockRes.json).toHaveBeenCalledWith({
            success: false,
            errors: expect.objectContaining({
              businessName: 'Business name is required',
            }),
          });
        });

        test('should return 400 when businessName is too short', async () => {
          mockReq.body = { ...validContactData, businessName: 'A' };

          await contactController.submitContact(mockReq, mockRes);

          expect(mockRes.status).toHaveBeenCalledWith(400);
          expect(mockRes.json).toHaveBeenCalledWith({
            success: false,
            errors: expect.objectContaining({
              businessName: expect.stringContaining('at least 2'),
            }),
          });
        });

        test('should return 400 when businessName is too long', async () => {
          mockReq.body = { ...validContactData, businessName: 'b'.repeat(256) };

          await contactController.submitContact(mockReq, mockRes);

          expect(mockRes.status).toHaveBeenCalledWith(400);
          expect(mockRes.json).toHaveBeenCalledWith({
            success: false,
            errors: expect.objectContaining({
              businessName: expect.stringContaining('less than 255'),
            }),
          });
        });
      });

      describe('Topic Validation', () => {
        test('should return 400 when topic is missing', async () => {
          mockReq.body = { ...validContactData, topic: undefined };

          await contactController.submitContact(mockReq, mockRes);

          expect(mockRes.status).toHaveBeenCalledWith(400);
          expect(mockRes.json).toHaveBeenCalledWith({
            success: false,
            errors: expect.objectContaining({
              topic: expect.stringContaining('valid topic'),
            }),
          });
        });

        test('should return 400 when topic is invalid', async () => {
          mockReq.body = { ...validContactData, topic: 'invalid-topic' };

          await contactController.submitContact(mockReq, mockRes);

          expect(mockRes.status).toHaveBeenCalledWith(400);
          expect(mockRes.json).toHaveBeenCalledWith({
            success: false,
            errors: expect.objectContaining({
              topic: expect.stringContaining('valid topic'),
            }),
          });
        });

        test('should accept all valid topics', async () => {
          const validTopics = ['sales', 'support', 'billing', 'partnership', 'general'];

          for (const topic of validTopics) {
            jest.clearAllMocks();
            ContactSubmission.create.mockResolvedValue({ ...mockSubmission, topic });
            ContactSubmission.findOne.mockResolvedValue(null);

            mockReq.body = { ...validContactData, topic };

            await contactController.submitContact(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);
          }
        });
      });

      describe('Message Validation', () => {
        test('should return 400 when message is missing', async () => {
          mockReq.body = { ...validContactData, message: undefined };

          await contactController.submitContact(mockReq, mockRes);

          expect(mockRes.status).toHaveBeenCalledWith(400);
          expect(mockRes.json).toHaveBeenCalledWith({
            success: false,
            errors: expect.objectContaining({
              message: 'Message is required',
            }),
          });
        });

        test('should return 400 when message is too short', async () => {
          mockReq.body = { ...validContactData, message: 'Hi' };

          await contactController.submitContact(mockReq, mockRes);

          expect(mockRes.status).toHaveBeenCalledWith(400);
          expect(mockRes.json).toHaveBeenCalledWith({
            success: false,
            errors: expect.objectContaining({
              message: expect.stringContaining('at least 10'),
            }),
          });
        });

        test('should return 400 when message is too long', async () => {
          mockReq.body = { ...validContactData, message: 'm'.repeat(2001) };

          await contactController.submitContact(mockReq, mockRes);

          expect(mockRes.status).toHaveBeenCalledWith(400);
          expect(mockRes.json).toHaveBeenCalledWith({
            success: false,
            errors: expect.objectContaining({
              message: expect.stringContaining('less than 2000'),
            }),
          });
        });
      });

      describe('Multiple Validation Errors', () => {
        test('should return all validation errors at once', async () => {
          mockReq.body = {
            name: '',
            email: 'invalid',
            phone: '123',
            businessName: '',
            topic: 'invalid',
            message: 'short',
          };

          await contactController.submitContact(mockReq, mockRes);

          expect(mockRes.status).toHaveBeenCalledWith(400);
          const response = mockRes.json.mock.calls[0][0];
          expect(Object.keys(response.errors).length).toBeGreaterThan(3);
        });
      });
    });

    describe('Duplicate Submission Prevention', () => {
      test('should return 429 for duplicate submission within 1 hour', async () => {
        mockReq.body = { ...validContactData };
        ContactSubmission.findOne.mockResolvedValue({
          ...mockSubmission,
          createdAt: new Date(), // Recent submission
        });

        await contactController.submitContact(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(429);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: false,
          error: expect.stringContaining('already submitted'),
        });
        expect(ContactSubmission.create).not.toHaveBeenCalled();
      });

      test('should allow submission if no duplicate found', async () => {
        mockReq.body = { ...validContactData };
        ContactSubmission.findOne.mockResolvedValue(null);

        await contactController.submitContact(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(ContactSubmission.create).toHaveBeenCalled();
      });

      test('should not block submission if duplicate check fails', async () => {
        mockReq.body = { ...validContactData };
        ContactSubmission.findOne.mockRejectedValue(new Error('Database error'));

        await contactController.submitContact(mockReq, mockRes);

        // Should still allow submission on duplicate check error
        expect(ContactSubmission.create).toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(200);
      });
    });

    describe('Database/System Errors', () => {
      test('should return 500 on database error when creating submission', async () => {
        mockReq.body = { ...validContactData };
        ContactSubmission.create.mockRejectedValue(new Error('Database connection failed'));

        await contactController.submitContact(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: false,
          error: expect.stringContaining('error occurred'),
        });
      });

      test('should log database errors', async () => {
        mockReq.body = { ...validContactData };
        ContactSubmission.create.mockRejectedValue(new Error('Insert failed'));

        await contactController.submitContact(mockReq, mockRes);

        expect(logger.error).toHaveBeenCalledWith(
          'Contact form submission error',
          expect.objectContaining({
            error: 'Insert failed',
            email: 'john@example.com',
          })
        );
      });
    });

    describe('Security', () => {
      test('should escape HTML entities in name', async () => {
        mockReq.body = {
          ...validContactData,
          name: '<script>alert("xss")</script>',
        };

        await contactController.submitContact(mockReq, mockRes);

        const createCall = ContactSubmission.create.mock.calls[0][0];
        expect(createCall.name).not.toContain('<script>');
        expect(createCall.name).toContain('&lt;');
      });

      test('should escape HTML entities in message', async () => {
        mockReq.body = {
          ...validContactData,
          message: 'Hello <img src=x onerror=alert(1)> world testing',
        };

        await contactController.submitContact(mockReq, mockRes);

        const createCall = ContactSubmission.create.mock.calls[0][0];
        expect(createCall.message).not.toContain('<img');
        expect(createCall.message).toContain('&lt;');
      });

      test('should escape HTML entities in businessName', async () => {
        mockReq.body = {
          ...validContactData,
          businessName: 'Business<script>hack</script>',
        };

        await contactController.submitContact(mockReq, mockRes);

        const createCall = ContactSubmission.create.mock.calls[0][0];
        expect(createCall.businessName).not.toContain('<script>');
      });
    });
  });
});
