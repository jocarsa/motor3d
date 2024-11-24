async function parseGLBFile(url) {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();

    // Read the GLB header
    const dataView = new DataView(arrayBuffer);
    const magic = new TextDecoder().decode(new Uint8Array(arrayBuffer.slice(0, 4)));
    if (magic !== 'glTF') throw new Error('Invalid GLB file.');

    const version = dataView.getUint32(4, true);
    if (version !== 2) throw new Error('Unsupported GLB version.');

    const jsonChunkLength = dataView.getUint32(12, true);
    const jsonChunkType = dataView.getUint32(16, true);
    if (jsonChunkType !== 0x4E4F534A) throw new Error('Invalid JSON chunk.');

    const jsonText = new TextDecoder().decode(new Uint8Array(arrayBuffer.slice(20, 20 + jsonChunkLength)));
    const json = JSON.parse(jsonText);

    const binaryChunkStart = 20 + jsonChunkLength;
    const binaryChunkLength = dataView.getUint32(binaryChunkStart, true);
    const binaryChunk = arrayBuffer.slice(binaryChunkStart + 8, binaryChunkStart + 8 + binaryChunkLength);

    const accessors = json.accessors || [];
    const bufferViews = json.bufferViews || [];
    const buffers = [binaryChunk];

    const meshes = json.meshes || [];

    const structure = meshes.map((mesh) =>
        mesh.primitives.map((primitive) => {
            const vertexAccessor = accessors[primitive.attributes.POSITION];
            const vertices = getBufferData(vertexAccessor, bufferViews, buffers, "VEC3");

            const indexAccessor = accessors[primitive.indices];
            const indices = indexAccessor ? getBufferData(indexAccessor, bufferViews, buffers, "SCALAR") : null;

            const faces = indices ? createFaces(indices) : null;

            return {
                name: mesh.name || "Unnamed Mesh",
                vertices: vertices, // Grouped as [ [x, y, z], [x, y, z], ... ]
                faces: faces, // Grouped as [ [i0, i1, i2], [i3, i4, i5], ... ]
            };
        })
    );

    return structure.flat();
}

// Helper to extract buffer data
function getBufferData(accessor, bufferViews, buffers, expectedType) {
    const bufferView = bufferViews[accessor.bufferView];
    const buffer = buffers[bufferView.buffer];

    const bufferViewOffset = bufferView.byteOffset || 0;
    const accessorOffset = accessor.byteOffset || 0;
    const byteOffset = bufferViewOffset + accessorOffset;

    const elementSize = getElementSize(accessor.componentType, expectedType);
    const stride = bufferView.byteStride || elementSize;

    // Validate total data length
    const totalLength = accessor.count * stride;

    console.log("Accessor Info:", accessor);
    console.log("BufferView Info:", bufferView);
    console.log("Computed Byte Offset:", byteOffset);
    console.log("Stride:", stride);
    console.log("Element Size:", elementSize);
    console.log("Total Data Length:", totalLength);
    console.log("Buffer Byte Length:", buffer.byteLength);

    // Ensure buffer slice is within bounds
    if (byteOffset + totalLength > buffer.byteLength) {
        throw new Error(`Buffer overflow: byteOffset=${byteOffset}, dataLength=${totalLength}, bufferLength=${buffer.byteLength}`);
    }

    // Extract data
    if (stride !== elementSize) {
        // Handle interleaved data
        return extractInterleavedData(buffer, byteOffset, stride, elementSize, accessor.count);
    }

    const typedArray = getTypedArray(accessor.componentType, buffer, byteOffset, accessor.count * (expectedType === "VEC3" ? 3 : 1));
    return expectedType === "VEC3" ? groupVertices(typedArray) : Array.from(typedArray);
}

// Helper to group vertices as [ [x, y, z], [x, y, z], ... ]
function groupVertices(array) {
    const grouped = [];
    for (let i = 0; i < array.length; i += 3) {
        grouped.push([array[i], array[i + 1], array[i + 2]]);
    }
    return grouped;
}

// Helper to convert indices to faces
function createFaces(indices) {
    const faces = [];
    for (let i = 0; i < indices.length; i += 3) {
        faces.push([indices[i], indices[i + 1], indices[i + 2]]);
    }
    return faces;
}

// Helper to handle interleaved data
function extractInterleavedData(buffer, byteOffset, stride, elementSize, count) {
    const result = [];
    const view = new DataView(buffer, byteOffset);

    for (let i = 0; i < count; i++) {
        const baseOffset = i * stride;
        const element = [];
        for (let j = 0; j < elementSize / 4; j++) { // Assuming 4 bytes per component (FLOAT)
            element.push(view.getFloat32(baseOffset + j * 4, true));
        }
        result.push(element);
    }

    return result;
}

// Helper to get typed array
function getTypedArray(componentType, buffer, byteOffset, length) {
    switch (componentType) {
        case 5120: return new Int8Array(buffer, byteOffset, length); // BYTE
        case 5121: return new Uint8Array(buffer, byteOffset, length); // UNSIGNED_BYTE
        case 5122: return new Int16Array(buffer, byteOffset, length); // SHORT
        case 5123: return new Uint16Array(buffer, byteOffset, length); // UNSIGNED_SHORT
        case 5125: return new Uint32Array(buffer, byteOffset, length); // UNSIGNED_INT
        case 5126: return new Float32Array(buffer, byteOffset, length); // FLOAT
        default: throw new Error(`Unsupported component type: ${componentType}`);
    }
}

// Helper to determine element size
function getElementSize(componentType, type) {
    const componentSizes = {
        5120: 1, // BYTE
        5121: 1, // UNSIGNED_BYTE
        5122: 2, // SHORT
        5123: 2, // UNSIGNED_SHORT
        5125: 4, // UNSIGNED_INT
        5126: 4, // FLOAT
    };
    const typeSizes = {
        SCALAR: 1,
        VEC2: 2,
        VEC3: 3,
        VEC4: 4,
    };
    return componentSizes[componentType] * typeSizes[type];
}
