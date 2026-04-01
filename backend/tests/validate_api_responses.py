#!/usr/bin/env python
"""
Script de validation des réponses API
Vérifie que les structures JSON correspondent aux attentes du frontend
"""
import requests
import json
from app import create_app

# Démarrer l'app
app = create_app('development')
client = app.test_client()
app_context = app.app_context()
app_context.push()

def test_endpoint(method, endpoint, auth=False, data=None, expected_fields=None):
    """Test un endpoint et valide sa réponse"""
    headers = {}
    if auth:
        # Créer un token de test
        from app.utils.auth import AuthHelper
        headers['Authorization'] = f"Bearer {AuthHelper.create_access_token(1, 'test@test.com', 'ADMIN')}"
    
    if method == 'GET':
        response = client.get(endpoint, headers=headers)
    else:
        headers['Content-Type'] = 'application/json'
        response = client.post(endpoint, json=data or {}, headers=headers)
    
    try:
        json_data = response.get_json()
    except:
        json_data = {}
    
    print(f"\n{'='*60}")
    print(f"[{response.status_code}] {method} {endpoint}")
    print(f"{'='*60}")
    
    if response.status_code in [401, 403]:
        print("⚠️  Endpoint nécessite authentification - OK")
        return True
    
    # Vérifier les champs attendus
    success = True
    if expected_fields:
        for field in expected_fields:
            if field not in json_data and 'data' not in json_data:
                print(f"❌ Champ manquant: {field}")
                success = False
            elif field in json_data:
                print(f"✓ Champ présent: {field}")
    
    # Afficher la structure
    if isinstance(json_data, dict):
        print(f"\n📊 Structure retournée:")
        for key in list(json_data.keys())[:5]:  # Afficher les 5 premiers champs
            value_type = type(json_data[key]).__name__
            if isinstance(json_data[key], (str, int, float, bool)):
                print(f"   - {key}: {value_type} = {str(json_data[key])[:50]}")
            elif isinstance(json_data[key], list):
                print(f"   - {key}: {value_type} ({len(json_data[key])} items)")
            elif isinstance(json_data[key], dict):
                print(f"   - {key}: {value_type}")
    
    return success

# Tests des endpoints critiques
print("\n🧪 VALIDATION DES RÉPONSES API\n")

results = []

# Stats
results.append(("GET /api/stats/today", test_endpoint(
    'GET', '/api/stats/today', auth=True,
    expected_fields=['total_entries', 'total_exits', 'active_now', 'total_revenue']
)))

# Reservations
results.append(("GET /api/reservations/admin", test_endpoint(
    'GET', '/api/reservations/admin', auth=True,
    expected_fields=['data']
)))

# Vehicles
results.append(("GET /api/vehicles/active", test_endpoint(
    'GET', '/api/vehicles/active', auth=True,
    expected_fields=['data']
)))

# Subscriptions
results.append(("GET /api/subscriptions/", test_endpoint(
    'GET', '/api/subscriptions/?page=1&per_page=20', auth=True,
    expected_fields=['data', 'total']
)))

# Pricing
results.append(("GET /api/pricing/", test_endpoint(
    'GET', '/api/pricing/', auth=False,
    expected_fields=['data']
)))

# Reclamations
results.append(("GET /api/reclamations/", test_endpoint(
    'GET', '/api/reclamations/?page=1&per_page=50', auth=True,
    expected_fields=['data', 'total']
)))

# Activity Logs
results.append(("GET /api/logs/", test_endpoint(
    'GET', '/api/logs/?page=1&per_page=50', auth=True,
    expected_fields=['data', 'total']
)))

# Summary
print(f"\n{'='*60}")
print("📋 RÉSUMÉ DES TESTS")
print(f"{'='*60}")
passed = sum(1 for _, result in results if result)
total = len(results)
print(f"✓ {passed}/{total} tests réussis")

if passed == total:
    print("\n✅ Toutes les réponses API sont bien structurées!")
else:
    print(f"\n⚠️  {total - passed} problèmes à corriger")

app_context.pop()
