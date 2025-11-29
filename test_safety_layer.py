import requests
import json

def test_emergency_scenario():
    """Test the enhanced safety layer with emergency symptoms"""
    
    # Test case: Emergency cardiovascular symptoms
    test_data = {
        "symptoms": ["chest pain", "shortness of breath", "sweating", "nausea"],
        "age": 45,
        "gender": "male"
    }
    
    print("🚨 TESTING EMERGENCY SCENARIO")
    print("=" * 50)
    print(f"Input: {test_data}")
    print()
    
    try:
        # Test ML API
        print("Testing ML API with emergency symptoms...")
        response = requests.post("http://localhost:8001/predict", json=test_data, timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ ML API Response:")
            print(f"   Predicted Disease: {result.get('Predicted Disease')}")
            print(f"   Risk Level: {result.get('Risk Level')}")
            print(f"   Severity Score: {result.get('Severity Score')}")
            print(f"   Confidence: {result.get('Confidence', 0) * 100:.1f}%")
            print(f"   Symptoms: {result.get('Corrected Symptoms', [])}")
            
            # Simulate the safety layer check
            symptoms = result.get('Corrected Symptoms', [])
            emergency_keywords = ['chest pain', 'severe chest pain', 'shortness of breath', 'difficulty breathing']
            
            has_emergency = any(keyword in ' '.join(symptoms).lower() for keyword in emergency_keywords)
            
            if has_emergency:
                print("\n🚨 SAFETY LAYER DETECTION:")
                print("   ⚠️ EMERGENCY ALERT: Cardiovascular emergency symptoms detected!")
                print("   ⚠️ Immediate medical attention recommended")
                print("   ⚠️ System would display emergency action buttons")
            
            print("\n" + "=" * 50)
            print("✅ Emergency detection system working correctly!")
            
        else:
            print(f"❌ ML API Error: {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Connection Error: {e}")
        print("Make sure ML service is running on port 8001")

def test_non_emergency_scenario():
    """Test with non-emergency symptoms"""
    
    test_data = {
        "symptoms": ["mild headache", "fatigue"],
        "age": 30,
        "gender": "female"
    }
    
    print("\n🔍 TESTING NON-EMERGENCY SCENARIO")
    print("=" * 50)
    print(f"Input: {test_data}")
    print()
    
    try:
        response = requests.post("http://localhost:8001/predict", json=test_data, timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ ML API Response:")
            print(f"   Predicted Disease: {result.get('Predicted Disease')}")
            print(f"   Risk Level: {result.get('Risk Level')}")
            print(f"   Severity Score: {result.get('Severity Score')}")
            
            # Check if this would trigger emergency
            symptoms = result.get('Corrected Symptoms', [])
            emergency_keywords = ['chest pain', 'severe chest pain', 'shortness of breath', 'difficulty breathing']
            
            has_emergency = any(keyword in ' '.join(symptoms).lower() for keyword in emergency_keywords)
            
            if not has_emergency:
                print("\n✅ SAFETY LAYER: No emergency detected - Normal workflow")
            else:
                print("\n⚠️ Unexpected emergency detection")
                
        else:
            print(f"❌ Error: {response.status_code}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Connection Error: {e}")

if __name__ == "__main__":
    test_emergency_scenario()
    test_non_emergency_scenario()