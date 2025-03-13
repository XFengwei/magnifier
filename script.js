const imageContainer = document.querySelector('.image-container');
const largeImage = document.querySelector('.large-image');
const magnifier = document.getElementById('magnifier');
const toggleButton = document.getElementById('toggle-button');
const figureLabel = document.getElementById('figure-label');
const targetSelector = document.getElementById('target-selector');

// Images organized by targets
const targets = {
    'SgrC': {
        plain: "SgrC_plain.png",
        sources: "SgrC_sourc.png"
    },
    'cloude': {
        plain: "cloude_plain.png",
        sources: "cloude_sourc.png"
    },
    'The20kmsCloud': {
        plain: "The20kmsCloud_plain.png",
        sources: "The20kmsCloud_sourc.png"
    }
};

let currentTarget = 'SgrC';
let currentType = 'plain';

// Updates image source, magnifier background, and label based on current state
function updateImage() {
    const imgSrc = targets[currentTarget][currentType];
    largeImage.src = imgSrc;
    magnifier.style.backgroundImage = `url(${imgSrc})`;
    figureLabel.textContent = currentType === 'plain' ? "Plain colormap" : "Sources marked";
    toggleButton.textContent = currentType === 'plain' ? "Show sources" : "Plain colormap";
}

// Event listener for changing targets
targetSelector.addEventListener('change', (e) => {
    currentTarget = e.target.value;
    currentType = 'plain'; // reset to plain type when switching targets
    updateImage();
});

// Event listener for toggling plain/source images
toggleButton.addEventListener('click', () => {
    currentType = currentType === 'plain' ? 'sources' : 'plain';
    updateImage();
});

// Magnifier logic (unchanged and working correctly)
imageContainer.addEventListener('mousemove', (e) => {
    const rect = imageContainer.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    magnifier.style.display = 'block';
    magnifier.style.left = `${x}px`;
    magnifier.style.top = `${y}px`;

    const backgroundX = (x / rect.width) * 100;
    const backgroundY = (y / rect.height) * 100;

    magnifier.style.backgroundPosition = `${backgroundX}% ${backgroundY}%`;
});

imageContainer.addEventListener('mouseleave', () => {
    magnifier.style.display = 'none';
});

// Initialize default state
updateImage();
