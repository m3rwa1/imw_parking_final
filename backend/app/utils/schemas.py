"""
app/utils/schemas.py
Schémas de validation Marshmallow pour toutes les routes.
"""
import re
from marshmallow import Schema, fields, validate, validates, ValidationError


# ── Helpers ─────────────────────────────────────────────────────

PASSWORD_REGEX = re.compile(r'^(?=.*[A-Z])(?=.*\d).{8,}$')
PLATE_REGEX    = re.compile(r'^[A-Z0-9\-]{4,15}$', re.IGNORECASE)


# ── Auth ─────────────────────────────────────────────────────────

class RegisterSchema(Schema):
    name     = fields.Str(required=True, validate=validate.Length(min=2, max=100))
    email    = fields.Email(required=True)
    password = fields.Str(required=True, load_only=True)
    role     = fields.Str(load_default='CLIENT',
                          validate=validate.OneOf(['ADMIN', 'MANAGER', 'AGENT', 'CLIENT']))
    phone    = fields.Str(load_default=None, validate=validate.Length(max=20), allow_none=True)

    @validates('password')
    def validate_password(self, value):
        if not PASSWORD_REGEX.match(value):
            raise ValidationError(
                'Le mot de passe doit contenir au moins 8 caractères, '
                'une majuscule et un chiffre.'
            )


class LoginSchema(Schema):
    email    = fields.Email(required=True)
    password = fields.Str(required=True, load_only=True)


# ── Users ────────────────────────────────────────────────────────

class UpdateUserSchema(Schema):
    name  = fields.Str(validate=validate.Length(min=2, max=100))
    email = fields.Email()
    phone = fields.Str(validate=validate.Length(max=20), allow_none=True)
    role  = fields.Str(validate=validate.OneOf(['ADMIN', 'MANAGER', 'AGENT', 'CLIENT']))


# ── Vehicles ─────────────────────────────────────────────────────

class CreateVehicleSchema(Schema):
    license_plate = fields.Str(required=True, validate=validate.Length(min=4, max=20))
    vehicle_type  = fields.Str(load_default='Voiture',
                               validate=validate.OneOf(['Voiture', 'Moto', 'Camion']))
    brand         = fields.Str(load_default=None, validate=validate.Length(max=50), allow_none=True)
    color         = fields.Str(load_default=None, validate=validate.Length(max=30), allow_none=True)
    user_id       = fields.Int(load_default=None, allow_none=True)

    @validates('license_plate')
    def validate_plate(self, value):
        if not PLATE_REGEX.match(value):
            raise ValidationError('Format de plaque invalide (ex: AB-123-CD).')


class EntrySchema(Schema):
    license_plate = fields.Str(required=True, validate=validate.Length(min=4, max=20))
    spot_number   = fields.Str(load_default=None, validate=validate.Length(max=10), allow_none=True)
    vehicle_type  = fields.Str(load_default='Voiture',
                               validate=validate.OneOf(['Voiture', 'Moto', 'Camion']))


class ExitSchema(Schema):
    license_plate   = fields.Str(required=True, validate=validate.Length(min=4, max=20))
    payment_method  = fields.Str(load_default='CASH',
                                 validate=validate.OneOf(['CASH', 'CARD', 'ONLINE']))


# ── Subscriptions ────────────────────────────────────────────────

class CreateSubscriptionSchema(Schema):
    vehicle_id    = fields.Int(load_default=None, allow_none=True)
    license_plate = fields.Str(required=True, validate=validate.Length(min=4, max=20))
    plan_type     = fields.Str(required=True,
                               validate=validate.OneOf(['HOURLY', 'DAILY', 'MONTHLY', 'ANNUAL']))
    start_date    = fields.Date(required=True)
    end_date      = fields.Date(required=True)
    notes         = fields.Str(load_default=None, allow_none=True)


# ── Reclamations ─────────────────────────────────────────────────

class CreateReclamationSchema(Schema):
    subject     = fields.Str(required=True, validate=validate.Length(min=5, max=200))
    description = fields.Str(required=True, validate=validate.Length(min=10))


class UpdateReclamationSchema(Schema):
    status = fields.Str(required=True,
                        validate=validate.OneOf(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']))


# ── Payments ─────────────────────────────────────────────────────

class CreatePaymentSchema(Schema):
    parking_entry_id = fields.Int(load_default=None, allow_none=True)
    subscription_id  = fields.Int(load_default=None, allow_none=True)
    amount           = fields.Decimal(required=True, places=2, as_string=False)
    payment_method   = fields.Str(load_default='CASH',
                                  validate=validate.OneOf(['CASH', 'CARD', 'ONLINE']))
    reference        = fields.Str(load_default=None, allow_none=True)
