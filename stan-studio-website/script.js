const canvas = document.getElementById('thought-canvas');
const ctx = canvas.getContext('2d');

let width, height;
let particles = [];
let mouse = { x: -1000, y: -1000 };

function init() {
    resize();
    createParticles();
    animate();

    // Smooth Reveal Initialization
    initScrollReveal();
}

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}

window.addEventListener('resize', () => {
    resize();
    createParticles();
});

window.addEventListener('mousemove', (e) => {
    // Smoother mouse tracking for canvas
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

class Particle {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        // Slower velocities for better performance and "floating" feel
        this.vx = (Math.random() - 0.5) * 0.25;
        this.vy = (Math.random() - 0.5) * 0.25;
        this.radius = Math.random() * 1.2;
        this.alpha = Math.random() * 0.4;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > width || this.y < 0 || this.y > height) {
            this.reset();
        }

        // Proximity check for interactivity
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 180) {
            this.vx += dx * 0.00005;
            this.vy += dy * 0.00005;
            this.alpha = Math.min(0.8, this.alpha + 0.05);
        } else {
            this.alpha = Math.max(0.1, this.alpha - 0.01);
        }
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(168, 85, 247, ${this.alpha})`;
        ctx.fill();
    }
}

function createParticles() {
    particles = [];
    const count = Math.min(Math.floor((width * height) / 12000), 200); // Capped for performance
    for (let i = 0; i < count; i++) {
        particles.push(new Particle());
    }
}

function animate() {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        p1.update();
        p1.draw();

        for (let j = i + 1; j < particles.length; j++) {
            const p2 = particles[j];
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 110) {
                const mouseDist = Math.sqrt(Math.pow(mouse.x - p1.x, 2) + Math.pow(mouse.y - p1.y, 2));
                let opacity = (1 - dist / 110) * 0.15;

                if (mouseDist < 150) {
                    opacity *= 3;
                    ctx.strokeStyle = `rgba(168, 85, 247, ${opacity})`;
                } else {
                    ctx.strokeStyle = `rgba(148, 163, 184, ${opacity * 0.5})`;
                }

                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            }
        }
    }

    requestAnimationFrame(animate);
}

// PLAYGROUND LOGIC
const projects = {
    character: {
        filename: 'main.py',
        lang: 'python',
        code: `# Responsive Character Project\nimport random\n\nclass Character:\n    def __init__(self, name):\n        self.name = name\n        self.mood = "Happy"\n\n    def react(self):\n        moods = ["Happy", "Focused", "Curious"]\n        self.mood = random.choice(moods)\n        return f"{self.name} is now feeling {self.mood}!"\n\nhero = Character("Stan")\nprint(hero.react())`
    },
    particle: {
        filename: 'engine.js',
        lang: 'javascript',
        code: `// Dynamic Particles\nconst count = 100;\nconsole.log(\`Initializing \${count} neural nodes...\`);\n\nfunction createSystem() {\n    return Array(count).fill(0).map(() => ({\n        x: Math.random() * 800,\n        y: Math.random() * 600\n    }));\n}\n\nconst system = createSystem();\nconsole.log("Cortex Sync Active.");\nconsole.log(\`First node position: \${JSON.stringify(system[0])}\`);`
    },
    fib: {
        filename: 'fib.py',
        lang: 'python',
        code: `# Fibonacci Visualizer\ndef fibonacci(n):\n    a, b = 0, 1\n    for _ in range(n):\n        yield a\n        a, b = b, a + b\n\nprint("Calculating Fibonacci sequence...")\nfor val in fibonacci(8):\n    print(f"-> {val}")`
    }
};

const editor = document.getElementById('code-editor');
const terminalOutput = document.getElementById('terminal-output');
const runBtn = document.getElementById('run-code');
const clearBtn = document.getElementById('clear-term');
const langSelect = document.getElementById('lang-select');
const filenameDisplay = document.getElementById('active-filename');
const lineNumbers = document.getElementById('line-numbers');

function updateLineNumbers() {
    const lines = editor.value.split('\n').length;
    let html = '';
    for (let i = 1; i <= lines; i++) {
        html += `<span>${i}</span>`;
    }
    lineNumbers.innerHTML = html;
}

editor.addEventListener('input', updateLineNumbers);

function appendToTerminal(text, type = 'output-line') {
    const span = document.createElement('span');
    span.className = type;
    span.innerHTML = text.replace(/\n/g, '<br>');
    terminalOutput.appendChild(span);
    terminalOutput.appendChild(document.createElement('br'));
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

runBtn.addEventListener('click', () => {
    const lang = langSelect.value;
    const file = filenameDisplay.textContent;

    // Add command simulation
    const prompt = document.createElement('span');
    prompt.className = 'prompt';
    prompt.textContent = '$ ';
    terminalOutput.appendChild(prompt);

    const cmd = document.createElement('span');
    cmd.textContent = `${lang} ${file}`;
    terminalOutput.appendChild(cmd);
    terminalOutput.appendChild(document.createElement('br'));

    // Simulated Execution Path
    setTimeout(() => {
        const code = editor.value;
        if (lang === 'python') {
            if (code.includes('print')) {
                // Mock simple print matching
                const matches = code.match(/print\(([^)]+)\)/g);
                if (matches) {
                    matches.forEach(m => {
                        let content = m.replace('print(', '').replace(')', '').replace(/['"]/g, '');
                        if (content.includes('hero.react()')) content = "Stan is now feeling Curious!"; // Mock specifically for character
                        if (content.includes('val')) { /* handled in loop simulation */ }
                        else { appendToTerminal(content, 'success'); }
                    });

                    if (code.includes('fibonacci')) {
                        appendToTerminal("Calculating Fibonacci sequence...", 'output-line');
                        [0, 1, 1, 2, 3, 5, 8, 13].forEach(v => appendToTerminal(`-> ${v}`, 'success'));
                    }
                }
            }
        } else if (lang === 'javascript') {
            if (code.includes('console.log')) {
                appendToTerminal("Initializing 100 neural nodes...", 'output-line');
                appendToTerminal("Cortex Sync Active.", 'success');
                appendToTerminal("First node position: {\"x\":412,\"y\":287}", 'output-line');
            }
        }
    }, 400);
});

clearBtn.addEventListener('click', () => {
    terminalOutput.innerHTML = '<span class="prompt">$ </span>';
});

document.querySelectorAll('.tutorial-item').forEach(item => {
    item.addEventListener('click', () => {
        const projectKey = item.getAttribute('data-project');
        const project = projects[projectKey];

        // Update UI
        document.querySelectorAll('.tutorial-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');

        editor.value = project.code;
        langSelect.value = project.lang;
        filenameDisplay.textContent = project.filename;
        updateLineNumbers();

        // Clear terminal
        terminalOutput.innerHTML = `<span class="prompt">$ </span>${project.lang} ${project.filename}`;
    });
});

// PREMIUM SCROLL REVEAL LOGIC
function initScrollReveal() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Optional: Unobserve if you want animation only once
                // observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const revealElements = document.querySelectorAll(
        '.reveal-fade, .reveal-top, .reveal-slide-up, .feature-item, .ext-card, .lang-tag'
    );

    revealElements.forEach(el => observer.observe(el));
}

// Parallax effect for Editor Preview
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const editor = document.querySelector('.hero-preview');
    if (editor) {
        editor.style.transform = `translateY(${scrolled * 0.05}px)`;
    }
});

// Remove loading class after mount
window.addEventListener('load', () => {
    document.body.classList.remove('loading');
    updateLineNumbers();
    init();
});
