#!/usr/bin/env python3
"""
Test script to verify the complete reservation flow
- Standard client makes a reservation
- Admin sees the reservation in the dashboard
- Admin can validate the reservation
"""
import requests
import json
from datetime import datetime, timedelta

BASE_URL = "http://localhost:5000"

# Test configuration
TEST_USER_EMAIL = "test_client@example.com"
TEST_USER_PASSWORD = "TestPass123!"
ADMIN_EMAIL = "admin@imw.com"
ADMIN_PASSWORD = "Admin1234!"

def test_reservation_flow():
    print("=" * 80)
    print("RESERVATION FLOW TEST")
    print("=" * 80)
    
    # 1. Create test client
    print("\n1. Creating test client...")
    register_res = requests.post(f"{BASE_URL}/api/auth/register", json={
        "name": "Test Client",
        "email": TEST_USER_EMAIL,
        "password": TEST_USER_PASSWORD,
        "role": "CLIENT"
    })
    print(f"   Status: {register_res.status_code}")
    if register_res.status_code != 201:
        print(f"   Response: {register_res.text}")
        return False
    
    # 2. Login client
    print("\n2. Logging in as client...")
    login_res = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_USER_EMAIL,
        "password": TEST_USER_PASSWORD
    })
    if login_res.status_code != 200:
        print(f"   ERROR: {login_res.text}")
        return False
    
    client_token = login_res.json().get("access_token")
    print(f"   Client token: {client_token[:20]}...")
    
    # 3. Client creates a reservation
    print("\n3. Client creating a reservation...")
    headers = {"Authorization": f"Bearer {client_token}"}
    reservation_date = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
    
    reservation_res = requests.post(f"{BASE_URL}/api/reservations/", 
        json={
            "nom_proche": "Test Client",
            "license_plate": "TEST-001",
            "vehicle_type": "Voiture",
            "date_reservation": reservation_date,
            "montant": 5.00,  # 1 hour at 5€/hour
            "payment_method": "CARD"
        },
        headers=headers
    )
    
    print(f"   Status: {reservation_res.status_code}")
    if reservation_res.status_code != 201:
        print(f"   ERROR: {reservation_res.text}")
        return False
    
    reservation_id = reservation_res.json().get("reservation_id")
    print(f"   Reservation ID: {reservation_id}")
    
    # 4. Login as admin
    print("\n4. Logging in as admin...")
    admin_login_res = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    if admin_login_res.status_code != 200:
        print(f"   ERROR: {admin_login_res.text}")
        return False
    
    admin_token = admin_login_res.json().get("access_token")
    print(f"   Admin token: {admin_token[:20]}...")
    
    # 5. Admin fetches all pending reservations
    print("\n5. Admin fetching pending reservations...")
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    
    admin_res = requests.get(f"{BASE_URL}/api/reservations/admin", 
        headers=admin_headers
    )
    
    print(f"   Status: {admin_res.status_code}")
    if admin_res.status_code != 200:
        print(f"   ERROR: {admin_res.text}")
        return False
    
    reservations = admin_res.json().get("data", [])
    print(f"   Total reservations: {len(reservations)}")
    
    # Check if our reservation is in the list
    our_reservation = None
    for res in reservations:
        if res.get("id") == reservation_id:
            our_reservation = res
            break
    
    if our_reservation:
        print(f"   ✓ Reservation found in admin view!")
        print(f"   - Client: {our_reservation.get('nom_proche')}")
        print(f"   - Plate: {our_reservation.get('license_plate')}")
        print(f"   - Amount: {our_reservation.get('montant')}€")
        print(f"   - Status: {our_reservation.get('statut')}")
    else:
        print(f"   ✗ Reservation NOT found in admin view!")
        print(f"   Available reservations:")
        for res in reservations:
            print(f"     - ID {res.get('id')}: {res.get('nom_proche')} ({res.get('license_plate')})")
        return False
    
    # 6. Admin validates the reservation
    print("\n6. Admin validating reservation...")
    validate_res = requests.put(f"{BASE_URL}/api/reservations/{reservation_id}/validate",
        json={"spot_number": "A001"},
        headers=admin_headers
    )
    
    print(f"   Status: {validate_res.status_code}")
    if validate_res.status_code != 200:
        print(f"   ERROR: {validate_res.text}")
        return False
    
    print(f"   ✓ Reservation validated successfully!")
    
    print("\n" + "=" * 80)
    print("✓ ALL TESTS PASSED!")
    print("=" * 80)
    return True

if __name__ == "__main__":
    try:
        success = test_reservation_flow()
        exit(0 if success else 1)
    except Exception as e:
        print(f"\n✗ ERROR: {e}")
        exit(1)
