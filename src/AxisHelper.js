import {BoxGeometry, CanvasTexture, Color, Euler, Mesh, MeshBasicMaterial,
  Object3D, OrthographicCamera, Quaternion, Raycaster, Sprite, SpriteMaterial,
  Vector2, Vector3} from 'three';

/**
 * Helper class adding a 3D-axis visualizer in the bottom left corner.
 * @export
 */
class AxisHelper extends Object3D {
  /**
   * @param {!Camera} editorCamera camera object from the main viewer.
   * @param {!HTMLElement} container DOM element to add the axis.
   */
  constructor( editorCamera, container ) {
    super();

    this.animating = false;
    this.controls = null;

    const panel = document.createElement( 'div' );
    panel.setAttribute( 'id', 'axisHelper' );
    panel.setAttribute( 'style', 'position: absolute; right: 0px; bottom: 0px; height: 128px; width: 128px' );

    const scope = this;

    panel.addEventListener( 'pointerup', ( event ) => {
      event.stopPropagation();

      scope.handleClick( event );
    } );

    panel.addEventListener( 'pointerdown', ( event ) => {
      event.stopPropagation();
    } );

    panel.addEventListener( 'pointermove', ( event ) => {
      scope.handleMove( event );
    } );

    container.appendChild( panel );

    const color1 = new Color( '#ff3653' );
    const color2 = new Color( '#8adb00' );
    const color3 = new Color( '#2c8fff' );

    const interactiveObjects = [];
    const raycaster = new Raycaster();
    const mouse = new Vector2();
    const dummy = new Object3D();

    const camera = new OrthographicCamera( - 2, 2, 2, - 2, 0, 4 );
    camera.position.set( 0, 0, 2 );

    const geometry = new BoxGeometry( 0.8, 0.05, 0.05 ).translate( 0.4, 0, 0 );

    const getAxisMaterial = ( color ) => new MeshBasicMaterial( {color: color, toneMapped: false} );

    const xAxis = new Mesh( geometry, getAxisMaterial( color1 ) );
    const yAxis = new Mesh( geometry, getAxisMaterial( color2 ) );
    const zAxis = new Mesh( geometry, getAxisMaterial( color3 ) );

    yAxis.rotation.z = Math.PI / 2;
    zAxis.rotation.y = - Math.PI / 2;

    this.add( xAxis );
    this.add( zAxis );
    this.add( yAxis );

    const getSpriteMaterial = ( color, text = null ) => {
      const canvas = document.createElement( 'canvas' );
      canvas.width = 64;
      canvas.height = 64;

      const context = canvas.getContext( '2d' );
      context.beginPath();
      context.arc( 32, 32, 16, 0, 2 * Math.PI );
      context.closePath();
      context.fillStyle = color.getStyle();
      context.fill();

      if ( text !== null ) {
        context.font = '24px Arial';
        context.textAlign = 'center';
        context.fillStyle = '#000000';
        context.fillText( text, 32, 41 );
      }

      const texture = new CanvasTexture( canvas );

      return new SpriteMaterial( {map: texture, toneMapped: false} );
    };

    const posXAxisHelper = new Sprite( getSpriteMaterial( color1, 'X' ) );
    posXAxisHelper.userData.type = 'posX';
    const posYAxisHelper = new Sprite( getSpriteMaterial( color2, 'Y' ) );
    posYAxisHelper.userData.type = 'posY';
    const posZAxisHelper = new Sprite( getSpriteMaterial( color3, 'Z' ) );
    posZAxisHelper.userData.type = 'posZ';
    const negXAxisHelper = new Sprite( getSpriteMaterial( color1 ) );
    negXAxisHelper.userData.type = 'negX';
    const negYAxisHelper = new Sprite( getSpriteMaterial( color2 ) );
    negYAxisHelper.userData.type = 'negY';
    const negZAxisHelper = new Sprite( getSpriteMaterial( color3 ) );
    negZAxisHelper.userData.type = 'negZ';

    posXAxisHelper.position.x = 1;
    posYAxisHelper.position.y = 1;
    posZAxisHelper.position.z = 1;
    negXAxisHelper.position.x = - 1;
    negXAxisHelper.scale.setScalar( 0.8 );
    negYAxisHelper.position.y = - 1;
    negYAxisHelper.scale.setScalar( 0.8 );
    negZAxisHelper.position.z = - 1;
    negZAxisHelper.scale.setScalar( 0.8 );

    this.add( posXAxisHelper );
    this.add( posYAxisHelper );
    this.add( posZAxisHelper );
    this.add( negXAxisHelper );
    this.add( negYAxisHelper );
    this.add( negZAxisHelper );

    interactiveObjects.push( posXAxisHelper );
    interactiveObjects.push( posYAxisHelper );
    interactiveObjects.push( posZAxisHelper );
    interactiveObjects.push( negXAxisHelper );
    interactiveObjects.push( negYAxisHelper );
    interactiveObjects.push( negZAxisHelper );

    const point = new Vector3();
    const dim = 128;
    const turnRate = 2 * Math.PI; // turn rate in angles per second

    this.render = ( renderer ) => {
      this.quaternion.copy( editorCamera.quaternion ).invert();
      this.updateMatrixWorld();

      point.set( 0, 0, 1 );
      point.applyQuaternion( editorCamera.quaternion );

      if ( point.x >= 0 ) {
        posXAxisHelper.material.opacity = 1;
        negXAxisHelper.material.opacity = 0.5;
      } else {
        posXAxisHelper.material.opacity = 0.5;
        negXAxisHelper.material.opacity = 1;
      }

      if ( point.y >= 0 ) {
        posYAxisHelper.material.opacity = 1;
        negYAxisHelper.material.opacity = 0.5;
      } else {
        posYAxisHelper.material.opacity = 0.5;
        negYAxisHelper.material.opacity = 1;
      }

      if ( point.z >= 0 ) {
        posZAxisHelper.material.opacity = 1;
        negZAxisHelper.material.opacity = 0.5;
      } else {
        posZAxisHelper.material.opacity = 0.5;
        negZAxisHelper.material.opacity = 1;
      }

      //

      const x = container.offsetWidth - dim;

      renderer.clearDepth();
      renderer.setViewport( x, 0, dim, dim );
      renderer.render( this, camera );
    };

    const targetPosition = new Vector3();
    const targetQuaternion = new Quaternion();
    const targetCameraUp = new Vector3( 0, 1, 0 );

    const q1 = new Quaternion();
    const q2 = new Quaternion();
    let radius = 0;
    const p3 = new Vector3();

    const prepareAnimationData = ( object, focusPoint ) => {
      switch ( object.userData.type ) {
        case 'posX':
          targetPosition.set( 1, 0, 0 );
          targetQuaternion.setFromEuler( new Euler( 0, Math.PI * 0.5, 0 ) );
          break;

        case 'posY':
          targetPosition.set( 0, 1, 0 );
          targetQuaternion.setFromEuler( new Euler( - Math.PI * 0.5, 0, 0 ) );
          break;

        case 'posZ':
          targetPosition.set( 0, 0, 1 );
          targetQuaternion.setFromEuler( new Euler() );
          break;

        case 'negX':
          targetPosition.set( - 1, 0, 0 );
          targetQuaternion.setFromEuler( new Euler( 0, - Math.PI * 0.5, 0 ) );
          break;

        case 'negY':
          targetPosition.set( 0, - 1, 0 );
          targetQuaternion.setFromEuler( new Euler( Math.PI * 0.5, 0, 0 ) );
          break;

        case 'negZ':
          targetPosition.set( 0, 0, - 1 );
          targetQuaternion.setFromEuler( new Euler( 0, Math.PI, 0 ) );
          break;

        default:
          console.error( 'ViewHelper: Invalid axis.' );
      }

      //

      radius = editorCamera.position.distanceTo( focusPoint );
      targetPosition.multiplyScalar( radius ).add( focusPoint );

      dummy.position.copy( focusPoint );

      dummy.lookAt( editorCamera.position );
      q1.copy( dummy.quaternion );

      dummy.lookAt( targetPosition );
      q2.copy( dummy.quaternion );

      p3.copy( targetCameraUp );
      p3.sub( editorCamera.up );
    };

    this.handleClick = ( event ) => {
      if ( this.animating === true ) {
        return false;
      }

      const rect = container.getBoundingClientRect();
      const offsetX = rect.left + ( container.offsetWidth - dim );
      const offsetY = rect.top + ( container.offsetHeight - dim );
      mouse.x = ( ( event.clientX - offsetX ) / ( dim ) ) * 2 - 1;
      mouse.y = - ( ( event.clientY - offsetY ) / ( dim ) ) * 2 + 1;

      raycaster.setFromCamera( mouse, camera );

      const intersects = raycaster.intersectObjects( interactiveObjects );

      if ( intersects.length > 0 ) {
        const intersection = intersects[0];
        const object = intersection.object;

        prepareAnimationData( object, this.controls.target );

        this.animating = true;

        return true;
      }
      return false;
    };

    this.handleMove = ( event ) => {
      const rect = container.getBoundingClientRect();
      const offsetX = rect.left + ( container.offsetWidth - dim );
      const offsetY = rect.top + ( container.offsetHeight - dim );
      mouse.x = ( ( event.clientX - offsetX ) / ( dim ) ) * 2 - 1;
      mouse.y = - ( ( event.clientY - offsetY ) / ( dim ) ) * 2 + 1;

      raycaster.setFromCamera( mouse, camera );

      const intersects = raycaster.intersectObjects( interactiveObjects );

      if ( intersects.length > 0 ) {
        container.style.cursor = 'pointer';
      } else {
        container.style.cursor = null;
      }
    };

    this.update = ( delta ) => {
      const step = delta * turnRate;
      const focusPoint = this.controls.target;

      // animate position by doing a slerp and then scaling the position on the unit sphere

      q1.rotateTowards( q2, step );
      editorCamera.position.set( 0, 0, 1 ).applyQuaternion( q1 ).multiplyScalar( radius ).add( focusPoint );

      // animate orientation

      editorCamera.quaternion.rotateTowards( targetQuaternion, step );

      const d = editorCamera.up.distanceTo( targetCameraUp );
      const stepD = Math.min(1, step / d);
      editorCamera.up.addScaledVector( p3, stepD );
      p3.multiplyScalar( 1 - stepD );

      if ( q1.angleTo( q2 ) === 0 ) {
        this.animating = false;
      }
    };
  }
}

AxisHelper.prototype.isViewHelper = true;

export {AxisHelper};
