from marshmallow import Schema, fields, validate, validates, ValidationError

class RegisterSchema(Schema):
    name = fields.Str(required=True, validate=validate.Length(min=2, error="Le nom doit contenir au moins 2 caractères"))
    email = fields.Email(required=True, error_messages={"required": "Email obligatoire", "invalid": "Format d'email invalide"})
    password = fields.Str(required=True, error_messages={"required": "Mot de passe obligatoire"})
    license_plate = fields.Str(load_default='')

    @validates('password')
    def validate_password(self, value):
        if len(value) < 8 or not any(c.isupper() for c in value) or not any(c.islower() for c in value) or not any(c.isdigit() for c in value):
            raise ValidationError("Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre")

class LoginSchema(Schema):
    email = fields.Email(required=True, error_messages={"required": "Email obligatoire", "invalid": "Format d'email invalide"})
    password = fields.Str(required=True, error_messages={"required": "Mot de passe obligatoire"})
