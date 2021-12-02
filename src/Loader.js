import {EdgesGeometry, Group, LineBasicMaterial, LineSegments,
  Mesh, MeshStandardMaterial, Vector3} from 'three';
// import { ColladaLoader } from 'three/examples/jsm/loaders/ColladaLoader.js';
import {STLLoader} from 'three/examples/jsm/loaders/STLLoader.js';

class Loader {
  constructor( options, onLoad ) {
    const wireM = new LineBasicMaterial( {color: 0xff0000, linewidth: 1} );
    const facesM = new MeshStandardMaterial( {color: 0x9dc2cf} );

    const loader = new STLLoader();
    // if ( options.src.endsWith( '.stl' ) ) {
    //   loader = new STLLoader();
    // }
    // // else if (options.src.endsWith( '.dae' ) ) {
    // //     loader = new ColladaLoader();
    // // }
    // else {
    //   console.error( 'Format not supported' );
    // }

    loader.load( options.src, (geom) => {
      const model = new Group();

      // Scale down to match view
      const size = new Vector3();
      if ( options.center ) {
        geom.center();
      }

      if ( options.scale === true ) {
        geom.boundingBox.getSize(size);
        const l = Math.max(size.x, size.y, size.z);
        geom.scale(10/l, 10/l, 10/l);
      } else if ( options.scale !== false ) {
        geom.scale( options.scale, options.scale, options.scale );
      }

      const mesh = new Mesh( geom, facesM );
      mesh.name = 'main-mesh';
      model.add( mesh );

      const edges = new LineSegments( new EdgesGeometry( geom ), wireM );
      edges.name = 'edges';
      model.add( edges );

      onLoad( geom, model );
    } );
  }
};

export {Loader};
