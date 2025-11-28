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

// ML Model Disease Prediction Function
async function predictDisease() {
    const symptomsInput = document.getElementById('symptomsInput').value;
    const ageInput = document.getElementById('ageInput').value;
    const genderInput = document.getElementById('genderInput').value;
    const resultBox = document.getElementById('resultBox');

    // Validation
    if (!symptomsInput) {
        alert("Please enter symptoms.");
        return;
    }

    // Show loading state
    const analyzeBtn = document.getElementById('analyzeBtn');
    const originalText = analyzeBtn.textContent;
    analyzeBtn.textContent = 'Analyzing...';
    analyzeBtn.disabled = true;

    try {
        // Prepare symptoms array
        const symptoms = symptomsInput.split(",").map(s => s.trim()).filter(s => s.length > 0);

        // Call ML model API
        const response = await fetch("http://127.0.0.1:8001/predict", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ symptoms })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        // Display ML model results in the existing result box
        displayMLResults(data, ageInput, genderInput);

    } catch (error) {
        console.error('Prediction error:', error);
        
        // Show error message if ML model fails
        displayErrorResult(error.message);
    } finally {
        // Restore button state
        analyzeBtn.textContent = originalText;
        analyzeBtn.disabled = false;
    }
}

// Display error when ML model is not available
function displayErrorResult(errorMessage) {
    const resultBox = document.getElementById('resultBox');
    
    resultBox.innerHTML = `
        <h3>⚠️ Service Unavailable</h3>
        <p>The AI health prediction service is currently unavailable.</p>
        <p><strong>Error:</strong> ${errorMessage}</p>
        <p>Please ensure the ML model server is running on port 8001.</p>
        <p class="disclaimer">To start the server: <code>cd mlmodel && python api.py</code></p>
    `;
    
    resultBox.style.display = 'block';
    resultBox.scrollIntoView({ behavior: 'smooth' });
}

// Display ML Model Results
function displayMLResults(data, age, gender) {
    const resultBox = document.getElementById('resultBox');
    const riskLevel = document.getElementById('riskLevel');
    const conditionsList = document.getElementById('conditionsList');
    const specialist = document.getElementById('specialist');

    // Update basic fields
    riskLevel.textContent = `${data["Risk Level"]} (Score: ${data["Severity Score"]})`;
    conditionsList.textContent = data["Predicted Disease"];
    
    // Get specialist recommendation based on predicted disease
    const specialistRecommendation = getSpecialistForDisease(data["Predicted Disease"]);
    specialist.textContent = specialistRecommendation;

    // Enhanced result display with ML model data
    resultBox.innerHTML = `
        <h3>🔬 AI Health Analysis Results</h3>
        
        <div class="result-section">
            <h4>Primary Prediction</h4>
            <p><strong>Predicted Disease:</strong> ${data["Predicted Disease"]}</p>
            <p><strong>Risk Level:</strong> ${data["Risk Level"]} (Severity Score: ${data["Severity Score"]})</p>
            <p><strong>Confidence:</strong> ${(data["Confidence"] * 100).toFixed(1)}%</p>
        </div>

        <div class="result-section">
            <h4>Description</h4>
            <p>${data["Description"]}</p>
        </div>

        <div class="result-section">
            <h4>Recommended Specialist</h4>
            <p><strong>${specialistRecommendation}</strong></p>
        </div>

        <div class="result-section">
            <h4>Precautions</h4>
            <ul>
                ${data["Precautions"].map(p => `<li>${p}</li>`).join("")}
            </ul>
        </div>

        <div class="result-section">
            <h4>Symptom Analysis</h4>
            <p><strong>Input Symptoms:</strong> ${data["Input Symptoms"].join(", ")}</p>
            <p><strong>Processed Symptoms:</strong> ${data["Corrected Symptoms"].join(", ")}</p>
        </div>

        <div class="result-section">
            <h4>Alternative Possibilities</h4>
            <ul>
                ${data["Top_3"].map(item => `<li>${item[0]} - ${(item[1] * 100).toFixed(1)}% probability</li>`).join("")}
            </ul>
        </div>

        <p class="disclaimer">⚠️ This is an AI-assisted assessment based on machine learning models and not a medical diagnosis. Please consult with a healthcare professional for proper medical advice.</p>
    `;

    resultBox.style.display = 'block';
    resultBox.scrollIntoView({ behavior: 'smooth' });
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
