document.addEventListener('DOMContentLoaded', () => {
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
    const specialistRecommendation = getSpecialistForDisease(data["Predicted Disease"]);

    resultBox.innerHTML = `
        <div class="result-header">
            <h3>🎯 AI Health Analysis Complete</h3>
            <div class="confidence-badge">Confidence: ${(data["Confidence"] * 100).toFixed(1)}%</div>
        </div>
        
        <div class="result-section">
            <h4>🔬 Primary Prediction</h4>
            <p><strong>Condition:</strong> ${data["Predicted Disease"]}</p>
            <p><strong>Risk Level:</strong> <span class="risk-${data["Risk Level"].toLowerCase()}">${data["Risk Level"]}</span></p>
            <p><strong>Severity Score:</strong> ${data["Severity Score"]}/20</p>
        </div>

        <div class="result-section">
            <h4>📖 Medical Information</h4>
            <div class="description-text">
                ${data["Description"]}
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
                ${data["Precautions"].map(p => `<li>${p}</li>`).join("")}
            </ul>
        </div>

        <div class="result-section">
            <h4>🔍 Symptom Analysis</h4>
            <div class="symptom-analysis">
                <p><strong>Your Input:</strong> ${data["Input Symptoms"].join(", ")}</p>
                <p><strong>AI Processed:</strong> ${data["Corrected Symptoms"].join(", ")}</p>
            </div>
        </div>

        <div class="result-section">
            <h4>📊 Alternative Possibilities</h4>
            <div class="alternatives-list">
                ${data["Top_3"].map((item, index) => 
                    `<div class="alternative-item ${index === 0 ? 'primary' : ''}">
                        <span class="condition">${item[0]}</span>
                        <span class="probability">${(item[1] * 100).toFixed(1)}%</span>
                    </div>`
                ).join("")}
            </div>
        </div>

        <div class="result-actions">
            <button onclick="bookAppointment('${specialistRecommendation}')" class="btn-primary">Book Appointment</button>
            <button onclick="generateHealthReport()" class="btn-outline">Download Report</button>
        </div>

        <div class="disclaimer">
            <h4>⚠️ Important Medical Disclaimer</h4>
            <p>This AI analysis is for informational purposes only and should not replace professional medical advice. Please consult with a healthcare provider for proper diagnosis and treatment. In case of emergency, contact your local emergency services immediately.</p>
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

// Contact support
function contactSupport() {
    window.open('mailto:support@heallink.com?subject=Health Prediction Service Issue', '_blank');
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
