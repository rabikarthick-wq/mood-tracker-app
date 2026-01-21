document.addEventListener('DOMContentLoaded', () => {
    const moodBtns = document.querySelectorAll('.mood-btn');
    const noteArea = document.getElementById('mood-note');
    const saveBtn = document.getElementById('save-mood');
    const entriesList = document.getElementById('entries-list');
    const chartContainer = document.getElementById('mood-chart');
    const canvas = document.getElementById('confetti-canvas');
    const ctx = canvas.getContext('2d');

    let selectedMood = null;
    let entries = JSON.parse(localStorage.getItem('moodEntries') || '[]');

    // Mood data
    const moodData = {
        excited: { emoji: '🎉', color: '#ff7675' },
        happy: { emoji: '😊', color: '#fdcb6e' },
        neutral: { emoji: '😐', color: '#74b9ff' },
        tired: { emoji: '😴', color: '#a29bfe' },
        sad: { emoji: '😢', color: '#fab1a0' }
    };

    // Initialize
    renderEntries();
    renderChart();
    resizeCanvas();

    window.addEventListener('resize', resizeCanvas);

    // Mood selection
    moodBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            moodBtns.forEach(b => {
                b.classList.remove('selected');
                b.setAttribute('aria-checked', 'false');
            });
            btn.classList.add('selected');
            btn.setAttribute('aria-checked', 'true');
            selectedMood = btn.dataset.mood;
        });

        // Keyboard navigation
        btn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                btn.click();
            }
        });
    });

    // Save entry
    saveBtn.addEventListener('click', () => {
        if (!selectedMood) {
            alert('Please select a mood first!');
            return;
        }

        const entry = {
            id: Date.now(),
            mood: selectedMood,
            note: noteArea.value.trim(),
            timestamp: new Date().toISOString()
        };

        entries.unshift(entry);
        localStorage.setItem('moodEntries', JSON.stringify(entries));

        // Reset UI
        selectedMood = null;
        moodBtns.forEach(b => {
            b.classList.remove('selected');
            b.setAttribute('aria-checked', 'false');
        });
        noteArea.value = '';

        renderEntries();
        renderChart();
        checkStreak();
        
        // Scroll to top of list
        entriesList.scrollTop = 0;
    });

    function renderEntries() {
        entriesList.innerHTML = '';
        
        if (entries.length === 0) {
            entriesList.innerHTML = '<p style="text-align: center; color: #636e72;">No entries yet. Start tracking!</p>';
            return;
        }

        entries.forEach(entry => {
            const date = new Date(entry.timestamp);
            const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            const entryDiv = document.createElement('div');
            entryDiv.className = 'entry-card';
            entryDiv.innerHTML = `
                <div class="entry-emoji" aria-hidden="true">${moodData[entry.mood].emoji}</div>
                <div class="entry-content">
                    <div class="entry-header">
                        <span class="entry-mood-name">${capitalize(entry.mood)}</span>
                        <span class="entry-date">${formattedDate}</span>
                    </div>
                    ${entry.note ? `<p class="entry-note">${escapeHtml(entry.note)}</p>` : ''}
                </div>
            `;
            entriesList.appendChild(entryDiv);
        });
    }

    function renderChart() {
        chartContainer.innerHTML = '';
        
        // Calculate counts for the last 7 days
        const last7DaysEntries = entries.filter(entry => {
            const entryDate = new Date(entry.timestamp);
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            return entryDate >= sevenDaysAgo;
        });

        const counts = {
            excited: 0,
            happy: 0,
            neutral: 0,
            tired: 0,
            sad: 0
        };

        last7DaysEntries.forEach(entry => {
            if (counts.hasOwnProperty(entry.mood)) {
                counts[entry.mood]++;
            }
        });

        const maxCount = Math.max(...Object.values(counts), 1);

        Object.keys(moodData).forEach(mood => {
            const count = counts[mood];
            const heightPercentage = (count / maxCount) * 100;

            const barWrapper = document.createElement('div');
            barWrapper.className = 'chart-bar-wrapper';
            
            barWrapper.innerHTML = `
                <div class="chart-bar" 
                     style="height: ${heightPercentage}%; background-color: ${moodData[mood].color}" 
                     data-value="${count}"
                     title="${capitalize(mood)}: ${count} entries">
                </div>
                <div class="chart-label" aria-hidden="true">${moodData[mood].emoji}</div>
            `;
            chartContainer.appendChild(barWrapper);
        });
    }

    function checkStreak() {
        if (entries.length < 3) return;

        const last3 = entries.slice(0, 3);
        const isGreatStreak = last3.every(e => e.mood === 'happy' || e.mood === 'excited');

        if (isGreatStreak) {
            startConfetti();
        }
    }

    function capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // Simple Vanilla JS Confetti
    let particles = [];
    let animationId = null;

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function startConfetti() {
        particles = [];
        for (let i = 0; i < 150; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height - canvas.height,
                size: Math.random() * 10 + 5,
                color: `hsl(${Math.random() * 360}, 70%, 60%)`,
                speed: Math.random() * 3 + 2,
                angle: Math.random() * 6.28,
                spin: Math.random() * 0.2 - 0.1
            });
        }

        if (animationId) cancelAnimationFrame(animationId);
        animateConfetti();
        
        // Stop after 4 seconds
        setTimeout(() => {
            cancelAnimationFrame(animationId);
            animationId = null;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }, 4000);
    }

    function animateConfetti() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach(p => {
            p.y += p.speed;
            p.x += Math.sin(p.angle) * 2;
            p.angle += p.spin;

            ctx.fillStyle = p.color;
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.angle);
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            ctx.restore();
        });

        animationId = requestAnimationFrame(animateConfetti);
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});
