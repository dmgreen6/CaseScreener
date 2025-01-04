// Configuration
const CONFIG = {
    CALENDLY_URL: 'https://calendly.com/dwayne-pflug?fbclid=PAZXh0bgNhZW0CMTEAAabQTz0Q4ezE4ZZJovqSB60RgHygn3eug3_YQMLAkrlH-HoRxeK4O-jw_Bw_aem_BS6GnPzFbvjnySraMRooKg',
    ATTORNEY_PHONE: '8437999125'
};

// Store contact information
let currentContact = {};
let currentScore = 0;

// Question sets
const QUESTIONS = {
    timing: {
        title: "When did the accident occur?",
        options: [
            { text: 'Today', score: 15 },
            { text: 'Yesterday', score: 13.5 },
            { text: 'Within the past week', score: 12 },
            { text: '1-2 weeks ago', score: 9 },
            { text: '2-4 weeks ago', score: 6 },
            { text: 'More than a month ago', score: 3 }
        ]
    },
    liability: {
        title: "How did the accident happen?",
        options: [
            { text: 'Rear-end collision', score: 35 },
            { text: 'Red light violation', score: 35 },
            { text: 'DUI driver', score: 35 },
            { text: 'Commercial vehicle', score: 31.5 },
            { text: 'Clear failure to yield', score: 28 },
            { text: 'Left turn collision', score: 21 },
            { text: 'Lane change accident', score: 17.5 },
            { text: 'Other type of accident', score: 10.5 }
        ]
    },
    injuries: {
        title: "What type of injuries occurred?",
        options: [
            { text: 'Emergency transport/Hospitalization', score: 35 },
            { text: 'Surgery required/scheduled', score: 35 },
            { text: 'Currently under medical care', score: 28 },
            { text: 'Minor injuries with treatment', score: 14 },
            { text: 'No treatment yet - accident just occurred', score: 21 }
        ]
    },
    insurance: {
        title: "What is the insurance status?",
        options: [
            { text: 'Confirmed coverage', score: 15 },
            { text: 'Recent accident - coverage likely', score: 12 },
            { text: 'Unknown coverage', score: 7.5 },
            { text: 'No coverage', score: 0 }
        ]
    }
};

let currentStep = 'contact';
let responses = {};

// Handle contact form submission
document.getElementById('contact-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Store contact information
    currentContact = {
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        phone: document.getElementById('phone').value,
        email: document.getElementById('email').value,
        address: document.getElementById('address').value,
        timestamp: new Date().toISOString()
    };
    
    // Hide contact form and show screening
    document.getElementById('contact-step').classList.remove('active');
    document.getElementById('screening-steps').classList.remove('hidden');
    showQuestion('timing');
});

function showQuestion(questionKey) {
    currentStep = questionKey;
    const question = QUESTIONS[questionKey];
    const container = document.getElementById('question-container');
    
    container.innerHTML = `
        <h3 class="text-lg font-medium mb-4">${question.title}</h3>
        <div class="space-y-3">
            ${question.options.map((option, index) => `
                <button 
                    onclick="handleAnswer('${questionKey}', ${index})"
                    class="w-full p-3 text-left border rounded hover:bg-gray-50"
                >
                    ${option.text}
                </button>
            `).join('')}
        </div>
    `;
    
    updateProgress();
}

function handleAnswer(questionKey, optionIndex) {
    responses[questionKey] = QUESTIONS[questionKey].options[optionIndex];
    currentScore += responses[questionKey].score;
    
    const questionOrder = ['timing', 'liability', 'injuries', 'insurance'];
    const currentIndex = questionOrder.indexOf(questionKey);
    
    if (currentIndex < questionOrder.length - 1) {
        showQuestion(questionOrder[currentIndex + 1]);
    } else {
        showResults();
    }
}

function showResults() {
    document.getElementById('screening-steps').classList.add('hidden');
    const resultsDiv = document.getElementById('results');
    resultsDiv.classList.remove('hidden');
    
    const recommendation = getRecommendation();
    
    resultsDiv.innerHTML = `
        <div class="${recommendation.color} border-l-4 border-l-${recommendation.priority === 'urgent' ? 'red' : 'green'}-600 p-4 rounded">
            <div class="space-y-2">
                <p class="font-bold">Case Score: ${currentScore}/100</p>
                <p class="font-bold">Category: ${recommendation.category}</p>
                <p>${recommendation.action}</p>
            </div>
        </div>
        ${getActionButton(recommendation)}
        <button onclick="resetScreening()" 
            class="w-full p-3 mt-4 text-gray-700 bg-gray-100 rounded hover:bg-gray-200">
            Start New Screening
        </button>
    `;
    
    // Save screening data
    saveScreeningData();
    updateStoredDataView();
}

function getRecommendation() {
    if (currentScore >= 95) {
        return {
            category: 'A+',
            action: 'IMMEDIATE ATTORNEY CONTACT REQUIRED',
            priority: 'urgent',
            color: 'bg-red-100',
            callToAction: 'directCall'
        };
    } else if (currentScore >= 80) {
        return {
            category: 'A',
            action: 'Schedule Immediate Consultation',
            priority: 'high',
            color: 'bg-green-100',
            callToAction: 'calendly'
        };
    } else if (currentScore >= 60) {
        return {
            category: 'B',
            action: 'FAST TRACK: Schedule consultation within 24-48 hours.',
            priority: 'medium',
            color: 'bg-yellow-100'
        };
    } else if (currentScore >= 20) {
        return {
            category: 'C',
            action: 'STANDARD TRACK: Consider referral or regular consultation.',
            priority: 'low',
            color: 'bg-gray-100'
        };
    } else {
        return {
            category: 'D',
            action: 'REFER OUT: Consider referring to another firm.',
            priority: 'very-low',
            color: 'bg-red-50'
        };
    }
}

function getActionButton(recommendation) {
    if (recommendation.callToAction === 'directCall') {
        return `
            <button onclick="window.location.href='tel:${CONFIG.ATTORNEY_PHONE}'"
                class="w-full p-4 mt-4 text-white bg-red-600 rounded-lg hover:bg-red-700">
                Call Attorney Immediately
            </button>
        `;
    } else if (recommendation.callToAction === 'calendly') {
        return `
            <button onclick="window.open('${CONFIG.CALENDLY_URL}', '_blank')"
                class="w-full p-4 mt-4 text-white bg-green-600 rounded-lg hover:bg-green-700">
                Schedule Consultation Now
            </button>
        `;
    }
    return '';
}

function saveScreeningData() {
    const screeningData = {
        contact: currentContact,
        responses: responses,
        score: currentScore,
        recommendation: getRecommendation()
    };
    
    let storedData = JSON.parse(localStorage.getItem('screenings') || '[]');
    storedData.push(screeningData);
    localStorage.setItem('screenings', JSON.stringify(storedData));
}

function updateStoredDataView() {
    const storedData = JSON.parse(localStorage.getItem('screenings') || '[]');
    const container = document.getElementById('stored-data');
    
    container.innerHTML = storedData.map((screening, index) => `
        <div class="border-b p-2">
            <p><strong>${screening.contact.firstName} ${screening.contact.lastName}</strong></p>
            <p>Score: ${screening.score}</p>
            <p>Category: ${screening.recommendation.category}</p>
        </div>
    `).join('');
}

function downloadStoredData() {
    const storedData = JSON.parse(localStorage.getItem('screenings') || '[]');
    
    // Create CSV content
    const csvContent = [
        ['Timestamp', 'First Name', 'Last Name', 'Phone', 'Email', 'Address', 'Score', 'Category'].join(','),
        ...storedData.map(screening => [
            screening.contact.timestamp,
            screening.contact.firstName,
            screening.contact.lastName,
            screening.contact.phone,
            screening.contact.email,
            `"${screening.contact.address.replace(/"/g, '""')}"`,
            screening.score,
            screening.recommendation.category
        ].join(','))
    ].join('\n');
    
    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'screening_data.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function updateProgress() {
    const questionOrder = ['timing', 'liability', 'injuries', 'insurance'];
    const currentIndex = questionOrder.indexOf(currentStep);
    const progress = ((currentIndex + 1) / questionOrder.length) * 100;
    console.log(`Progress: ${progress}%`);
}