class Button {
  constructor( name, action, icon, iconSelected, description ) {
    this.name = name;
    this.action = action;
    this.icon = icon;
    this.iconSelected = iconSelected;

    this.dom = document.createElement( 'a' );
    this.dom.setAttribute( 'data-action', this.name );
    this.dom.setAttribute( 'href', '#' );
    this.dom.innerHTML = this.icon;
    this.dom.setAttribute( 'title', this.name );
    this.state = false;

    if ( description !== undefined ) {
      this.dom.setAttribute( 'aria-label', description );
      this.dom.setAttribute( 'role', 'tooltip' );
      this.dom.setAttribute( 'data-microtip-position', 'right' );
    }

    const scope = this;
    this.dom.addEventListener( 'click', (e) => {
      scope.toggle();

      scope.action( this.name, e );

      e.stopPropagation();
      e.preventDefault();
    }, false );
  }

  toggle( target ) {
    if ( this.iconSelected !== undefined ) {
      if ( target !== undefined ) {
        this.state = target;
      } else {
        this.state = !this.state;
      }
      if ( this.state === false ) {
        this.dom.innerHTML = this.icon;
      } else {
        this.dom.innerHTML = this.iconSelected;
      }
    }
  }
};

export {Button};
