/**
* @param {Element} canvas. The canvas element to create a context from.
* @return {WebGLRenderingContext} The created context.
*/
function setupWebGL(canvas) {
    return WebGLUtils.setupWebGL(canvas);
}

// Create a buffer object and perform the initial configuration
function initVertexBuffers(gl) {
    var o = new Object();
    o.vertexBuffer = createEmptyArrayBuffer(gl, gl.program.a_Position, 4, gl.FLOAT);
    o.normalBuffer = createEmptyArrayBuffer(gl, gl.program.a_Normal, 4, gl.FLOAT);
    o.colorBuffer = createEmptyArrayBuffer(gl, gl.program.a_Color, 4, gl.FLOAT);
    o.indexBuffer = gl.createBuffer();

    return o;
}

// Create a buffer object, assign it to attribute variables, and enable the assignment
function createEmptyArrayBuffer(gl, a_attribute, num, type) {
    var buffer =  gl.createBuffer();  // Create a buffer object

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
    gl.enableVertexAttribArray(a_attribute);  // Enable the assignment

    return buffer;
}

window.onload = async function init() {
    var canvas = document.getElementById("c");
    gl = setupWebGL(canvas);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
    gl.program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(gl.program);

    var ext = gl.getExtension('OES_element_index_uint');
    if (!ext) {
        console.log('Warning: Unable to use an extension');
    }

    var lightPos = vec4(0.0, 0.0, -1.0, 0.0);
    var le = vec3(1.0, 1.0, 1.0);
    var ka = 0.7;
    var kd = 0.6;
    var ks = 0.5;
    var s = 3.0;

    gl.uniform4fv(gl.getUniformLocation(gl.program, "lightPos"), flatten(lightPos));
    gl.uniform3fv(gl.getUniformLocation(gl.program, "le"), le);
    gl.uniform1f(gl.getUniformLocation(gl.program, "ka"), ka);
    gl.uniform1f(gl.getUniformLocation(gl.program, "kd"), kd);
    gl.uniform1f(gl.getUniformLocation(gl.program, "ks"), ks);
    gl.uniform1f(gl.getUniformLocation(gl.program, "s"), s);

    // Get the storage locations of attribute and uniform variables
    gl.program.a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    gl.program.a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
    gl.program.a_Color = gl.getAttribLocation(gl.program, 'a_Color');

    // Prepare empty buffer objects for vertex coordinates, colors, and normals
    var model = initVertexBuffers(gl, gl.program);
    
    // Start reading the OBJ file
    var drawingInfo = await readOBJFile("../suzanne/suzanne.obj", 1, true);

    var currentAngle = [0.0, 0.0];

    var modelViewLoc = gl.getUniformLocation(gl.program, "modelView");
    var projectionLoc = gl.getUniformLocation(gl.program, "projection");
    var fov = 45;
    var aspect = canvas.width / canvas.height;
    var near = 1;
    var far = 20;

    var dragging = false; // Dragging or not
    var lastX = -1, lastY = -1; // Last position of the mouse
    canvas.onmousedown = function(ev) {
        // Mouse is pressed
        var x = ev.clientX, y = ev.clientY;
        // Start dragging if a mouse is in  <canvas>
        var rect = ev.target.getBoundingClientRect();
        if (rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom) {
            lastX = x;
            lastY = y;
            dragging = true;
        }
    };
    // Mouse is released
    canvas.onmouseup = function() {
        dragging = false;
    };
    canvas.onmousemove = function(ev) {
        // Mouse is moved
        var x = ev.clientX, y = ev.clientY;
        if (dragging) {
            var factor = 100/canvas.height;  // The rotation ratio
            var dx = factor * (x - lastX);
            var dy = factor * (y - lastY);
            // Limit x-axis rotation angle to -90 to 90 degrees
            currentAngle[0] = Math.max(Math.min(currentAngle[0] + dy, 90.0), -90.0);
            currentAngle[1] = currentAngle[1] + dx;
        }
        lastX = x, lastY = y;
    };

    function render() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        var eye = vec3(0.0, 0.0, 7.0);
        var at = vec3(0.0, 0.0, 0.0);
        var up = vec3(0.0, 1.0, 0.0);
        var modelView = [
            lookAt(eye, at, up),
            rotateX(-currentAngle[0]), 
            rotateY(-currentAngle[1])
        ].reduce(mult);
        var projection = perspective(fov, aspect, near, far);
        gl.uniformMatrix4fv(modelViewLoc, false, flatten(modelView));
        gl.uniformMatrix4fv(projectionLoc, false, flatten(projection));
        if (drawingInfo) {
            gl.bindBuffer(gl.ARRAY_BUFFER, model.vertexBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.vertices, gl.STATIC_DRAW);
            gl.bindBuffer(gl.ARRAY_BUFFER, model.normalBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.normals, gl.STATIC_DRAW);
            gl.bindBuffer(gl.ARRAY_BUFFER, model.colorBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.colors, gl.STATIC_DRAW);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, drawingInfo.indices, gl.STATIC_DRAW);
            gl.drawElements(gl.TRIANGLES, drawingInfo.indices.length, gl.UNSIGNED_INT, 0);
        }
        requestAnimationFrame(render);
    }

    render();
}
