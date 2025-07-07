// index.js
(function() {
    // --- Clean up any previous instances to ensure a fresh start ---
    const cleanupIds = [
        'accessibility-toggle-button',
        'accessibility-tool-panel',
        'accessibility-tool-styles',
        'accessibility-dynamic-styles' // For dynamic adjustments like font size
    ];
    cleanupIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.remove();
    });
    removeHighlights(); // Ensure highlights are cleared

    // --- Global State Management for Accessibility Settings ---
    const accessibilityState = {
        isInverted: false,
        isGrayscale: false,
        isHighContrast: false,
        isImageHidden: false,
        isReadableFont: false,
        isLinkUnderlined: false,
        isLinkBold: false,
        customLinkColor: '', // Stores hex code
        isFocusHighlightActive: false,
        currentTextSize: 100, // Percentage
        currentLineHeight: 100, // Percentage
        currentLetterSpacing: 0, // Pixels
        highlightsActive: false // To track if diagnostic highlights are on
    };

    // --- CSS for the Floating Button, GUI Panel, and Effects ---
    const style = document.createElement('style');
    style.id = 'accessibility-tool-styles';
    style.innerHTML = `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');

        /* Main Floating Button */
        #accessibility-toggle-button {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background-color: #3498db; /* Blue */
            color: white;
            border: none;
            border-radius: 50%; /* Make it round */
            width: 60px;
            height: 60px;
            font-size: 24px; /* Icon size */
            font-weight: 700;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            z-index: 100000;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background-color 0.3s ease, transform 0.2s ease;
            font-family: 'Inter', sans-serif;
            line-height: 1; /* Ensure icon is centered */
        }

        #accessibility-toggle-button:hover {
            background-color: #2980b9;
            transform: scale(1.05);
        }

        #accessibility-toggle-button:active {
            transform: scale(0.98);
        }

        /* Accessibility Tool Panel (GUI Menu) */
        #accessibility-tool-panel {
            position: fixed;
            bottom: 90px; /* Above the button */
            right: 20px;
            width: 320px;
            max-height: 85vh; /* Max height for scrollable content */
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
            z-index: 99999;
            display: none; /* Hidden by default */
            flex-direction: column;
            overflow: hidden; /* Hide overflow for rounded corners */
            font-family: 'Inter', sans-serif;
            color: #333;
            transform-origin: bottom right;
            transform: scale(0.8); /* Start smaller for animation */
            opacity: 0;
            transition: transform 0.2s ease-out, opacity 0.2s ease-out;
        }

        #accessibility-tool-panel.is-open {
            display: flex;
            transform: scale(1);
            opacity: 1;
        }

        #accessibility-tool-panel-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 15px;
            background-color: #f0f0f0;
            border-bottom: 1px solid #eee;
            border-top-left-radius: 12px;
            border-top-right-radius: 12px;
            cursor: grab; /* Indicate draggable */
        }

        #accessibility-tool-panel-header h3 {
            margin: 0;
            font-size: 18px;
            font-weight: 600;
            color: #555;
        }

        #accessibility-tool-panel-close {
            background: none;
            border: none;
            font-size: 24px;
            color: #777;
            cursor: pointer;
            padding: 0 5px;
            line-height: 1;
            border-radius: 4px;
            transition: background-color 0.2s ease;
        }
        #accessibility-tool-panel-close:hover {
            background-color: #e0e0e0;
        }

        #accessibility-tool-panel-content {
            padding: 15px;
            flex-grow: 1;
            overflow-y: auto; /* Enable scrolling for content */
        }

        .accessibility-section {
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 1px solid #eee;
        }
        .accessibility-section:last-child {
            border-bottom: none;
            margin-bottom: 0;
            padding-bottom: 0;
        }

        .accessibility-section h4 {
            margin-top: 0;
            margin-bottom: 10px;
            font-size: 16px;
            color: #444;
            font-weight: 600;
            border-bottom: 1px dashed #eee;
            padding-bottom: 5px;
        }

        .accessibility-option {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
            font-size: 14px;
        }
        .accessibility-option label {
            flex-grow: 1;
            margin-right: 10px;
            cursor: pointer;
        }
        .accessibility-option input[type="checkbox"] {
            transform: scale(1.2);
            cursor: pointer;
        }
        .accessibility-option input[type="range"],
        .accessibility-option input[type="text"] {
            width: 80px;
            margin-left: 10px;
            padding: 5px;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        .accessibility-option input[type="text"] {
            width: 100px;
        }

        .accessibility-option .slider-value {
            min-width: 30px;
            text-align: right;
            font-weight: 600;
            color: #666;
        }

        .accessibility-button {
            width: 100%;
            padding: 10px 15px;
            background-color: #2ecc71; /* Green for action */
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            transition: background-color 0.2s ease, transform 0.1s ease;
            margin-bottom: 10px;
        }
        .accessibility-button.secondary {
            background-color: #e74c3c; /* Red for clear */
        }

        .accessibility-button:hover {
            background-color: #27ae60;
            transform: translateY(-1px);
        }
        .accessibility-button.secondary:hover {
            background-color: #c0392b;
        }

        .accessibility-button:active {
            transform: translateY(0);
        }

        #accessibility-results {
            margin-top: 15px;
            padding: 10px;
            background-color: #f9f9f9;
            border: 1px solid #eee;
            border-radius: 8px;
            font-size: 14px;
            color: #555;
            max-height: 200px;
            overflow-y: auto;
        }
        #accessibility-results p {
            margin: 5px 0;
        }

        /* Highlight Styles */
        .accessibility-highlight-alt {
            outline: 3px solid red !important;
            box-shadow: 0 0 10px rgba(255, 0, 0, 0.5) !important;
        }

        .accessibility-highlight-link {
            outline: 3px solid orange !important;
            box-shadow: 0 0 10px rgba(255, 165, 0, 0.5) !important;
        }

        /* Accessibility Effects (applied via dynamic style tag) */
        .accessibility-inverted {
            filter: invert(100%) hue-rotate(180deg) !important;
        }
        .accessibility-grayscale {
            filter: grayscale(100%) !important;
        }
        .accessibility-high-contrast {
            background-color: #000 !important;
            color: #fff !important;
            filter: none !important; /* Remove other filters */
        }
        .accessibility-high-contrast a {
            color: #ffff00 !important; /* Yellow links */
        }
        .accessibility-high-contrast button, .accessibility-high-contrast input, .accessibility-high-contrast select {
            background-color: #333 !important;
            color: #fff !important;
            border-color: #fff !important;
        }
        .accessibility-image-hidden {
            display: none !important;
            visibility: hidden !important;
        }
        .accessibility-readable-font * {
            font-family: 'Arial', 'Helvetica', sans-serif !important; /* Or 'OpenDyslexic', if loaded */
        }
        .accessibility-focus-highlight *:focus {
            outline: 3px solid #00f !important; /* Blue outline for focus */
            box-shadow: 0 0 0 2px #00f !important;
        }

        /* Responsive adjustments for smaller screens */
        @media (max-width: 600px) {
            #accessibility-toggle-button {
                width: 50px;
                height: 50px;
                font-size: 20px;
                bottom: 15px;
                right: 15px;
            }
            #accessibility-tool-panel {
                width: calc(100% - 40px); /* Full width minus margin */
                right: 20px;
                left: 20px; /* Center it */
                bottom: 80px;
                max-height: 70vh;
            }
        }
    `;
    document.head.appendChild(style);

    // Dynamic style tag for properties that need to target a broader scope (like font size)
    const dynamicStyle = document.createElement('style');
    dynamicStyle.id = 'accessibility-dynamic-styles';
    document.head.appendChild(dynamicStyle);

    // Function to apply dynamic styles
    function applyDynamicStyles() {
        dynamicStyle.innerHTML = `
            body, html {
                font-size: ${accessibilityState.currentTextSize}% !important;
                line-height: ${accessibilityState.currentLineHeight / 100 * 1.5} !important; /* Base line height 1.5, adjusted by slider */
                letter-spacing: ${accessibilityState.currentLetterSpacing}px !important;
            }
            a {
                ${accessibilityState.isLinkUnderlined ? 'text-decoration: underline !important;' : 'text-decoration: none !important;'}
                ${accessibilityState.isLinkBold ? 'font-weight: bold !important;' : 'font-weight: normal !important;'}
                ${accessibilityState.customLinkColor ? `color: ${accessibilityState.customLinkColor} !important;` : ''}
            }
        `;
    }
    applyDynamicStyles(); // Apply initial dynamic styles

    // --- Core Accessibility Functions ---

    function removeHighlights() {
        document.querySelectorAll('.accessibility-highlight-alt, .accessibility-highlight-link').forEach(el => {
            el.style.outline = '';
            el.style.boxShadow = '';
            el.classList.remove('accessibility-highlight-alt', 'accessibility-highlight-link');
            if (el.dataset.originalAlt !== undefined) {
                el.alt = el.dataset.originalAlt;
                delete el.dataset.originalAlt;
            }
        });
        accessibilityState.highlightsActive = false;
        console.log("Accessibility highlights cleared.");
    }

    function runDiagnosticChecks() {
        removeHighlights(); // Ensure a clean slate before running new checks

        let issues = {
            missingAlt: [],
            emptyLinks: []
        };

        document.querySelectorAll('img').forEach(img => {
            if (!img.hasAttribute('alt') || img.getAttribute('alt').trim() === '') {
                img.classList.add('accessibility-highlight-alt');
                img.dataset.originalAlt = img.getAttribute('alt') || '';
                img.alt = '[MISSING ALT]';
                issues.missingAlt.push(img);
            }
        });

        document.querySelectorAll('a').forEach(link => {
            const textContent = link.innerText.trim();
            const hasImageWithAlt = link.querySelector('img[alt]:not([alt=""])');
            const hasAriaLabel = link.hasAttribute('aria-label') && link.getAttribute('aria-label').trim() !== '';

            if (textContent === '' && !hasImageWithAlt && !hasAriaLabel) {
                link.classList.add('accessibility-highlight-link');
                issues.emptyLinks.push(link);
            }
        });

        accessibilityState.highlightsActive = true;
        return issues;
    }

    // --- Toggle Functions for Visual Modes ---
    function toggleBodyClass(className, stateKey) {
        if (accessibilityState[stateKey]) {
            document.body.classList.add(className);
        } else {
            document.body.classList.remove(className);
        }
    }

    function toggleInvertColors() {
        accessibilityState.isInverted = !accessibilityState.isInverted;
        toggleBodyClass('accessibility-inverted', 'isInverted');
        // Ensure other filters are off if this is on
        if (accessibilityState.isInverted) {
            accessibilityState.isGrayscale = false;
            accessibilityState.isHighContrast = false;
            toggleBodyClass('accessibility-grayscale', 'isGrayscale');
            toggleBodyClass('accessibility-high-contrast', 'isHighContrast');
            updateToggleState('grayscale-toggle', accessibilityState.isGrayscale);
            updateToggleState('high-contrast-toggle', accessibilityState.isHighContrast);
        }
    }

    function toggleGrayscale() {
        accessibilityState.isGrayscale = !accessibilityState.isGrayscale;
        toggleBodyClass('accessibility-grayscale', 'isGrayscale');
        // Ensure other filters are off if this is on
        if (accessibilityState.isGrayscale) {
            accessibilityState.isInverted = false;
            accessibilityState.isHighContrast = false;
            toggleBodyClass('accessibility-inverted', 'isInverted');
            toggleBodyClass('accessibility-high-contrast', 'isHighContrast');
            updateToggleState('invert-colors-toggle', accessibilityState.isInverted);
            updateToggleState('high-contrast-toggle', accessibilityState.isHighContrast);
        }
    }

    function toggleHighContrast() {
        accessibilityState.isHighContrast = !accessibilityState.isHighContrast;
        toggleBodyClass('accessibility-high-contrast', 'isHighContrast');
        // Ensure other filters are off if this is on
        if (accessibilityState.isHighContrast) {
            accessibilityState.isInverted = false;
            accessibilityState.isGrayscale = false;
            toggleBodyClass('accessibility-inverted', 'isInverted');
            toggleBodyClass('accessibility-grayscale', 'isGrayscale');
            updateToggleState('invert-colors-toggle', accessibilityState.isInverted);
            updateToggleState('grayscale-toggle', accessibilityState.isGrayscale);
        }
    }

    function toggleImageHider() {
        accessibilityState.isImageHidden = !accessibilityState.isImageHidden;
        toggleBodyClass('accessibility-image-hidden', 'isImageHidden');
    }

    function toggleReadableFont() {
        accessibilityState.isReadableFont = !accessibilityState.isReadableFont;
        toggleBodyClass('accessibility-readable-font', 'isReadableFont');
    }

    function toggleLinkUnderline() {
        accessibilityState.isLinkUnderlined = !accessibilityState.isLinkUnderlined;
        applyDynamicStyles();
    }

    function toggleLinkBold() {
        accessibilityState.isLinkBold = !accessibilityState.isLinkBold;
        applyDynamicStyles();
    }

    function setCustomLinkColor(color) {
        accessibilityState.customLinkColor = color;
        applyDynamicStyles();
    }

    function toggleFocusHighlight() {
        accessibilityState.isFocusHighlightActive = !accessibilityState.isFocusHighlightActive;
        toggleBodyClass('accessibility-focus-highlight', 'isFocusHighlightActive');
    }


    // --- GUI Panel Creation and Logic ---

    // Floating Button
    const toggleButton = document.createElement('button');
    toggleButton.id = 'accessibility-toggle-button';
    toggleButton.innerHTML = '&#9881;'; // Gear icon
    document.body.appendChild(toggleButton);

    // GUI Panel
    const panel = document.createElement('div');
    panel.id = 'accessibility-tool-panel';
    panel.innerHTML = `
        <div id="accessibility-tool-panel-header">
            <h3>Accessibility Tools</h3>
            <button id="accessibility-tool-panel-close">&times;</button>
        </div>
        <div id="accessibility-tool-panel-content">
            <div class="accessibility-section">
                <h4>Visual Modes</h4>
                <div class="accessibility-option">
                    <label for="invert-colors-toggle">Invert Colors</label>
                    <input type="checkbox" id="invert-colors-toggle">
                </div>
                <div class="accessibility-option">
                    <label for="grayscale-toggle">Grayscale</label>
                    <input type="checkbox" id="grayscale-toggle">
                </div>
                <div class="accessibility-option">
                    <label for="high-contrast-toggle">High Contrast</label>
                    <input type="checkbox" id="high-contrast-toggle">
                </div>
                <div class="accessibility-option">
                    <label for="image-hider-toggle">Hide Images</label>
                    <input type="checkbox" id="image-hider-toggle">
                </div>
            </div>

            <div class="accessibility-section">
                <h4>Text Adjustments</h4>
                <div class="accessibility-option">
                    <label for="text-size-slider">Text Size</label>
                    <input type="range" id="text-size-slider" min="50" max="200" value="${accessibilityState.currentTextSize}">
                    <span class="slider-value" id="text-size-value">${accessibilityState.currentTextSize}%</span>
                </div>
                <div class="accessibility-option">
                    <label for="line-height-slider">Line Height</label>
                    <input type="range" id="line-height-slider" min="50" max="200" value="${accessibilityState.currentLineHeight}">
                    <span class="slider-value" id="line-height-value">${accessibilityState.currentLineHeight}%</span>
                </div>
                <div class="accessibility-option">
                    <label for="letter-spacing-slider">Letter Spacing</label>
                    <input type="range" id="letter-spacing-slider" min="0" max="5" step="0.1" value="${accessibilityState.currentLetterSpacing}">
                    <span class="slider-value" id="letter-spacing-value">${accessibilityState.currentLetterSpacing}px</span>
                </div>
                <div class="accessibility-option">
                    <label for="readable-font-toggle">Readable Font</label>
                    <input type="checkbox" id="readable-font-toggle">
                </div>
            </div>

            <div class="accessibility-section">
                <h4>Link Styling</h4>
                <div class="accessibility-option">
                    <label for="link-underline-toggle">Underline Links</label>
                    <input type="checkbox" id="link-underline-toggle">
                </div>
                <div class="accessibility-option">
                    <label for="link-bold-toggle">Bold Links</label>
                    <input type="checkbox" id="link-bold-toggle">
                </div>
                <div class="accessibility-option">
                    <label for="link-color-input">Custom Link Color</label>
                    <input type="text" id="link-color-input" placeholder="#HEX or name" value="${accessibilityState.customLinkColor}">
                </div>
            </div>

            <div class="accessibility-section">
                <h4>Interaction & Focus</h4>
                <div class="accessibility-option">
                    <label for="focus-highlight-toggle">Highlight Focus</label>
                    <input type="checkbox" id="focus-highlight-toggle">
                </div>
            </div>

            <div class="accessibility-section">
                <h4>Diagnostic Checks</h4>
                <button class="accessibility-button" id="run-diagnostic-checks-button">Run Checks</button>
                <button class="accessibility-button secondary" id="clear-highlights-button">Clear Highlights</button>
                <div id="accessibility-results">
                    <p>Click "Run Checks" to scan for issues.</p>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(panel);

    // --- Get GUI Elements ---
    const closeButton = document.getElementById('accessibility-tool-panel-close');
    const panelHeader = document.getElementById('accessibility-tool-panel-header');
    const resultsDiv = document.getElementById('accessibility-results');

    // Visual Modes Toggles
    const invertColorsToggle = document.getElementById('invert-colors-toggle');
    const grayscaleToggle = document.getElementById('grayscale-toggle');
    const highContrastToggle = document.getElementById('high-contrast-toggle');
    const imageHiderToggle = document.getElementById('image-hider-toggle');

    // Text Adjustments
    const textSizeSlider = document.getElementById('text-size-slider');
    const textSizeValue = document.getElementById('text-size-value');
    const lineHeightSlider = document.getElementById('line-height-slider');
    const lineHeightValue = document.getElementById('line-height-value');
    const letterSpacingSlider = document.getElementById('letter-spacing-slider');
    const letterSpacingValue = document.getElementById('letter-spacing-value');
    const readableFontToggle = document.getElementById('readable-font-toggle');

    // Link Styling
    const linkUnderlineToggle = document.getElementById('link-underline-toggle');
    const linkBoldToggle = document.getElementById('link-bold-toggle');
    const linkColorInput = document.getElementById('link-color-input');

    // Interaction & Focus
    const focusHighlightToggle = document.getElementById('focus-highlight-toggle');

    // Diagnostic Checks Buttons
    const runDiagnosticChecksButton = document.getElementById('run-diagnostic-checks-button');
    const clearHighlightsButton = document.getElementById('clear-highlights-button');

    // --- Helper to update toggle UI based on state ---
    function updateToggleState(id, state) {
        const toggleEl = document.getElementById(id);
        if (toggleEl) {
            toggleEl.checked = state;
        }
    }

    // --- Event Listeners ---

    // Toggle Panel Visibility
    toggleButton.addEventListener('click', () => {
        panel.classList.toggle('is-open');
        if (!panel.classList.contains('is-open')) {
            // Clear highlights and reset results when closing the panel
            removeHighlights();
            resultsDiv.innerHTML = '<p>Click "Run Checks" to scan for issues.</p>';
        }
    });

    closeButton.addEventListener('click', () => {
        panel.classList.remove('is-open');
        removeHighlights(); // Clear highlights when closing
        resultsDiv.innerHTML = '<p>Click "Run Checks" to scan for issues.</p>';
    });

    // Visual Modes
    invertColorsToggle.addEventListener('change', () => {
        toggleInvertColors();
        updateToggleState('invert-colors-toggle', accessibilityState.isInverted);
    });
    grayscaleToggle.addEventListener('change', () => {
        toggleGrayscale();
        updateToggleState('grayscale-toggle', accessibilityState.isGrayscale);
    });
    highContrastToggle.addEventListener('change', () => {
        toggleHighContrast();
        updateToggleState('high-contrast-toggle', accessibilityState.isHighContrast);
    });
    imageHiderToggle.addEventListener('change', () => {
        toggleImageHider();
    });

    // Text Adjustments
    textSizeSlider.addEventListener('input', (e) => {
        accessibilityState.currentTextSize = parseInt(e.target.value);
        textSizeValue.textContent = `${accessibilityState.currentTextSize}%`;
        applyDynamicStyles();
    });
    lineHeightSlider.addEventListener('input', (e) => {
        accessibilityState.currentLineHeight = parseInt(e.target.value);
        lineHeightValue.textContent = `${accessibilityState.currentLineHeight}%`;
        applyDynamicStyles();
    });
    letterSpacingSlider.addEventListener('input', (e) => {
        accessibilityState.currentLetterSpacing = parseFloat(e.target.value);
        letterSpacingValue.textContent = `${accessibilityState.currentLetterSpacing}px`;
        applyDynamicStyles();
    });
    readableFontToggle.addEventListener('change', () => {
        toggleReadableFont();
    });

    // Link Styling
    linkUnderlineToggle.addEventListener('change', () => {
        toggleLinkUnderline();
    });
    linkBoldToggle.addEventListener('change', () => {
        toggleLinkBold();
    });
    linkColorInput.addEventListener('input', (e) => {
        setCustomLinkColor(e.target.value);
    });

    // Interaction & Focus
    focusHighlightToggle.addEventListener('change', () => {
        toggleFocusHighlight();
    });

    // Diagnostic Checks Buttons Logic
    runDiagnosticChecksButton.addEventListener('click', () => {
        const results = runDiagnosticChecks();
        let summary = '';
        let totalIssues = results.missingAlt.length + results.emptyLinks.length;

        if (totalIssues === 0) {
            summary = '<p style="color: green; font-weight: bold;">No common accessibility issues found!</p>';
        } else {
            summary = `<p style="color: #f39c12; font-weight: bold;">Found ${totalIssues} issues:</p>`;
            if (results.missingAlt.length > 0) {
                summary += `<p><strong>Missing ALT text on ${results.missingAlt.length} image(s) (red outline).</strong></p>`;
            }
            if (results.emptyLinks.length > 0) {
                summary += `<p><strong>Empty or inaccessible links: ${results.emptyLinks.length} (orange outline).</strong></p>`;
            }
            summary += '<p>Highlighted elements on the page.</p>';
        }
        resultsDiv.innerHTML = summary;
    });

    clearHighlightsButton.addEventListener('click', () => {
        removeHighlights();
        resultsDiv.innerHTML = '<p>Highlights cleared. Click "Run Checks" to scan again.</p>';
    });

    // --- Make Panel Draggable ---
    let isDragging = false;
    let offsetX, offsetY;

    panelHeader.addEventListener('mousedown', (e) => {
        isDragging = true;
        offsetX = e.clientX - panel.getBoundingClientRect().left;
        offsetY = e.clientY - panel.getBoundingClientRect().top;
        panel.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        panel.style.left = (e.clientX - offsetX) + 'px';
        panel.style.top = (e.clientY - offsetY) + 'px';
        panel.style.right = 'auto'; // Disable right/bottom positioning when dragging
        panel.style.bottom = 'auto';
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        panel.style.cursor = 'grab';
    });

    // --- Mobile Touch Events for Dragging ---
    panelHeader.addEventListener('touchstart', (e) => {
        isDragging = true;
        const touch = e.touches[0];
        offsetX = touch.clientX - panel.getBoundingClientRect().left;
        offsetY = touch.clientY - panel.getBoundingClientRect().top;
        panel.style.cursor = 'grabbing';
        e.preventDefault(); // Prevent scrolling while dragging
    }, { passive: false });

    document.addEventListener('touchmove', (e) => {
        if (!isDragging || e.touches.length === 0) return;
        const touch = e.touches[0];
        panel.style.left = (touch.clientX - offsetX) + 'px';
        panel.style.top = (touch.clientY - offsetY) + 'px';
        panel.style.right = 'auto';
        panel.style.bottom = 'auto';
        e.preventDefault(); // Prevent scrolling while dragging
    }, { passive: false });

    document.addEventListener('touchend', () => {
        isDragging = false;
        panel.style.cursor = 'grab';
    });

    console.log("Ultimate Accessibility tool GUI initialized. Click the gear button to open the menu.");

})();
