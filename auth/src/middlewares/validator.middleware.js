const { body, validationResult } = require('express-validator');

const respondValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const registerUserValidations = [
  body('username')
    .isString()
    .withMessage('username must be a string')
    .isLength({ min: 3 })
    .withMessage('username must be at least 3 characters long'),

  body('email')
    .isEmail()
    .withMessage('email must be a valid email address'),

  body('password')
    .isLength({ min: 6 })
    .withMessage('password must be at least 6 characters long'),

  body('fullname.firstname')
    .isString()
    .withMessage('firstname must be a string')
    .notEmpty()
    .withMessage('firstname is required'),

  body('fullname.lastname')
    .isString()
    .withMessage('lastname must be a string')
    .notEmpty()
    .withMessage('lastname is required'),

  body('role')
    .optional()
    .isIn(['user', 'seller'])
    .withMessage("Role must be either 'user' or 'seller'"),

  respondValidationErrors
];

const loginUserValidations = [
  body('email')
    .optional()
    .isEmail()
    .withMessage('Invalid email address'),

  body('username')
    .optional()
    .isString()
    .withMessage('Username must be a string'),

  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),

  (req, res, next) => {
    if (!req.body.email && !req.body.username) {
      return res.status(400).json({
        errors: [{ msg: 'Either email or username is required' }]
      });
    }
    respondValidationErrors(req, res, next);
  }
];

const addUserAddressValidations = [
  body('street').isString().notEmpty(),
  body('city').isString().notEmpty(),
  body('state').isString().notEmpty(),

  body('pincode')
    .isString()
    .notEmpty()
    .matches(/^\d{4,}$/)
    .withMessage('Pincode must be at least 4 digits'),

  body('country').isString().notEmpty(),

  body('phone')
    .optional()
    .matches(/^\d{10}$/)
    .withMessage('Phone must be a valid 10-digit number'),

  body('isDefault')
    .optional()
    .isBoolean()
    .withMessage('isDefault must be a boolean'),

  respondValidationErrors
];

module.exports = {
  registerUserValidations,
  loginUserValidations,
  addUserAddressValidations
};
