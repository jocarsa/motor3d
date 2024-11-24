	// Function to render the faces on a 2D canvas
     function renderOnCanvas(structure) {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Simulated light direction (northeast)
    const lightDirection = normalize2D([1, 1]);

    structure.forEach((object) => {
        console.log(`Rendering: ${object.name}`);
        object.faces.forEach((face) => {
            const points = face.map((index) => {
                const [x, y, z] = object.vertices[index];

                // Orthographic projection (front view: ignore Z)
                const projectedX = x * 400 + canvas.width / 2; // Scale and center
                const projectedY = -y * 400 + canvas.height / 2; // Scale and invert Y for canvas
                return [projectedX, projectedY, z]; // Include Z for normal calculation
            });

            // Calculate the normal of the face
            const normal = calculateFaceNormal(points);

            // Backface culling: only draw if normal points toward the camera (positive Z)
            if (normal[2] > 0) {
                // Calculate shading intensity
                const faceVector = normalize2D([normal[0], normal[1]]);
                const intensity = Math.max(0, dotProduct2D(faceVector, lightDirection)); // Clamp between 0 and 1

                // Draw the triangle with a solid color based on intensity
                drawSolidTriangle(ctx, points.map(([x, y]) => [x, y]), intensity);
            }
        });
    });
}


function calculateFaceNormal(points) {
    const [p1, p2, p3] = points;

    // Vectors for two edges of the triangle
    const u = [p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]];
    const v = [p3[0] - p1[0], p3[1] - p1[1], p3[2] - p1[2]];

    // Cross product u × v
    const nx = u[1] * v[2] - u[2] * v[1];
    const ny = u[2] * v[0] - u[0] * v[2];
    const nz = u[0] * v[1] - u[1] * v[0];

    return [nx, ny, nz];
}

        // Helper to draw a triangle on the canvas
        function drawTriangle(ctx, points) {
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]); // Move to the first vertex
    ctx.lineTo(points[1][0], points[1][1]); // Draw line to the second vertex
    ctx.lineTo(points[2][0], points[2][1]); // Draw line to the third vertex
    ctx.closePath(); // Close the triangle
    ctx.strokeStyle = 'black'; // Triangle outline color
    ctx.fillStyle = 'rgba(100, 150, 200, 0.5)'; // Triangle fill color
    ctx.fill(); // Fill the triangle
    ctx.stroke(); // Draw the outline
}

function drawSolidTriangle(ctx, points, intensity) {
    const [p1, p2, p3] = points;

    // Adjust the color based on intensity
    const baseColor = [100, 150, 200]; // Base color (light blue)
    const shadedColor = baseColor.map((c) => Math.round(c * intensity)); // Apply intensity
    const color = `rgb(${shadedColor[0]}, ${shadedColor[1]}, ${shadedColor[2]})`;

    // Draw the triangle
    ctx.beginPath();
    ctx.moveTo(p1[0], p1[1]);
    ctx.lineTo(p2[0], p2[1]);
    ctx.lineTo(p3[0], p3[1]);
    ctx.closePath();
    ctx.fillStyle = color; // Apply solid color
    ctx.fill();
    ctx.strokeStyle = 'black';
    ctx.stroke();
}

// Helper to calculate the normal of a triangle face
function calculateFaceNormal(points) {
    const [p1, p2, p3] = points;

    // Vectors for two edges of the triangle
    const u = [p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]];
    const v = [p3[0] - p1[0], p3[1] - p1[1], p3[2] - p1[2]];

    // Cross product u × v
    const nx = u[1] * v[2] - u[2] * v[1];
    const ny = u[2] * v[0] - u[0] * v[2];
    const nz = u[0] * v[1] - u[1] * v[0];

    return [nx, ny, nz];
}

// Helper to normalize a 2D vector
function normalize2D(v) {
    const length = Math.sqrt(v[0] * v[0] + v[1] * v[1]);
    return [v[0] / length, v[1] / length];
}

// Helper to calculate the dot product of two 2D vectors
function dotProduct2D(v1, v2) {
    return v1[0] * v2[0] + v1[1] * v2[1];
}
