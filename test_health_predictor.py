import requests
import json
import time

# Test cases with different symptom combinations
test_cases = [
    {
        "name": "Test 1: Common Flu Symptoms",
        "symptoms": ["fever", "cough", "headache"],
        "description": "Basic flu-like symptoms"
    },
    {
        "name": "Test 2: Respiratory Issues",
        "symptoms": ["cough", "shortness of breath", "chest pain"],
        "description": "Potential respiratory problems"
    },
    {
        "name": "Test 3: Digestive Problems",
        "symptoms": ["stomach pain", "nausea", "vomiting", "diarrhea"],
        "description": "Gastrointestinal symptoms"
    },
    {
        "name": "Test 4: Neurological Symptoms",
        "symptoms": ["severe headache", "dizziness", "confusion"],
        "description": "Potential neurological issues"
    },
    {
        "name": "Test 5: Heart-related Symptoms",
        "symptoms": ["chest pain", "shortness of breath", "fatigue"],
        "description": "Cardiovascular concerns"
    },
    {
        "name": "Test 6: Skin Issues",
        "symptoms": ["rash", "itching", "skin redness"],
        "description": "Dermatological problems"
    },
    {
        "name": "Test 7: Single Symptom",
        "symptoms": ["fever"],
        "description": "Minimal symptom input"
    },
    {
        "name": "Test 8: Many Symptoms",
        "symptoms": ["fever", "cough", "headache", "fatigue", "muscle pain", "sore throat", "runny nose"],
        "description": "Complex multi-symptom case"
    },
    {
        "name": "Test 9: Misspelled Symptoms",
        "symptoms": ["fver", "cogh", "headach"],
        "description": "Test fuzzy matching capability"
    },
    {
        "name": "Test 10: Mixed Case and Spaces",
        "symptoms": ["FEVER", "dry cough", "Head Ache"],
        "description": "Test case sensitivity and spacing"
    }
]

def test_ml_api():
    base_url = "http://127.0.0.1:8001/predict"
    
    print("🔬 HEALLINK ML MODEL COMPREHENSIVE TEST SUITE")
    print("=" * 60)
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n{test_case['name']}")
        print("-" * 40)
        print(f"Description: {test_case['description']}")
        print(f"Input Symptoms: {test_case['symptoms']}")
        
        try:
            # Make API request
            response = requests.post(
                base_url,
                json={"symptoms": test_case['symptoms']},
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                
                print("\n✅ SUCCESSFUL PREDICTION:")
                print(f"   🔬 Predicted Disease: {result.get('Predicted Disease', 'N/A')}")
                print(f"   📊 Confidence: {(result.get('Confidence', 0) * 100):.1f}%")
                print(f"   ⚡ Severity Score: {result.get('Severity Score', 0)}/20")
                print(f"   🚨 Risk Level: {result.get('Risk Level', 'N/A')}")
                print(f"   🔄 Input Symptoms: {result.get('Input Symptoms', [])}")
                print(f"   ✅ Corrected Symptoms: {result.get('Corrected Symptoms', [])}")
                
                # Top 3 predictions
                if 'Top_3' in result:
                    print("\n   📈 Top 3 Possibilities:")
                    for idx, (disease, prob) in enumerate(result['Top_3'], 1):
                        print(f"      {idx}. {disease}: {(prob * 100):.1f}%")
                
                # Precautions
                if 'Precautions' in result and result['Precautions']:
                    print("\n   🛡️ Recommended Precautions:")
                    for precaution in result['Precautions'][:3]:  # Show first 3
                        print(f"      • {precaution}")
                
            else:
                print(f"❌ ERROR: HTTP {response.status_code}")
                print(f"   Response: {response.text}")
                
        except requests.exceptions.ConnectionError:
            print("❌ ERROR: Cannot connect to ML service on port 8001")
            print("   Please ensure the ML API server is running")
            break
        except requests.exceptions.Timeout:
            print("❌ ERROR: Request timed out")
        except Exception as e:
            print(f"❌ ERROR: {str(e)}")
        
        print("\n" + "=" * 60)
        time.sleep(0.5)  # Small delay between tests

if __name__ == "__main__":
    test_ml_api()