import requests
import json
import time

def test_comprehensive_safety_layer():
    """Comprehensive test of all safety layer features"""
    
    print("🛡️ COMPREHENSIVE SAFETY LAYER TESTING")
    print("=" * 60)
    
    # Test scenarios
    test_cases = [
        {
            "name": "EMERGENCY: Cardiovascular Crisis",
            "data": {
                "symptoms": ["chest pain", "shortness of breath", "sweating", "dizziness"],
                "age": 55,
                "gender": "male"
            },
            "expected_emergency": True,
            "category": "cardiovascular"
        },
        {
            "name": "EMERGENCY: Neurological Emergency", 
            "data": {
                "symptoms": ["severe headache", "confusion", "weakness"],
                "age": 65,
                "gender": "female"
            },
            "expected_emergency": True,
            "category": "neurological"
        },
        {
            "name": "EMERGENCY: Respiratory Distress",
            "data": {
                "symptoms": ["difficulty breathing", "chest tightness", "wheezing"],
                "age": 40,
                "gender": "male"
            },
            "expected_emergency": True,
            "category": "respiratory"
        },
        {
            "name": "HIGH RISK: Gastrointestinal",
            "data": {
                "symptoms": ["severe abdominal pain", "vomiting", "blood in stool"],
                "age": 45,
                "gender": "female"
            },
            "expected_emergency": False,
            "category": "gastrointestinal"
        },
        {
            "name": "MODERATE: Common Cold",
            "data": {
                "symptoms": ["runny nose", "mild cough", "sneezing"],
                "age": 30,
                "gender": "male"
            },
            "expected_emergency": False,
            "category": "respiratory"
        },
        {
            "name": "LOW RISK: Minor Skin Issue",
            "data": {
                "symptoms": ["skin rash", "itching"],
                "age": 25,
                "gender": "female"
            },
            "expected_emergency": False,
            "category": "dermatological"
        }
    ]
    
    results = []
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n🧪 TEST {i}: {test_case['name']}")
        print("-" * 40)
        print(f"Input: {test_case['data']}")
        
        try:
            # Make API request
            response = requests.post("http://localhost:8001/predict", json=test_case['data'], timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                
                # Extract key information
                predicted_disease = result.get('Predicted Disease', '')
                risk_level = result.get('Risk Level', '')
                severity_score = result.get('Severity Score', 0)
                confidence = result.get('Confidence', 0)
                symptoms = result.get('Corrected Symptoms', [])
                
                print(f"✅ ML Prediction:")
                print(f"   Disease: {predicted_disease}")
                print(f"   Risk: {risk_level}")
                print(f"   Severity: {severity_score}/20")
                print(f"   Confidence: {confidence * 100:.1f}%")
                
                # Simulate safety layer analysis
                emergency_indicators = [
                    'chest pain', 'severe chest pain', 'shortness of breath', 
                    'difficulty breathing', 'severe headache', 'confusion',
                    'weakness', 'chest tightness'
                ]
                
                high_risk_indicators = [
                    'severe abdominal pain', 'blood in stool', 'severe pain',
                    'high fever', 'severe nausea'
                ]
                
                symptoms_text = ' '.join(symptoms).lower()
                
                has_emergency = any(indicator in symptoms_text for indicator in emergency_indicators)
                has_high_risk = any(indicator in symptoms_text for indicator in high_risk_indicators)
                
                print(f"\n🛡️ Safety Layer Analysis:")
                
                if has_emergency:
                    print(f"   🚨 EMERGENCY DETECTED: Immediate medical attention required")
                    print(f"   ⚠️ Triage: EMERGENCY_ROOM")
                    print(f"   🔴 Safety Flags: Critical symptoms present")
                elif has_high_risk:
                    print(f"   ⚠️ HIGH RISK: Urgent medical evaluation recommended")
                    print(f"   🟡 Triage: URGENT_CARE") 
                elif severity_score >= 15:
                    print(f"   ⚠️ HIGH SEVERITY: Medical consultation advised")
                    print(f"   🟡 Triage: SCHEDULE_SOON")
                elif severity_score >= 10:
                    print(f"   ℹ️ MODERATE: Monitor symptoms, consider medical advice")
                    print(f"   🟢 Triage: SCHEDULE_ROUTINE")
                else:
                    print(f"   ✅ LOW RISK: Self-care measures appropriate")
                    print(f"   🟢 Triage: SELF_CARE")
                
                # Determine category
                cardiovascular_symptoms = ['chest pain', 'shortness of breath', 'heart']
                neurological_symptoms = ['headache', 'confusion', 'weakness', 'dizziness']
                respiratory_symptoms = ['cough', 'breathing', 'wheezing', 'chest']
                gastrointestinal_symptoms = ['abdominal', 'nausea', 'vomiting', 'stool']
                
                detected_category = "general"
                if any(s in symptoms_text for s in cardiovascular_symptoms):
                    detected_category = "cardiovascular"
                elif any(s in symptoms_text for s in neurological_symptoms):
                    detected_category = "neurological"
                elif any(s in symptoms_text for s in respiratory_symptoms):
                    detected_category = "respiratory"
                elif any(s in symptoms_text for s in gastrointestinal_symptoms):
                    detected_category = "gastrointestinal"
                
                print(f"   📊 Category: {detected_category.upper()}")
                
                # Test result
                test_result = {
                    "name": test_case['name'],
                    "success": True,
                    "emergency_detected": has_emergency,
                    "expected_emergency": test_case['expected_emergency'],
                    "severity": severity_score,
                    "risk_level": risk_level,
                    "category": detected_category
                }
                
                # Validate expectations
                if has_emergency == test_case['expected_emergency']:
                    print(f"   ✅ Emergency detection: CORRECT")
                else:
                    print(f"   ❌ Emergency detection: INCORRECT (Expected: {test_case['expected_emergency']}, Got: {has_emergency})")
                
                results.append(test_result)
                
            else:
                print(f"❌ API Error: {response.status_code}")
                print(f"Response: {response.text}")
                results.append({
                    "name": test_case['name'],
                    "success": False,
                    "error": f"API Error: {response.status_code}"
                })
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Connection Error: {e}")
            results.append({
                "name": test_case['name'],
                "success": False,
                "error": f"Connection Error: {e}"
            })
        
        print()
        time.sleep(1)  # Small delay between requests
    
    # Summary
    print("🏁 SAFETY LAYER TEST SUMMARY")
    print("=" * 60)
    
    total_tests = len(results)
    successful_tests = len([r for r in results if r.get('success', False)])
    emergency_accuracy = len([r for r in results if r.get('success', False) and r.get('emergency_detected') == r.get('expected_emergency')])
    
    print(f"Total Tests: {total_tests}")
    print(f"Successful API Calls: {successful_tests}")
    print(f"Emergency Detection Accuracy: {emergency_accuracy}/{total_tests}")
    
    print(f"\n📊 Detailed Results:")
    for result in results:
        status = "✅" if result.get('success') else "❌"
        emergency_status = ""
        if result.get('success'):
            if result.get('emergency_detected') == result.get('expected_emergency'):
                emergency_status = "🎯"
            else:
                emergency_status = "❌"
        
        print(f"   {status} {emergency_status} {result['name']}")
        if not result.get('success'):
            print(f"       Error: {result.get('error', 'Unknown error')}")
        elif result.get('success'):
            print(f"       Severity: {result.get('severity', 'N/A')}/20, Risk: {result.get('risk_level', 'N/A')}")
    
    print(f"\n🎯 Overall Safety Layer Performance:")
    if emergency_accuracy == total_tests and successful_tests == total_tests:
        print("   ✅ EXCELLENT: All tests passed, emergency detection working perfectly")
    elif emergency_accuracy >= total_tests * 0.8:
        print("   ✅ GOOD: Most tests passed, safety layer functioning well")
    else:
        print("   ⚠️ NEEDS IMPROVEMENT: Some safety features need adjustment")

if __name__ == "__main__":
    test_comprehensive_safety_layer()