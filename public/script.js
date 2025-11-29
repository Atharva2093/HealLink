// ================================\n// CATEGORY-SPECIFIC SAFETY LAYER\n// ================================\n\n// Symptom dictionaries (conservative medical categories)\nconst CATEGORY_SYMPTOMS = {\n    cardio: {\n        core: [\n            \"chest_pain\",\n            \"chest tightness\",\n            \"palpitations\",\n            \"shortness_of_breath\",\n            \"shortness of breath\",\n            \"radiating_pain_arm\",\n            \"radiating_pain_jaw\",\n            \"swelling_legs\",\n            \"fainting\",\n            \"syncope\",\n            \"heart_palpitations\"\n        ],\n        redFlags: [\n            \"severe_chest_pain\",\n            \"crushing_chest_pain\",\n            \"chest_pain_exertion\",\n            \"shortness_of_breath_rest\",\n            \"sweating_with_chest_pain\",\n            \"chest pain\",\n            \"severe chest pain\"\n        ]\n    },\n\n    neuro: {\n        core: [\n            \"headache\",\n            \"severe_headache\",\n            \"dizziness\",\n            \"confusion\",\n            \"blurred_vision\",\n            \"numbness\",\n            \"weakness\",\n            \"speech_difficulty\",\n            \"seizure\",\n            \"migraine\"\n        ],\n        redFlags: [\n            \"sudden_severe_headache\",\n            \"loss_of_consciousness\",\n            \"one_sided_weakness\",\n            \"one_sided_numbness\",\n            \"inability_to_speak\",\n            \"seizure\",\n            \"confusion_acute\",\n            \"severe headache\"\n        ]\n    },\n\n    respiratory: {\n        core: [\n            \"cough\",\n            \"dry_cough\",\n            \"productive_cough\",\n            \"shortness_of_breath\",\n            \"wheezing\",\n            \"chest_tightness\",\n            \"sore_throat\",\n            \"runny_nose\",\n            \"throat_irritation\",\n            \"continuous_sneezing\"\n        ],\n        redFlags: [\n            \"shortness_of_breath_rest\",\n            \"unable_to_speak_full_sentences\",\n            \"blue_lips\",\n            \"stridor\",\n            \"severe shortness of breath\"\n        ]\n    },\n\n    gi: {\n        core: [\n            \"stomach_pain\",\n            \"abdominal_pain\",\n            \"nausea\",\n            \"vomiting\",\n            \"diarrhoea\",\n            \"diarrhea\",\n            \"heartburn\",\n            \"bloating\",\n            \"acidity\"\n        ],\n        redFlags: [\n            \"severe_abdominal_pain\",\n            \"blood_in_vomit\",\n            \"blood_in_stool\",\n            \"black_stool\",\n            \"persistent_vomiting\",\n            \"severe stomach pain\"\n        ]\n    }\n};\n\n// Category analysis function\nfunction analyzeCategories(normalizedSymptoms) {\n    const scores = {\n        cardio: 0,\n        neuro: 0,\n        respiratory: 0,\n        gi: 0\n    };\n\n    const redFlagHits = {\n        cardio: false,\n        neuro: false,\n        respiratory: false,\n        gi: false\n    };\n\n    for (const s of normalizedSymptoms) {\n        const symptom = s.toLowerCase().trim();\n        \n        for (const [cat, def] of Object.entries(CATEGORY_SYMPTOMS)) {\n            // Check core symptoms\n            if (def.core.some(core => symptom.includes(core) || core.includes(symptom))) {\n                scores[cat] += 1; // basic weight\n            }\n            \n            // Check red flags\n            if (def.redFlags.some(flag => symptom.includes(flag) || flag.includes(symptom))) {\n                scores[cat] += 3; // strong boost\n                redFlagHits[cat] = true;\n            }\n        }\n    }\n\n    // Determine dominant category\n    let dominantCategory = null;\n    let maxScore = 0;\n    for (const [cat, score] of Object.entries(scores)) {\n        if (score > maxScore) {\n            maxScore = score;\n            dominantCategory = score > 0 ? cat : null;\n        }\n    }\n\n    return {\n        scores,\n        redFlagHits,\n        dominantCategory,\n        hasAnyRedFlag: Object.values(redFlagHits).some(v => v)\n    };\n}\n\n// Rule-based safety layer\nfunction applyRuleBasedLayer(normalizedSymptoms, mlResult) {\n    const categoryAnalysis = analyzeCategories(normalizedSymptoms);\n\n    let finalRiskLevel = mlResult[\"Risk Level\"] || \"Low\";\n    let finalSeverity = mlResult[\"Severity Score\"] || 0;\n    let flags = [];\n    let triageAction = \"monitor_and_consult\";\n    let emergencyAlert = false;\n\n    // 1) Emergency override based on red flags\n    if (categoryAnalysis.hasAnyRedFlag) {\n        finalRiskLevel = \"High\";\n        finalSeverity = Math.max(finalSeverity, 17); // push near upper bound\n        triageAction = \"urgent_medical_evaluation\";\n        emergencyAlert = true;\n\n        if (categoryAnalysis.redFlagHits.cardio) {\n            flags.push(\"⚠️ Possible cardiac emergency symptoms detected\");\n        }\n        if (categoryAnalysis.redFlagHits.neuro) {\n            flags.push(\"⚠️ Possible neurological emergency symptoms detected\");\n        }\n        if (categoryAnalysis.redFlagHits.respiratory) {\n            flags.push(\"⚠️ Possible respiratory emergency symptoms detected\");\n        }\n        if (categoryAnalysis.redFlagHits.gi) {\n            flags.push(\"⚠️ Possible gastrointestinal emergency symptoms detected\");\n        }\n    }\n\n    // 2) Category mismatch correction\n    if (!categoryAnalysis.hasAnyRedFlag && categoryAnalysis.dominantCategory) {\n        const confidence = mlResult[\"Confidence\"] || 0;\n        \n        // If ML confidence is low, trust category-based risk more\n        if (confidence < 0.25) {\n            if ([\"cardio\", \"neuro\", \"respiratory\"].includes(categoryAnalysis.dominantCategory)) {\n                if (finalRiskLevel === \"Low\") finalRiskLevel = \"Medium\";\n                if (finalRiskLevel === \"Medium\") finalRiskLevel = \"High\";\n                finalSeverity = Math.max(finalSeverity, 13);\n                flags.push(`🔍 Risk adjusted based on ${categoryAnalysis.dominantCategory} symptoms`);\n            }\n        }\n\n        // Add category-specific guidance\n        const categoryMap = {\n            cardio: \"Consider consulting a cardiologist\",\n            neuro: \"Consider consulting a neurologist\", \n            respiratory: \"Consider consulting a pulmonologist\",\n            gi: \"Consider consulting a gastroenterologist\"\n        };\n        \n        if (categoryMap[categoryAnalysis.dominantCategory]) {\n            flags.push(`💡 ${categoryMap[categoryAnalysis.dominantCategory]}`);\n        }\n    }\n\n    // 3) Single symptom handling\n    if (normalizedSymptoms.length === 1) {\n        flags.push(\"ℹ️ Limited symptoms provided - consider comprehensive evaluation\");\n        const confidence = mlResult[\"Confidence\"] || 0;\n        if (confidence < 0.2) {\n            triageAction = \"general_checkup_recommended\";\n        }\n    }\n\n    // 4) Low confidence warning\n    if ((mlResult[\"Confidence\"] || 0) < 0.15) {\n        flags.push(\"⚠️ Low prediction confidence - seek professional medical advice\");\n    }\n\n    return {\n        ...mlResult,\n        categoryAnalysis,\n        \"Risk Level\": finalRiskLevel,\n        \"Severity Score\": Math.min(finalSeverity, 20), // ensure cap at 20\n        safetyFlags: flags,\n        triageAction,\n        emergencyAlert\n    };\n}\n\n// ================================\n//      MAIN SCRIPT FUNCTIONS  \n// ================================\n\ndocument.addEventListener('DOMContentLoaded', () => {
    // Header Scroll Effect
    const header = document.querySelector('.header');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Intersection Observer for Scroll Animations
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('.fade-in-up');
    animatedElements.forEach(el => observer.observe(el));

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                // Adjust for fixed header
                const headerHeight = document.querySelector('.header').offsetHeight;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerHeight;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Health Prediction with ML Model Integration
    const analyzeBtn = document.getElementById('analyzeBtn');
    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', predictDisease);
    }
});

// Enhanced Health Prediction with ML Integration
const analyzeBtn = document.getElementById('analyzeBtn');
if (analyzeBtn) {
    analyzeBtn.addEventListener('click', predictDisease);

    // Auto-resize textareas and enhance UX
    const symptomsInput = document.getElementById('symptomsInput');
    if (symptomsInput) {
        symptomsInput.addEventListener('input', function() {
            // Clear previous results when input changes
            const resultBox = document.getElementById('resultBox');
            if (resultBox && resultBox.style.display === 'block') {
                resultBox.style.display = 'none';
            }
        });
    }
}

// Enhanced ML Model Disease Prediction Function
async function predictDisease() {
    const symptomsInput = document.getElementById('symptomsInput').value;
    const ageInput = document.getElementById('ageInput').value;
    const genderInput = document.getElementById('genderInput').value;
    const resultBox = document.getElementById('resultBox');

    // Enhanced validation
    if (!symptomsInput.trim()) {
        showAlert('Please enter at least one symptom.', 'warning');
        return;
    }

    // Show loading state with enhanced UI
    setLoadingState(true);

    try {
        // Prepare symptoms array with better processing
        const symptoms = symptomsInput.split(/[,;\\n]+/).map(s => s.trim()).filter(s => s.length > 0);
        
        if (symptoms.length === 0) {
            throw new Error('Please enter valid symptoms.');
        }

        // Try ML model API first (primary)
        let mlSuccess = false;
        try {
            const response = await fetch("http://127.0.0.1:8001/predict", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ symptoms })
            });

            if (response.ok) {
                const data = await response.json();
                if (!data.error) {
                    displayMLResults(data, ageInput, genderInput);
                    mlSuccess = true;
                }
            }
        } catch (mlError) {
            console.log('ML API unavailable, using enhanced fallback system...');
        }

        // Enhanced fallback system if ML fails
        if (!mlSuccess) {
            await enhancedRuleBasedPrediction(symptoms, ageInput, genderInput);
        }

    } catch (error) {
        console.error('Prediction error:', error);
        displayErrorResult(error.message);
    } finally {
        setLoadingState(false);
    }
}

// Enhanced loading state management
function setLoadingState(isLoading) {
    const analyzeBtn = document.getElementById('analyzeBtn');
    
    if (isLoading) {
        analyzeBtn.textContent = '🔄 Analyzing...';
        analyzeBtn.disabled = true;
        analyzeBtn.style.opacity = '0.7';
    } else {
        analyzeBtn.textContent = '🔬 Analyze Symptoms';
        analyzeBtn.disabled = false;
        analyzeBtn.style.opacity = '1';
    }
}

// Display comprehensive ML model results
function displayMLResults(data, age, gender) {
    const resultBox = document.getElementById('resultBox');
    
    // Apply rule-based safety layer
    const enhancedData = applyRuleBasedLayer(data["Corrected Symptoms"] || [], data);
    
    const specialistRecommendation = getSpecialistForDisease(enhancedData["Predicted Disease"]);

    // Emergency alert styling
    const emergencyClass = enhancedData.emergencyAlert ? 'emergency-alert' : '';
    const emergencyIcon = enhancedData.emergencyAlert ? '🚨' : '🎯';

    resultBox.innerHTML = `
        <div class="result-header ${emergencyClass}">
            <h3>${emergencyIcon} AI Health Analysis Complete</h3>
            <div class="confidence-badge">Confidence: ${(enhancedData["Confidence"] * 100).toFixed(1)}%</div>
            ${enhancedData.emergencyAlert ? '<div class="emergency-badge">⚠️ URGENT EVALUATION RECOMMENDED</div>' : ''}
        </div>
        
        <div class="result-section">
            <h4>🔬 Primary Prediction</h4>
            <p><strong>Condition:</strong> ${enhancedData["Predicted Disease"]}</p>
            <p><strong>Risk Level:</strong> <span class="risk-${enhancedData["Risk Level"].toLowerCase()}">${enhancedData["Risk Level"]}</span></p>
            <p><strong>Severity Score:</strong> ${enhancedData["Severity Score"]}/20</p>
            ${enhancedData.triageAction ? `<p><strong>Recommended Action:</strong> ${enhancedData.triageAction.replace(/_/g, ' ').toUpperCase()}</p>` : ''}
        </div>

        ${enhancedData.safetyFlags && enhancedData.safetyFlags.length > 0 ? `
        <div class="result-section safety-flags">
            <h4>🛡️ Safety Assessment</h4>
            <ul class="safety-flags-list">
                ${enhancedData.safetyFlags.map(flag => `<li>${flag}</li>`).join("")}
            </ul>
        </div>` : ''}

        <div class="result-section">
            <h4>📖 Medical Information</h4>
            <div class="description-text">
                ${enhancedData["Description"]}
            </div>
        </div>

        <div class="result-section">
            <h4>⚕️ Recommended Specialist</h4>
            <div class="specialist-info">
                <strong>${specialistRecommendation}</strong>
                <p>Based on your predicted condition</p>
            </div>
        </div>

        <div class="result-section">
            <h4>🛡️ Recommended Precautions</h4>
            <ul class="precautions-list">
                ${enhancedData["Precautions"].map(p => `<li>${p}</li>`).join("")}
            </ul>
        </div>

        <div class="result-section">
            <h4>🔍 Symptom Analysis</h4>
            <div class="symptom-analysis">
                <p><strong>Your Input:</strong> ${enhancedData["Input Symptoms"].join(", ")}</p>
                <p><strong>AI Processed:</strong> ${enhancedData["Corrected Symptoms"].join(", ")}</p>
                ${enhancedData.categoryAnalysis && enhancedData.categoryAnalysis.dominantCategory ? 
                    `<p><strong>Primary Category:</strong> ${enhancedData.categoryAnalysis.dominantCategory.toUpperCase()}</p>` : ''}
            </div>
        </div>

        <div class="result-section">
            <h4>📊 Alternative Possibilities</h4>
            <div class="alternatives-list">
                ${enhancedData["Top_3"].map((item, index) => 
                    `<div class="alternative-item ${index === 0 ? 'primary' : ''}">
                        <span class="condition">${item[0]}</span>
                        <span class="probability">${(item[1] * 100).toFixed(1)}%</span>
                    </div>`
                ).join("")}
            </div>
        </div>

        <div class="result-actions">
            ${enhancedData.emergencyAlert ? 
                '<button onclick="handleEmergencyAction()" class="btn-emergency">🚨 Seek Immediate Medical Attention</button>' :
                '<button onclick="bookAppointment(\''+specialistRecommendation+'\')" class="btn-primary">Book Appointment</button>'
            }
            <button onclick="generateHealthReport()" class="btn-outline">Download Report</button>
        </div>

        <div class="disclaimer">
            <h4>⚠️ Important Medical Disclaimer</h4>
            <p><strong>This is an AI-based risk estimate, not a medical diagnosis.</strong> This analysis is for informational purposes only and should never replace professional medical advice. Always consult with a qualified healthcare provider for proper diagnosis and treatment. In case of emergency symptoms, contact your local emergency services immediately.</p>
            ${enhancedData.emergencyAlert ? '<p class="emergency-text"><strong>🚨 EMERGENCY ALERT: The symptoms you\'ve reported may indicate a serious medical condition requiring immediate attention. Please seek emergency medical care without delay.</strong></p>' : ''}
        </div>
    `;

    resultBox.style.display = 'block';
    resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    // Add animation
    setTimeout(() => {
        resultBox.classList.add('result-visible');
    }, 100);
}

// Enhanced rule-based prediction fallback
async function enhancedRuleBasedPrediction(symptoms, age, gender) {
    const riskFactors = calculateRiskFactors(symptoms, age, gender);
    const prediction = generateRuleBasedPrediction(riskFactors);
    
    displayFallbackResults(prediction);
}

// Calculate enhanced risk factors
function calculateRiskFactors(symptoms, age, gender) {
    const riskMap = {
        'chest pain': { risk: 'High', specialty: 'Cardiologist', severity: 8 },
        'shortness of breath': { risk: 'High', specialty: 'Pulmonologist', severity: 7 },
        'severe headache': { risk: 'Medium', specialty: 'Neurologist', severity: 6 },
        'fever': { risk: 'Medium', specialty: 'General Physician', severity: 5 },
        'cough': { risk: 'Low', specialty: 'General Physician', severity: 3 },
        'fatigue': { risk: 'Low', specialty: 'General Physician', severity: 2 }
    };

    let maxRisk = 'Low';
    let specialist = 'General Physician';
    let totalSeverity = 0;
    let conditions = [];

    symptoms.forEach(symptom => {
        const lowerSymptom = symptom.toLowerCase().trim();
        for (const [key, value] of Object.entries(riskMap)) {
            if (lowerSymptom.includes(key)) {
                totalSeverity += value.severity;
                if (value.risk === 'High' || (value.risk === 'Medium' && maxRisk === 'Low')) {
                    maxRisk = value.risk;
                    specialist = value.specialty;
                }
                conditions.push(`Possible ${key.charAt(0).toUpperCase() + key.slice(1)} related condition`);
            }
        }
    });

    // Age factor
    if (age && parseInt(age) > 60) {
        totalSeverity += 2;
        if (maxRisk === 'Low') maxRisk = 'Medium';
    }

    return {
        riskLevel: totalSeverity > 10 ? 'High' : totalSeverity > 5 ? 'Medium' : 'Low',
        specialist,
        conditions: conditions.length > 0 ? conditions : ['General health assessment needed'],
        severity: totalSeverity
    };
}

// Generate rule-based prediction
function generateRuleBasedPrediction(riskFactors) {
    return {
        riskLevel: riskFactors.riskLevel,
        potentialConditions: riskFactors.conditions,
        recommendedSpecialist: riskFactors.specialist,
        severityScore: riskFactors.severity,
        confidence: 0.75 // Rule-based confidence
    };
}

// Display enhanced fallback results
function displayFallbackResults(data) {
    const resultBox = document.getElementById('resultBox');
    
    resultBox.innerHTML = `
        <div class="result-header fallback">
            <h3>📋 Health Assessment Results</h3>
            <div class="system-badge">Rule-Based Analysis</div>
        </div>
        
        <div class="result-section">
            <h4>📈 Assessment Summary</h4>
            <p><strong>Risk Level:</strong> <span class="risk-${data.riskLevel.toLowerCase()}">${data.riskLevel}</span></p>
            <p><strong>Severity Score:</strong> ${data.severityScore}/20</p>
            <p><strong>Analysis Confidence:</strong> ${(data.confidence * 100).toFixed(0)}%</p>
        </div>

        <div class="result-section">
            <h4>🏥 Possible Conditions</h4>
            <ul class="conditions-list">
                ${data.potentialConditions.map(condition => `<li>${condition}</li>`).join('')}
            </ul>
        </div>

        <div class="result-section">
            <h4>⚕️ Recommended Specialist</h4>
            <div class="specialist-info">
                <strong>${data.recommendedSpecialist}</strong>
                <p>Based on your symptoms</p>
            </div>
        </div>

        <div class="result-actions">
            <button onclick="bookAppointment('${data.recommendedSpecialist}')" class="btn-primary">Book Appointment</button>
            <button onclick="checkMLServiceAndRetry()" class="btn-outline">🔄 Check ML Service</button>
        </div>
        
        <div class="system-note">
            <p>💡 <strong>Note:</strong> Advanced ML analysis unavailable. Using rule-based assessment. Click "Check ML Service" to retry with full AI analysis.</p>
        </div>
        
        <div class="disclaimer">
            <h4>⚠️ Medical Disclaimer</h4>
            <p>This assessment is not a medical diagnosis. Please consult with a healthcare professional for proper medical advice.</p>
        </div>
    `;

    resultBox.style.display = 'block';
    resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    setTimeout(() => {
        resultBox.classList.add('result-visible');
    }, 100);
}

// Display error when services are unavailable
function displayErrorResult(errorMessage) {
    const resultBox = document.getElementById('resultBox');
    
    resultBox.innerHTML = `
        <div class="result-header error">
            <h3>⚠️ Service Unavailable</h3>
        </div>
        
        <div class="error-content">
            <div class="error-icon">🔧</div>
            <h4>Health Prediction Service Temporarily Unavailable</h4>
            <p><strong>Error:</strong> ${errorMessage}</p>
            
            <div class="error-solutions">
                <h5>Possible Solutions:</h5>
                <ul>
                    <li>Ensure the ML model server is running on port 8001</li>
                    <li>Check your internet connection</li>
                    <li>Try refreshing the page</li>
                    <li>Contact support if the issue persists</li>
                </ul>
            </div>
            
            <div class="error-commands">
                <h5>For Developers:</h5>
                <code>cd mlmodel && python api.py</code>
            </div>
        </div>
        
        <div class="result-actions">
            <button onclick="location.reload()" class="btn-outline">Refresh Page</button>
            <button onclick="contactSupport()" class="btn-primary">Contact Support</button>
        </div>
    `;
    
    resultBox.style.display = 'block';
    resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Utility functions for enhanced UX
function showAlert(message, type = 'info') {
    // Remove existing alerts
    const existingAlerts = document.querySelectorAll('.alert');
    existingAlerts.forEach(alert => alert.remove());
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.innerHTML = `
        <span class="alert-icon">${type === 'warning' ? '⚠️' : type === 'error' ? '❌' : 'ℹ️'}</span>
        <span class="alert-message">${message}</span>
        <button class="alert-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    document.body.appendChild(alertDiv);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

// Enhanced appointment booking
function bookAppointment(specialist) {
    if (localStorage.getItem('isLoggedIn') === 'true') {
        window.open('views/portal.html#appointments', '_blank');
    } else {
        if (confirm(`To book an appointment with a ${specialist}, you need to log in to your patient portal. Would you like to log in now?`)) {
            window.location.href = 'views/login.html';
        }
    }
}

// Generate health report
function generateHealthReport() {
    const resultData = document.getElementById('resultBox').innerHTML;
    const reportWindow = window.open('', '_blank');
    reportWindow.document.write(`
        <html>
            <head>
                <title>HealLink Health Report</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
                    .result-section { margin: 20px 0; padding: 15px; border-left: 4px solid #3498db; background: #f9f9f9; }
                    .disclaimer { background: #fff3cd; padding: 15px; border: 1px solid #ffc107; border-radius: 5px; }
                    .risk-high { color: #e74c3c; font-weight: bold; }
                    .risk-medium { color: #f39c12; font-weight: bold; }
                    .risk-low { color: #27ae60; font-weight: bold; }
                </style>
            </head>
            <body>
                <h1>🏥 HealLink Health Report</h1>
                <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
                <hr>
                ${resultData}
            </body>
        </html>
    `);
}

// Check ML service status and retry analysis
function checkMLServiceAndRetry() {
    const symptomsInput = document.getElementById('symptomsInput').value;
    if (!symptomsInput.trim()) {
        showAlert('Please enter symptoms first.', 'warning');
        return;
    }

    showAlert('🔍 Checking ML service availability...', 'info');
    
    // Test ML service connection
    fetch("http://127.0.0.1:8001/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symptoms: ["test"] })
    })
    .then(response => {
        if (response.ok) {
            showAlert('✅ ML service is now available! Running advanced analysis...', 'info');
            setTimeout(() => predictDisease(), 1000);
        } else {
            showAlert('❌ ML service still unavailable. Please start the service first.', 'warning');
        }
    })
    .catch(() => {
        showAlert('❌ ML service unavailable. Please ensure it\'s running on port 8001.', 'error');
    });
}

// Emergency action handler
function handleEmergencyAction() {
    const emergencyNumbers = {
        'US': '911',
        'UK': '999',
        'EU': '112',
        'AU': '000',
        'IN': '102'
    };
    
    const message = `🚨 EMERGENCY MEDICAL ATTENTION NEEDED\n\nThe symptoms you've reported may indicate a serious medical condition.\n\nPlease:\n1. Call emergency services immediately\n2. Do not drive yourself to the hospital\n3. Have someone accompany you\n\nEmergency Numbers:\n• US/Canada: 911\n• UK: 999\n• Europe: 112\n• Australia: 000\n• India: 102\n\nThis is not a diagnosis, but immediate medical evaluation is recommended.`;
    
    alert(message);
    
    // Also try to open emergency services page
    if (confirm('Would you like to open emergency services information for your area?')) {
        window.open('https://en.wikipedia.org/wiki/List_of_emergency_telephone_numbers', '_blank');
    }
}

// Contact support
function contactSupport() {
    window.open('mailto:support@heallink.com?subject=Health Prediction Service Issue&body=Please describe your issue with the health prediction system.', '_blank');
}

// Helper function to get specialist based on disease
function getSpecialistForDisease(disease) {
    const diseaseSpecialistMap = {
        // Heart related
        'heart attack': 'Cardiologist',
        'hypertension': 'Cardiologist', 
        'heart disease': 'Cardiologist',
        
        // Respiratory
        'pneumonia': 'Pulmonologist',
        'bronchial asthma': 'Pulmonologist',
        'tuberculosis': 'Pulmonologist',
        
        // Digestive
        'gastroesophageal reflux disease': 'Gastroenterologist',
        'peptic ulcer diseae': 'Gastroenterologist',
        'gastroenteritis': 'Gastroenterologist',
        
        // Neurological  
        'migraine': 'Neurologist',
        'cervical spondylosis': 'Neurologist',
        'paralysis (brain hemorrhage)': 'Neurologist',
        
        // Infectious
        'malaria': 'Infectious Disease Specialist',
        'dengue': 'Infectious Disease Specialist',
        'typhoid': 'Infectious Disease Specialist',
        'hepatitis a': 'Infectious Disease Specialist',
        'hepatitis b': 'Infectious Disease Specialist',
        'hepatitis c': 'Infectious Disease Specialist',
        'hepatitis d': 'Infectious Disease Specialist',
        'hepatitis e': 'Infectious Disease Specialist',
        
        // Skin
        'psoriasis': 'Dermatologist',
        'fungal infection': 'Dermatologist',
        'impetigo': 'Dermatologist',
        
        // Endocrine
        'diabetes': 'Endocrinologist',
        'hyperthyroidism': 'Endocrinologist',
        'hypothyroidism': 'Endocrinologist',
        
        // Orthopedic
        'arthritis': 'Orthopedist',
        'osteoarthristis': 'Orthopedist',
        
        // Urological
        'urinary tract infection': 'Urologist',
        
        // Others
        'jaundice': 'Hepatologist',
        'chronic cholestasis': 'Hepatologist',
        'drug reaction': 'General Physician',
        'allergy': 'Allergist',
        'common cold': 'General Physician',
        'chicken pox': 'Pediatrician',
        'varicose veins': 'Vascular Surgeon'
    };
    
    const normalizedDisease = disease.toLowerCase().trim();
    return diseaseSpecialistMap[normalizedDisease] || 'General Physician';
}

// Emergency action handler
function handleEmergencyAction() {
    const emergencyModal = document.createElement('div');
    emergencyModal.className = 'emergency-modal';
    emergencyModal.innerHTML = `
        <div class="emergency-modal-content">
            <div class="emergency-header">
                <h2>🚨 Emergency Medical Situation</h2>
                <span class="close-emergency" onclick="closeEmergencyModal()">&times;</span>
            </div>
            <div class="emergency-body">
                <p><strong>Based on your symptoms, immediate medical attention is strongly recommended.</strong></p>
                <div class="emergency-options">
                    <h3>Take Action Now:</h3>
                    <button onclick="callEmergencyServices()" class="btn-emergency-action">
                        📞 Call Emergency Services
                    </button>
                    <button onclick="findNearestER()" class="btn-emergency-action">
                        🏥 Find Nearest Emergency Room
                    </button>
                    <button onclick="contactPrimaryPhysician()" class="btn-emergency-action">
                        👨‍⚕️ Contact Primary Physician
                    </button>
                </div>
                <div class="emergency-warning">
                    <p>⚠️ <strong>Do not delay seeking medical care.</strong> These symptoms may indicate a serious condition requiring immediate evaluation.</p>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(emergencyModal);
    emergencyModal.style.display = 'flex';
}

function closeEmergencyModal() {
    const modal = document.querySelector('.emergency-modal');
    if (modal) {
        modal.remove();
    }
}

function callEmergencyServices() {
    alert('Please dial your local emergency number:\n\n• US: 911\n• UK: 999\n• EU: 112\n• Australia: 000');
}

function findNearestER() {
    window.open('https://www.google.com/maps/search/emergency+room+near+me', '_blank');
}

function contactPrimaryPhysician() {
    alert('Please contact your primary care physician immediately. If they are unavailable, consider visiting an urgent care center or emergency room.');
}
