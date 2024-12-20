	// Function to render the faces on a 2D canvas
        function renderOnCanvas(structure) {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    structure.forEach((object) => {
        console.log(`Rendering: ${object.name}`);
        object.faces.forEach((face) => {
            const points = face.map((index) => {
                const [x, y, z] = object.vertices[index];

                // Orthographic projection (front view: ignore Z)
                const projectedX = x * 200 + canvas.width / 2; // Scale and center
                const projectedY = -y * 200 + canvas.height / 2; // Scale and invert Y for canvas
                return [projectedX, projectedY, z]; // Include Z for normal calculation
            });

            // Calculate the normal of the face
            const normal = calculateFaceNormal(points);

            // Backface culling: only draw if normal points toward the camera (positive Z)
            if (normal[2] > 0) {
                drawTriangle(ctx, points.map(([x, y]) => [x, y]));
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
