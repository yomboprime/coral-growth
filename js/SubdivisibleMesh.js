
var SubdivisibleMesh = function() {

    this.vertices = [];
    this.normals = [];
    this.numVerticesContributingToNormals = [];
    
    this.rootTriangles = [];


    // Temp variables
    this.computeNormalsV1 = new THREE.Vector3();
    this.computeNormalsV2 = new THREE.Vector3();
    this.computeNormalsN = new THREE.Vector3();
    this.sonData = [];
    for ( var i = 0; i < 3; i++ ) {
        this.sonData.push( {
            son0: null,
            son1: null
        } );
    }
};

SubdivisibleMesh.prototype = {
    constructor: SubdivisibleMesh
};

SubdivisibleMesh.createOutputMesh = function( numVertices, material ) {

    var positions = new Float32Array( numVertices * 3 );
    var normals = new Float32Array( numVertices * 3 );
    var outputBufGeom = new THREE.BufferGeometry();
    outputBufGeom.addAttribute( "position", new THREE.BufferAttribute( positions, 3 ) );
    outputBufGeom.addAttribute( "normal", new THREE.BufferAttribute( normals, 3 ) );
    outputBufGeom.drawRange.count = 0;
    var mesh = new THREE.Mesh( outputBufGeom, material );

    return mesh;
};

SubdivisibleMesh.prototype.mergeInputGeometry = function( inputGeometry ) {

    var geometry = null;
    if ( inputGeometry instanceof THREE.BufferGeometry === true ) {
        geometry = new THREE.Geometry().fromBufferGeometry( inputGeometry );
    }
    else {
        geometry = inputGeometry.clone();
    }

    geometry.mergeVertices();


    var numVertices = this.vertices.length;
    var newVertices = geometry.vertices;
    var numNewVertices = newVertices.length;
    for ( var i = 0, j = numVertices; i < numNewVertices; i++ ) {
        this.vertices[ j ] = newVertices[ i ];
        this.normals[ j ] = new THREE.Vector3();
        this.numVerticesContributingToNormals[ j ] = 0;
        j++;
    }

    var newTriangles = geometry.faces;
    var numNewTriangles = newTriangles.length;
    for ( var i = 0; i < numNewTriangles; i++ ) {
        var f = newTriangles[ i ];
        this.insertRootTriangle( f.a, f.b, f.c );
    }

};

SubdivisibleMesh.prototype.createTriangle = function( a, b, c ) {

    return {
        a: a,
        b: b,
        c: c,
        brothers: [ null, null, null ],
        brothersSegment: [ -1, -1, -1 ],
        brothersInverted: [ false, false, false ],
        sons: null
        // Not used
        //parent: null
    };

};

SubdivisibleMesh.prototype.insertRootTriangle = function( a, b, c ) {

    var t = this.createTriangle( a, b, c );

    // Populates brothers
    for ( var i = 0, il = this.rootTriangles.length; i < il; i++ ) {
        var t2 = this.rootTriangles[ i ];

        // Segment 0
        if ( ( t.a === t2.b && t.b === t2.a ) ) {
            t.brothers[ 0 ] = t2;
            t2.brothers[ 0 ] = t;
            t.brothersSegment[ 0 ] = 0;
            t2.brothersSegment[ 0 ] = 0;
            t.brothersInverted[ 0 ] = true;
            t2.brothersInverted[ 0 ] = true;
        }
        else if ( t.a === t2.a && t.b === t2.b ) {
            t.brothers[ 0 ] = t2;
            t2.brothers[ 0 ] = t;
            t.brothersSegment[ 0 ] = 0;
            t2.brothersSegment[ 0 ] = 0;
        }
        else if ( t.a === t2.a && t.b === t2.c ) {
            t.brothers[ 0 ] = t2;
            t2.brothers[ 2 ] = t;
            t.brothersSegment[ 0 ] = 2;
            t2.brothersSegment[ 2 ] = 0;
            t.brothersInverted[ 0 ] = true;
            t2.brothersInverted[ 2 ] = true;
        }
        else if ( t.a === t2.c && t.b === t2.a ) {
            t.brothers[ 0 ] = t2;
            t2.brothers[ 2 ] = t;
            t.brothersSegment[ 0 ] = 2;
            t2.brothersSegment[ 2 ] = 0;
        }
        else if ( t.a === t2.b && t.b === t2.c ) {
            t.brothers[ 0 ] = t2;
            t2.brothers[ 1 ] = t;
            t.brothersSegment[ 0 ] = 1;
            t2.brothersSegment[ 1 ] = 0;
        }
        else if ( t.a === t2.c && t.b === t2.b ) {
            t.brothers[ 0 ] = t2;
            t2.brothers[ 1 ] = t;
            t.brothersSegment[ 0 ] = 1;
            t2.brothersSegment[ 1 ] = 0;
            t.brothersInverted[ 0 ] = true;
            t2.brothersInverted[ 1 ] = true;
        }

        // Segment 1
        else if ( t.b === t2.a && t.c === t2.b ) {
            t.brothers[ 1 ] = t2;
            t2.brothers[ 0 ] = t;
            t.brothersSegment[ 1 ] = 0;
            t2.brothersSegment[ 0 ] = 1;
        }
        else if ( t.b === t2.b && t.c === t2.a ) {
            t.brothers[ 1 ] = t2;
            t2.brothers[ 0 ] = t;
            t.brothersSegment[ 1 ] = 0;
            t2.brothersSegment[ 0 ] = 1;
            t.brothersInverted[ 1 ] = true;
            t2.brothersInverted[ 0 ] = true;
        }
        else if ( t.b === t2.c && t.c === t2.a ) {
            t.brothers[ 1 ] = t2;
            t2.brothers[ 2 ] = t;
            t.brothersSegment[ 1 ] = 2;
            t2.brothersSegment[ 2 ] = 1;
        }
        else if ( t.b === t2.a && t.c === t2.c ) {
            t.brothers[ 1 ] = t2;
            t2.brothers[ 2 ] = t;
            t.brothersSegment[ 1 ] = 2;
            t2.brothersSegment[ 2 ] = 1;
            t.brothersInverted[ 1 ] = true;
            t2.brothersInverted[ 2 ] = true;
        }
        else if ( t.b === t2.c && t.c === t2.b ) {
            t.brothers[ 1 ] = t2;
            t2.brothers[ 1 ] = t;
            t.brothersSegment[ 1 ] = 1;
            t2.brothersSegment[ 1 ] = 1;
            t.brothersInverted[ 1 ] = true;
            t2.brothersInverted[ 1 ] = true;
        }
        else if ( t.b === t2.b && t.c === t2.c ) {
            t.brothers[ 1 ] = t2;
            t2.brothers[ 1 ] = t;
            t.brothersSegment[ 1 ] = 1;
            t2.brothersSegment[ 1 ] = 1;
        }

        // Segment 2
        else if ( t.c === t2.a && t.a === t2.b ) {
            t.brothers[ 2 ] = t2;
            t2.brothers[ 0 ] = t;
            t.brothersSegment[ 2 ] = 0;
            t2.brothersSegment[ 0 ] = 2;
            t.brothersInverted[ 2 ] = true;
            t2.brothersInverted[ 0 ] = true;
        }
        else if ( t.c === t2.b && t.a === t2.a ) {
            t.brothers[ 2 ] = t2;
            t2.brothers[ 0 ] = t;
            t.brothersSegment[ 2 ] = 0;
            t2.brothersSegment[ 0 ] = 2;
            t.brothersInverted[ 2 ] = true;
            t2.brothersInverted[ 0 ] = true;
        }
        else if ( t.c === t2.a && t.a === t2.c ) {
            t.brothers[ 2 ] = t2;
            t2.brothers[ 2 ] = t;
            t.brothersSegment[ 2 ] = 2;
            t2.brothersSegment[ 2 ] = 2;
            t.brothersInverted[ 2 ] = true;
            t2.brothersInverted[ 2 ] = true;
        }
        else if ( t.c === t2.c && t.a === t2.a ) {
            t.brothers[ 2 ] = t2;
            t2.brothers[ 2 ] = t;
            t.brothersSegment[ 2 ] = 2;
            t2.brothersSegment[ 2 ] = 2;
        }
        else if ( t.c === t2.b && t.a === t2.c ) {
            t.brothers[ 2 ] = t2;
            t2.brothers[ 1 ] = t;
            t.brothersSegment[ 2 ] = 1;
            t2.brothersSegment[ 1 ] = 2;
        }
        else if ( t.c === t2.c && t.a === t2.b ) {
            t.brothers[ 2 ] = t2;
            t2.brothers[ 1 ] = t;
            t.brothersSegment[ 2 ] = 1;
            t2.brothersSegment[ 1 ] = 2;
            t.brothersInverted[ 2 ] = true;
            t2.brothersInverted[ 1 ] = true;
        }
    }

    // Inserts the triangle
    this.rootTriangles.push( t );

    return t;

};

SubdivisibleMesh.prototype.computeNormals = function() {

    var vertices = this.vertices;
    var normals = this.normals;
    var nvcn = this.numVerticesContributingToNormals;

    for ( var i = 0, il = vertices.length; i < il; i++ ) {
        normals[ i ].set( 0, 0, 0 );
        nvcn[ i ] = 0;
    }

    var scope = this;
    function computeTriangleRecursive( t ) {

        if ( t.sons ) {
            computeTriangleRecursive( t.sons[ 0 ] );
            computeTriangleRecursive( t.sons[ 1 ] );
            computeTriangleRecursive( t.sons[ 2 ] );
            computeTriangleRecursive( t.sons[ 3 ] );
        }
        else {
            var v0 = vertices[ t.a ];
            var v1 = vertices[ t.b ];
            var v2 = vertices[ t.c ];
            scope.computeNormalsV1.subVectors( v1, v0 );
            scope.computeNormalsV2.subVectors( v2, v0 );
            scope.computeNormalsN.crossVectors( scope.computeNormalsV1, scope.computeNormalsV2 ).normalize();
            normals[ t.a ].add( scope.computeNormalsN );
            normals[ t.b ].add( scope.computeNormalsN );
            normals[ t.c ].add( scope.computeNormalsN );
            nvcn[ t.a ] ++;
            nvcn[ t.b ] ++;
            nvcn[ t.c ] ++;
        }
    }

    var triangles = this.rootTriangles;
    for ( var i = 0, il = triangles.length; i < il; i++ ) {
        var t = triangles[ i ];
        computeTriangleRecursive( t );
    }

    for ( var i = 0, il = vertices.length; i < il; i++ ) {
        normals[ i ].normalize();
    }

};

SubdivisibleMesh.prototype.applyScalarFieldToVertices = function( field, multFactor ) {

    // Applies a displacement to all vertices along triangle normals, given a 3d scalar field
    // Displacement along normal = field( point ) * multFactor
    // The field accepts two parameters: the vertex position, and the vertex normal.

    multFactor = multFactor || 1;

    var vertices = this.vertices;
    var normals = this.normals;
    for ( var i = 0, il = vertices.length; i < il; i++ ) {
        var v = vertices[ i ];
        var n = normals[ i ];
        var moveAmount = field( v, n ) * multFactor;
        v.addScaledVector( n, moveAmount );
    }

};

SubdivisibleMesh.prototype.applyVectorFieldToVertices = function( field, multFactor ) {

    // Applies a displacement to all vertices, given a 3d vector field
    // Displacement = field( point ) * multFactor
    // The field accepts two parameters: the vertex position, and the vertex normal.

    multFactor = multFactor || 1;

    var vertices = this.vertices;
    var normals = this.normals;
    for ( var i = 0, il = vertices.length; i < il; i++ ) {
        var v = vertices[ i ];
        var n = normals[ i ];
        v.addScaledVector( field( v, n ), multFactor );
    }

};

SubdivisibleMesh.prototype.fillMesh = function( outputMesh ) {

    var geometry = outputMesh.geometry;

    var positions = geometry.attributes.position.array;
    var normals = geometry.attributes.normal.array;

    var maxPositions = positions.length;
    var maxPositionsReached = false;

    var newVertices = this.vertices;
    var newNormals = this.normals;

    var getTriangleIndex = this.getTriangleIndex;

    var p = 0;
    function fillTriangle( a, b, c ) {
        
        if ( p >= maxPositions ) {
            maxPositionsReached = true;
            return;
        }

        var v = newVertices[ a ];
        var n = newNormals[ a ];

        positions[ p ] = v.x;
        positions[ p + 1 ] = v.y;
        positions[ p + 2 ] = v.z;

        normals[ p ] = n.x;
        normals[ p + 1 ] = n.y;
        normals[ p + 2 ] = n.z;

        p += 3;

        v = newVertices[ b ];
        n = newNormals[ b ];

        positions[ p ] = v.x;
        positions[ p + 1 ] = v.y;
        positions[ p + 2 ] = v.z;

        normals[ p ] = n.x;
        normals[ p + 1 ] = n.y;
        normals[ p + 2 ] = n.z;

        p += 3;

        v = newVertices[ c ];
        n = newNormals[ c ];

        positions[ p ] = v.x;
        positions[ p + 1 ] = v.y;
        positions[ p + 2 ] = v.z;

        normals[ p ] = n.x;
        normals[ p + 1 ] = n.y;
        normals[ p + 2 ] = n.z;

        p += 3;

    }

    function addTriangleRecursive( t ) {

        function fillHollow( segmentIndex ) {

            var brother = t.brothers[ segmentIndex ];

            if ( brother === null || brother.sons !== null ) {
                return;
            }

            var son = t.sons[ segmentIndex ];
            var nextSegment = ( segmentIndex + 1 ) % 3;

            fillTriangle(
                getTriangleIndex( t, segmentIndex ),
                getTriangleIndex( t, nextSegment ),
                getTriangleIndex( son, nextSegment )
            );
        }

        if ( t.sons ) {

            fillHollow( 0 );
            fillHollow( 1 );
            fillHollow( 2 );

            addTriangleRecursive( t.sons[ 0 ] );
            addTriangleRecursive( t.sons[ 1 ] );
            addTriangleRecursive( t.sons[ 2 ] );
            addTriangleRecursive( t.sons[ 3 ] );

        }
        else {

            fillTriangle( t.a, t.b, t.c );

        }

    }

    var triangles = this.rootTriangles;
    for ( var i = 0; i < triangles.length; i++ ) {

        addTriangleRecursive( triangles[ i ] );

    }

    geometry.drawRange.count = ( p / 3 ) * 2;

    geometry.computeBoundingSphere();

    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.normal.needsUpdate = true;

    return maxPositionsReached;
};

SubdivisibleMesh.prototype.getTriangleIndex = function( t, index ) {

    switch ( index ) {
        case 0:
            return t.a;
        case 1:
            return t.b;
        case 2:
            return t.c;
    }

    return -1;
};

SubdivisibleMesh.prototype.subdivideTriangle = function( t, maxVertices ) {

    if ( t.sons ) {
        console.error( "Tried to subdivide a triangle that is already subdivided" );
        return;
    }

    var scope = this;
    var getTriangleIndex = this.getTriangleIndex;
    function getNewVertex( segmentIndex, sonData ) {

        // Returns the new vertex index and son data

        var newVertexIndex = -1;
        
        var t2 = t.brothers[ segmentIndex ];
        if ( t2 && t2.sons ) {

            // The son index is the segment index in the triangle t2, which is stored in t.brothersSegment
            var sonIndex = t.brothersSegment[ segmentIndex ];
            if ( sonIndex === -1 ) {
                console.log( "Internal error calculating indexes" );
            }

            var son = t2.sons[ sonIndex ];

            var sonVertexIndex = ( sonIndex + 1 ) % 3;

            newVertexIndex = getTriangleIndex( son, sonVertexIndex );

            var son0 = sonIndex;
            var son1 = ( sonIndex + 1 ) % 3;
            if ( t.brothersInverted[ segmentIndex ] ) {
                son0 = son1;
                son1 = sonIndex;
            }

            sonData[ segmentIndex ].son0 = t2.sons[ son0 ];
            sonData[ segmentIndex ].son1 = t2.sons[ son1 ];

            sonData[ segmentIndex ].brotherSegment = sonIndex;

        }
        else {
            var v0 = -1;
            var v1 = -1;
            switch ( segmentIndex ) {
                case 0:
                    v0 = t.a;
                    v1 = t.b;
                    break;
                case 1:
                    v0 = t.b;
                    v1 = t.c;
                    break;
                case 2:
                    v0 = t.c;
                    v1 = t.a;
                    break;
            }
            var v = scope.vertices[ v0 ].clone();
            v.lerp( scope.vertices[ v1 ], 0.5 );
            newVertexIndex = scope.vertices.length;
            if ( newVertexIndex >= maxVertices ) {
                console.log( "Error: Max vertices reached." );
                return;
            }
            scope.vertices.push( v );
            scope.normals.push( new THREE.Vector3() );

            sonData[ segmentIndex ].son0 = null;
            sonData[ segmentIndex ].son1 = null;
            sonData[ segmentIndex ].brotherSegment = -1;
        }

        return newVertexIndex;
    }

    if ( scope.vertices.length >= maxVertices ) {
        // Error
        return;
    }

    // Get the new 3 vertices, one for each side
    var d = getNewVertex( 0, this.sonData );
    var e = getNewVertex( 1, this.sonData );
    var f = getNewVertex( 2, this.sonData );

    if ( scope.vertices.length >= maxVertices ) {
        // Error
        return;
    }

    t.sons = [];

    // Inserts new son triangles

    var t0 = this.createTriangle( t.a, d, f );
    var t1 = this.createTriangle( d, t.b, e );
    var t2 = this.createTriangle( f, e, t.c );
    var t3 = this.createTriangle( e, f, d );

    t.sons.push( t0 );
    t.sons.push( t1 );
    t.sons.push( t2 );
    t.sons.push( t3 );

    // Assigns brothers

    t0.brothers[ 1 ] = t3;
    t1.brothers[ 2 ] = t3;
    t2.brothers[ 0 ] = t3;
    t3.brothers[ 0 ] = t2;
    t3.brothers[ 1 ] = t0;
    t3.brothers[ 2 ] = t1;

    t0.brothersSegment[ 1 ] = 1;
    t1.brothersSegment[ 2 ] = 2;
    t2.brothersSegment[ 0 ] = 0;
    t3.brothersSegment[ 0 ] = 0;
    t3.brothersSegment[ 1 ] = 1;
    t3.brothersSegment[ 2 ] = 2;

    t0.brothersInverted[ 1 ] = true;
    t1.brothersInverted[ 2 ] = true;
    t2.brothersInverted[ 0 ] = true;
    t3.brothersInverted[ 0 ] = true;
    t3.brothersInverted[ 1 ] = true;
    t3.brothersInverted[ 2 ] = true;
    
    function assignSonBrothers( segmentIndex, t0, t1, sonData ) {

        var sd = sonData[ segmentIndex ];
        var t0b = sd.son0;
        var t1b = sd.son1;
        var brotherSegment = t.brothersSegment[ segmentIndex ];

        t0.brothers[ segmentIndex ] = t0b;
        t1.brothers[ segmentIndex ] = t1b;

        t0.brothersSegment[ segmentIndex ] = brotherSegment;
        t1.brothersSegment[ segmentIndex ] = brotherSegment;

        var inverted = t.brothersInverted[ segmentIndex ];
        t0.brothersInverted[ segmentIndex ] = inverted;
        t1.brothersInverted[ segmentIndex ] = inverted;


        if ( t0b && brotherSegment >= 0 ) {
            t0b.brothers[ brotherSegment ] = t0;
            t0b.brothersSegment[ brotherSegment ] = segmentIndex;
            t0b.brothersInverted[ brotherSegment ] = inverted;
        }

        if ( t1b && brotherSegment >= 0 ) {
            t1b.brothers[ brotherSegment ] = t1;
            t0b.brothersSegment[ brotherSegment ] = segmentIndex;
            t1b.brothersInverted[ brotherSegment ] = inverted;
        }

    }

    assignSonBrothers( 0, t0, t1, this.sonData );
    assignSonBrothers( 1, t1, t2, this.sonData );
    assignSonBrothers( 2, t2, t0, this.sonData );

};

SubdivisibleMesh.prototype.subdivide = function( maxTriangleSize, maxVertices ) {

    // Returns number of root triangles that were subdivided

    function distance( v0, v1 ) {

        var dx = ( v1.x - v0.x );
        var dy = ( v1.y - v0.y );
        var dz = ( v1.z - v0.z );

        return Math.sqrt( dx * dx + dy * dy + dz * dz );
    }

    var vertices = this.vertices;
    var scope = this;
    function subdivideRecursive( t ) {
        if ( t.sons ) {
            return subdivideRecursive( t.sons[ 0 ] ) +
                   subdivideRecursive( t.sons[ 1 ] ) +
                   subdivideRecursive( t.sons[ 2 ] ) +
                   subdivideRecursive( t.sons[ 3 ] );
        }
        else {

            // If any segment is greater than the threshold size (and it is not a degenerate triangle), subdivide it

            var distAB = distance( vertices[ t.a ], vertices[ t.b ] );
            var distAC = distance( vertices[ t.a ], vertices[ t.c ] );
            var distBC = distance( vertices[ t.b ], vertices[ t.c ] );

//            var dMin = Math.min( distAB / distAC, distAB / distBC, distAC / distBC );
//            var dMax = Math.max( distAB / distAC, distAB / distBC, distAC / distBC );

            if ( ( distAB > maxTriangleSize ||
                   distAC > maxTriangleSize ||
                   distBC > maxTriangleSize )
//                   && dMin > 0.4 && dMax < 2.5
                  ) {

                scope.subdivideTriangle( t, maxVertices );

                return 1;
            }
            return 0;
        }
    }

    var numAddedTriangles = 0;
    for ( var i = 0, il = this.rootTriangles.length; i < il; i++ ) {
        
        numAddedTriangles += subdivideRecursive( this.rootTriangles[ i ] );

    }

    return numAddedTriangles;
};
