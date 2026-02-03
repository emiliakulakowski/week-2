let inputLocationX = window.innerWidth / 2;
let inputLocationY = window.innerHeight / 2;
let inputBoxDirectionX = 1;
let inputBoxDirectionY = 1;

let canvas;
let inputBox;
let drawnImages = []; // Store images to redraw each frame
let generating = false;
let generatingPos = { x: 0, y: 0 };


init();

function init() {

    // Perform initialization logic here
    initInterface();
    animate();
}

// Animate loop
function animate() {
    // Clear canvas each frame
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Redraw all stored images with looping fade in/out (4s total: 2s in, 2s out)
    const now = performance.now();
    drawnImages.forEach(item => {
        if (item.img && item.img.complete) {
            // compute elapsed ms since item.start
            const elapsed = (now - (item.start || 0)) % 4000;
            let alpha;
            if (elapsed < 2000) {
                alpha = elapsed / 2000; // fade in 0->1 over 2s
            } else {
                alpha = 1 - ((elapsed - 2000) / 2000); // fade out 1->0 over next 2s
            }
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.drawImage(item.img, item.x - item.size / 2, item.y - item.size / 2, item.size, item.size);
            ctx.restore();
        }
    });

    // Draw generating text centered above the input box while generating
    if (generating && inputBox) {
        ctx.save();
        ctx.globalAlpha = 1.0;
        ctx.font = '18px Arial';
        ctx.fillStyle = 'black';
        const rect = inputBox.getBoundingClientRect();
        const text = 'Generating image...';
        const textWidth = ctx.measureText(text).width;
        const tx = rect.left + rect.width / 2 - textWidth / 2;
        const ty = rect.top - 8; // 8px above the input box
        ctx.fillText(text, tx, ty);
        ctx.restore();
    }
    
    // Perform animation logic here
    inputLocationX = inputLocationX + inputBoxDirectionX;
    inputLocationY = inputLocationY + inputBoxDirectionY;
    if (inputLocationX > window.innerWidth || inputLocationX < 0) {
        inputBoxDirectionX = - inputBoxDirectionX;
    }
    if (inputLocationY > window.innerHeight || inputLocationY < 0) {
        inputBoxDirectionY = - inputBoxDirectionY;
    }

    inputBox.style.left = inputLocationX + 'px';
    inputBox.style.top = inputLocationY + 'px';
    requestAnimationFrame(animate);
}

function drawImage(imageUrl, location) {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    const size = 150;

    img.onload = function() {
        console.log("Image loaded successfully!");
        // Store the image so it persists across animation frames and has a start timestamp
        drawnImages.push({ img: img, x: location.x, y: location.y, size: size, start: performance.now() });
    };

    img.onerror = function(evt) {
        console.error("Failed to load image:", imageUrl);
        console.error("Error event:", evt);
    };

    console.log("Starting to load image from:", imageUrl);
    img.src = imageUrl;
}


async function askWord(word, location) {
    const url = "https://itp-ima-replicate-proxy.web.app/api/create_n_get";
    //Get Auth Token from: https://itp-ima-replicate-proxy.web.app/
    let authToken = "";

    let prompt = word + " inside a thought bubble, comic style, white background, no person underneath";
    document.body.style.cursor = "progress";
    const data = {
        model: "google/nano-banana",
        input: {
            prompt: prompt,
        },
    };
    let fetchOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(data),
    };
    console.log("data", fetchOptions, "url", url);

    console.log("Generating image...");
    generating = true;
    generatingPos = { x: location.x, y: location.y };
    try {
        const response = await fetch(url, fetchOptions);

        const prediction = await response.json();
        console.log("prediction", prediction);
        
        if (prediction.output) {
            console.log("Loading image from URL:", prediction.output);
            drawImage(prediction.output, location);
        }
    } catch (err) {
        console.error('Error generating image', err);
    } finally {
        generating = false;
        document.body.style.cursor = "auto";
    }
    
    inputBoxDirectionX = 1;
    inputBoxDirectionY = 1;
}


function initInterface() {
    // Get the input box and the canvas element
    canvas = document.createElement('canvas');
    canvas.setAttribute('id', 'myCanvas');
    canvas.style.position = 'absolute';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.left = '0';
    canvas.style.top = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    document.body.appendChild(canvas);
    console.log('canvas', canvas.width, canvas.height);


    inputBox = document.createElement('input');
    inputBox.setAttribute('type', 'text');
    inputBox.setAttribute('id', 'inputBox');
    inputBox.setAttribute('placeholder', 'Enter text here');
    inputBox.style.position = 'absolute';
    inputBox.style.left = '50%';
    inputBox.style.top = '50%';
    inputBox.style.transform = 'translate(-50%, -50%)';
    inputBox.style.zIndex = '100';
    inputBox.style.fontSize = '30px';
    inputBox.style.fontFamily = 'Arial';
    document.body.appendChild(inputBox);
    inputBox.setAttribute('autocomplete', 'off');

    // Add event listener to the input box
    inputBox.addEventListener('keydown', function (event) {
        // Check if the Enter key is pressed

        if (event.key === 'Enter') {
            const inputValue = inputBox.value;
            askWord(inputValue, { x: inputLocationX, y: inputLocationY });

        }
    });

    // Add event listener to the document for mouse down event
    document.addEventListener('mousedown', (event) => {
        // Set the location of the input box to the mouse location
        inputLocationX = event.clientX;
        inputLocationY = event.clientY;
        inputBoxDirectionX = 0;
        inputBoxDirectionY = 0;
    });
}