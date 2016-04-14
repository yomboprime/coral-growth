
// Check for WebGL
if ( !Detector.webgl ) {

    Detector.addGetWebGLMessage();

}

// Application parameters
var maxVertices = 120000;
var maxTriangleSideSize = 0.3;
var editInfluenceRadius = 0.15 * 3;

// Global variables
var renderer = null;
var theCanvas = null;
var camera = null;
var scene = null;

var material = null;
var subdividibleMesh = null;
var outputMesh = null;

var canEdit = true;
var initialCursorPosition = new THREE.Vector3();
var initialCursorNormal = new THREE.Vector3();
var currentCursorPosition = new THREE.Vector3();
var currentCursorIncrement = new THREE.Vector3();
var previousShadingMode = THREE.SmoothShading;
var mouseStatus = 0;
var raycaster = new THREE.Raycaster();
var mouseCoords = new THREE.Vector2();
var plane = new THREE.Plane();
var line = new THREE.Line3();
var ballHelper = null;

var tempVector1 = new THREE.Vector3();
var tempVector2 = new THREE.Vector3();


// Main code

init();
run();


// Functions

function init() {

    camera = new THREE.PerspectiveCamera( 45, 1, 0.01, 100 );
    camera.position.set( 2, 2, 5 );
    
    scene = new THREE.Scene();

    createLights();

    material = createMaterial( 0xFFA030 );

    createSubdivisibleMesh();

    var ballMat = createMaterial( 0x00A030 );
    ballMat.transparent = true;
    ballMat.opacity = 0.5;
    ballHelper = new THREE.Mesh( new THREE.SphereBufferGeometry( 1, 30, 20 ), ballMat );
    ballHelper.scale.setScalar( editInfluenceRadius );
    ballHelper.visible = false;
    scene.add( ballHelper );


    // Renderer
    renderer = new THREE.WebGLRenderer( {
        antialias: true
    } );
    renderer.setClearColor( 0x000000 );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.shadowMap.enabled = true;
    theCanvas = renderer.domElement;

    // Gets HTML elements
    div3DView = document.getElementById( "idDiv3DView" );

    // Inserts the canvas in its place
    div3DView.appendChild( theCanvas );

    controls = new THREE.OrbitControls( camera );

    attachEvents();

}

function attachEvents() {

    window.addEventListener( 'keydown', onKeyDown, false );

    window.addEventListener( 'mousedown', onMouseDown, false );
    window.addEventListener( 'mousemove', onMouseMove, false );
    window.addEventListener( 'mouseup', onMouseUp, false );

    window.addEventListener( 'resize', onWindowResize, false );

    onWindowResize();

}

function onWindowResize() {

    var view3DResolutionX = window.innerWidth;
    var view3DResolutionY = window.innerHeight;
    var view3DAspect = view3DResolutionX / view3DResolutionY;

    camera.aspect = view3DAspect;
    camera.updateProjectionMatrix();

    renderer.setSize( view3DResolutionX, view3DResolutionY );

    renderer.setSize( view3DResolutionX, view3DResolutionY );
}

function onKeyDown( event ) {

    switch ( event.keyCode ) {

        // "W" key switches wireframe mode
        case 87:
            material.wireframe = ! material.wireframe;
            if ( material.wireframe ) {
                material.shading = THREE.SmoothShading;
            }
            else {
                material.shading = previousShadingMode;
            }

            material.needsUpdate = true;
            break;

        // "S" key switches shading mode
        case 83:

            if ( ! material.wireframe ) {
                if ( material.shading === THREE.SmoothShading ) {
                    material.shading = THREE.FlatShading;
                    previousShadingMode = THREE.FlatShading;
                }
                else {
                    material.shading = THREE.SmoothShading;
                    previousShadingMode = THREE.SmoothShading;
                }
            }

            material.needsUpdate = true;
            break;

    }

}

function onMouseDown( event ) {

    mouseStatus = 0;

    if ( event.ctrlKey ) {
        return;
    }

    mouseStatus = 1;

    mouseCoords.set( ( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1 );
    raycaster.setFromCamera( mouseCoords, camera );
    var intersects = this.raycaster.intersectObject( outputMesh );

    if ( intersects.length > 0 ) {
        
        var intersection = intersects[ 0 ];
        
        initialCursorPosition.copy( intersection.point );

        var obj = intersection.object;

        // Obtain normal in world space
        if ( intersection.face && obj ) {
            initialCursorNormal.copy( intersection.face.normal ).transformDirection( obj.matrixWorld );
        }
        else {
            initialCursorNormal.set( 0, 1, 0 );
        }

        // Builds plane where the cursor will move until mouse button is released
        tempVector1.crossVectors( raycaster.ray.direction, initialCursorNormal );
        tempVector2.crossVectors( tempVector1, initialCursorNormal );
        tempVector2.normalize();
        plane.setFromNormalAndCoplanarPoint( tempVector2, initialCursorPosition );

        // Set visual helper position
        ballHelper.position.copy( initialCursorPosition );

        currentCursorPosition.copy( initialCursorPosition );
        currentCursorIncrement.set( 0, 0, 0 );

    }
    else {

        mouseStatus = 0;

    }

}

function onMouseMove( event ) {

    if ( event.ctrlKey ) {
        mouseStatus = 0;
        return;
    }

    if ( mouseStatus === 0 ) {
        return;
    }

    mouseCoords.set( ( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1 );
    raycaster.setFromCamera( mouseCoords, camera );
    line.start.copy( raycaster.ray.origin );
    line.end.copy( raycaster.ray.direction );
    line.end.multiplyScalar( 100 );
    line.end.add( raycaster.ray.origin );

    var pointResult = plane.intersectLine( line, tempVector1 );
    if ( pointResult !== undefined ) {

        currentCursorIncrement.subVectors( pointResult, currentCursorPosition );
        currentCursorPosition.copy( pointResult );

        ballHelper.position.copy( pointResult );

        editMesh();
        
    }

}

function onMouseUp( event ) {

    mouseStatus = 0;

}

function createMaterial( color ) {

    return new THREE.MeshStandardMaterial( {
        // 0xRRGGBB
        color: color,
        // > 0
        roughness: 0.2,
        // > 0
        metalness: 0.1,
        // 0xRRGGBB
        emissive: 0,
        // > 0
        emissiveIntensity: 0,
        // 0..1
        envMapIntensity: 0,
        // 0 (transparent) to 1 (opaque)
        opacity: 1,
        transparent: false,
        // > 0
        refractionRatio: 1,
        // true or false
        shading: THREE.SmoothShading,
        // true or false
        wireframe: false,
        wireframeLinewidth: 2
    } );

}

function createLights() {

    scene.add( new THREE.AmbientLight( 0x808080, 1 ) );

    function createLight( pos, color, intensity ) {

        var sun = new THREE.DirectionalLight( color, intensity );

        sun.position.copy( pos );

        sun.castShadow = true;

        var d = 20;
        var s = 10;
        sun.shadow.camera.left = - s;
        sun.shadow.camera.right = s;
        sun.shadow.camera.top = s;
        sun.shadow.camera.bottom = - s;

        sun.shadow.camera.near = d / 30;
        sun.shadow.camera.far = d;

        sun.shadow.mapSize.x = 1024 * 2;
        sun.shadow.mapSize.y = 1024 * 2;

        scene.add( sun );

    }

    createLight( new THREE.Vector3( 5, 8, 3 ), 0xFFFFFF, 1 );
    createLight( new THREE.Vector3( -5, -4, -1 ), 0xFFA0A0, 0.2 );
}

function createSubdivisibleMesh() {

    outputMesh = SubdivisibleMesh.createOutputMesh( maxVertices, material );
    outputMesh.castShadow = true;
    outputMesh.receiveShadow = true;
    scene.add( outputMesh );


    var bl = 1;
    var g = new THREE.BoxGeometry( bl, bl, bl, 1, 1, 1 );
    //var g = new THREE.SphereBufferGeometry( 1, 12, 12 );
    //var g = new THREE.TetrahedronGeometry( 1, 0 );

    subdividibleMesh = new SubdivisibleMesh();

    subdividibleMesh.mergeInputGeometry( g );

    var subdivided = 1;
    while ( subdivided  > 0 ) {
        subdivided = subdividibleMesh.subdivide( maxTriangleSideSize, maxVertices );
    }

    subdividibleMesh.computeNormals();
    subdividibleMesh.fillMesh( outputMesh );

}

function growCoral() {


    subdividibleMesh.applyScalarFieldToVertices( field1, 0.05 / 60 );
//    subdividibleMesh.applyScalarFieldToVertices( field1, 0.05 );
//    subdividibleMesh.applyVectorFieldToVertices( field2, 0.05 );

    subdividibleMesh.subdivide( maxTriangleSideSize, maxVertices );

    subdividibleMesh.computeNormals();

    subdividibleMesh.fillMesh( outputMesh );

}

function editMesh() {

    if ( ! canEdit ) {
        return;
    }

    subdividibleMesh.applyVectorFieldToVertices( userVectorField, 1 );

    subdividibleMesh.subdivide( maxTriangleSideSize, maxVertices );

    subdividibleMesh.computeNormals();

    if ( subdividibleMesh.fillMesh( outputMesh ) ) {
        // Max number of vertices reached, can't edit the mesh anymore
        canEdit = false;
        ballHelper.material.color = new THREE.Color( 0xFF0000 );
        ballHelper.material.opacity = 1;
        ballHelper.material.needsUpdate = true;
    }

}

function field1( position, normal ) {

    var d = Math.sqrt( position.x * position.x + position.z * position.z );

    if ( d <= 0.4 && position.y > 0 ) {
        return Math.max( 0, normal.y );
    }

    return 0;

}

var field2 = function() {

    var v = new THREE.Vector3();

    return function( position ) {

        var d = Math.sqrt( position.x * position.x + position.z * position.z );
        var amount = 0;
        if ( d <= 0.4 && position.y > 0 ) {
            amount = 1;
        }

        v.set( 0, amount, 0 );

        return v;
    };

}();

var userVectorField = function() {

    var v = new THREE.Vector3();
    var v1 = new THREE.Vector3();
    var v2 = new THREE.Vector3();
    var vField = new THREE.Vector3();

    return function( position, normal ) {

        v.subVectors( position, currentCursorPosition );

        var distance = v.length();
        var amount = 0;
        vField.set( 0, 0, 0 );

        if ( distance < editInfluenceRadius ) {

            amount = 1 - distance / editInfluenceRadius;

            vField.copy( currentCursorIncrement );
            vField.multiplyScalar( amount );

            var angle = amount * Math.PI * 0.5;
            var amount6 = editInfluenceRadius * amount / 6;

            v1.copy( normal ).multiplyScalar( Math.sin( angle ) * amount6 );
            v2.copy( v ).normalize().multiplyScalar( Math.cos( angle ) * amount6 );

            vField.add( v1 );
            vField.add( v2 );

        }

        return vField;
    };

}();

function getTime() {
    return performance.now() / 1000;
}

function run() {

    requestAnimationFrame( run );

    controls.update();

//    growCoral();

    ballHelper.visible = mouseStatus === 1;

    renderer.render( scene, camera );

}
