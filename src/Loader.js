import {Box3, EdgesGeometry, Group, LineBasicMaterial, LineSegments,
  LoadingManager, Matrix4, Mesh, MeshPhysicalMaterial, Vector3} from 'three';

import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {STLLoader} from 'three/examples/jsm/loaders/STLLoader.js';
import {KTX2Loader} from 'three/examples/jsm/loaders/KTX2Loader.js';
import {DRACOLoader} from 'three/examples/jsm/loaders/DRACOLoader.js';
import {MeshoptDecoder} from 'three/examples/jsm/libs/meshopt_decoder.module.js';

function _countMeshes( group ) {
  let count = 0;
  group.traverse( (el) => {
    if ( el.type === 'Mesh' ) {
      count += 1;
    }
  } );
  return count;
}

class Loader {
  async getModelType( src ) {
    if ( src.endsWith( '.gltf' ) || src.endsWith( '.glb' ) ) {
        return 'gltf';
    } else if ( src.endsWith( '.stl' ) ) {
        return 'stl';
    } else {
      try {
        const response = await fetch( src, { method: "HEAD" } );
        if ( response.ok ) {
          const contentType = response.headers.get('content-type');
          if ( contentType === 'model/gltf+json' ||
              contentType === 'model/gltf-binary' ) {
            return 'gltf';
          } else if ( contentType === 'model/stl' ) {
            return 'stl';
          } else {
            console.error( 'Model must be STL or GLTB' );
            return null;
          }
        }
      } catch (error) {
        console.error(error.message);
      }
    }
  }

  constructor() {
    this.type = null; // 'stl' or 'gltf'
    this.manager = new LoadingManager();
    this.loaders = {
      stl: new STLLoader( this.manager ),
      gltf: new GLTFLoader( this.manager ),
      ktx2: new KTX2Loader( this.manager ),
      draco: new DRACOLoader( this.manager ),
    };
    this.loaders.gltf.setMeshoptDecoder( MeshoptDecoder );
    this.loaders.gltf.setKTX2Loader( this.loaders.ktx2 );
    this.loaders.gltf.setDRACOLoader( this.loaders.draco );
  }

  load( options, onLoad ) {

    const wireM = new LineBasicMaterial( {
      color: options.edgeColor || options.constructor.defaultEdgeColor,
      linewidth: 1} );

    const process = ( geom, mesh ) => {
      // Scale down to match view
      const size = new Vector3();
      let model;

      if ( geom !== null ) {
        // Mesh
        model = new Group();
        model.add( mesh );

        if ( options.center ) {
          geom.center();
        }

        if ( options.scale === true ) {
          if ( geom.boundingBox === null ) {
            geom.computeBoundingBox();
          }
          geom.boundingBox.getSize(size);
          const l = Math.max(size.x, size.y, size.z);
          geom.scale( 12/l, 12/l, 12/l );
        } else if ( options.scale !== false ) {
          geom.scale( options.scale, options.scale, options.scale );
        }

        const edges = new LineSegments(
            new EdgesGeometry( geom, options.wireframeAngle ), wireM );
        edges.name = 'edges';
        model.add( edges );
      } else {
        // Scene
        model = mesh;
        if ( options.center || options.scale !== false ) {
          const m1 = new Matrix4();
          const boundingBox = new Box3();
          boundingBox.expandByObject( mesh );

          if ( options.scale === true ) {
            boundingBox.getSize(size);
            const l = Math.max(size.x, size.y, size.z);
            m1.makeScale( 12/l, 12/l, 12/l );
            mesh.applyMatrix4( m1 );
            boundingBox.applyMatrix4( m1 );
          } else if ( options.scale !== false ) {
            m1.makeScale( options.scale, options.scale, options.scale );
            mesh.applyMatrix4( m1 );
            boundingBox.applyMatrix4( m1 );
          }

          if ( options.center ) {
            boundingBox.getCenter( size ).negate();
            m1.makeTranslation( size.x, size.y, size.z );
            mesh.applyMatrix4( m1 );
            // boundingBox.applyMatrix4( m1 );
          }
        }

        mesh.traverse( (el) => {
          if ( el.type === 'Mesh' ) {
            const edges = new LineSegments(
                new EdgesGeometry( el.geometry, options.wireframeAngle ), wireM );
            edges.name = 'edges';
            el.parent.add( edges );
          }
        } );
      }

      onLoad( geom, model );
    };

    this.getModelType(options.src).then( (type) => {
      if ( type == 'stl' ) {
        const facesM = new MeshPhysicalMaterial( {
          color: options.faceColor || options.constructor.defaultFaceColor,
          clearcoat: 0.5, clearcoatRoughness: 0.5} );

        this.loaders.stl.load( options.src, (geom) => {
          if ( geom.hasColors ) {
            facesM.opacity = geom.alpha;
            facesM.vertexColors = true;
          }
          const mesh = new Mesh( geom, facesM );
          mesh.name = 'main-mesh';
          process( geom, mesh );
        } );
      } else if ( type == 'gltf' ) {
        this.loaders.gltf.load( options.src, (gltf) => {
          const count = _countMeshes(gltf.scene);
          if ( count == 1 ) {
            const mesh = gltf.scene.getObjectByProperty( 'type', 'Mesh' );
            mesh.name = 'main-mesh';
            process( mesh.geometry, mesh );
          } else if ( count > 1 ) {
            gltf.scene.name = 'main-mesh';
            // Add wireframe?
            process( null, gltf.scene );
          } else {
            console.error( 'No mesh found in scene' );
          }
        } );
      }
    });
  }
}

// function loadGLTF( options, onLoad ) {
//   _gltfLoader.load( options.src, ( gltf ) => {
//     const scene = gltf.scene;
//     const boundingBox = new Box3();
//     const center = new Vector3(0, 0, 0);
//     const scale = new Vector3(1, 1, 1);
//     const rot = new Quaternion();
//     const trans = new Matrix4();
//     boundingBox.expandByObject( scene );

//     if ( options.center ) {
//       boundingBox.getCenter( center ).negate();
//     }

//     if ( options.scale === true ) {
//       boundingBox.getSize(scale);
//       const l = Math.max(scale.x, scale.y, scale.z);
//       scale.set(10/l, 10/l, 10/l);
//     } else if ( options.scale !== false ) {
//       scale.set( options.scale, options.scale, options.scale );
//     }

//     trans.compose( center, rot, scale );
//     scene.applyMatrix4(trans);

//     onLoad( scene );
//   } );
// }

const loader = new Loader();

export {loader};
