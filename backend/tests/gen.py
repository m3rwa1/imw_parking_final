import bcrypt
print(bcrypt.hashpw(b"password", bcrypt.gensalt(12)).decode())
