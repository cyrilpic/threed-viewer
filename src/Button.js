class Button {
  constructor( name, action, icon, iconSelected ) {
    this.name = name;
    this.action = action;
    this.icon = icon;
    this.iconSelected = iconSelected;

    this.dom = document.createElement( 'a' );
    this.dom.setAttribute( 'class', 'nav-link' );
    this.dom.setAttribute( 'data-action', this.name );
    this.dom.setAttribute( 'href', '#' );
    this.dom.innerHTML = this.icon;
    this.dom.setAttribute( 'data-bs-toggle', 'tooltip' );
    this.dom.setAttribute( 'title', this.name );
    this.state = false;

    const scope = this;
    this.dom.addEventListener( 'click', (e) => {
      if ( scope.iconSelected !== undefined ) {
        if ( scope.state === false ) {
          scope.dom.innerHTML = scope.iconSelected;
          scope.state = true;
        } else {
          scope.dom.innerHTML = scope.icon;
          scope.state = false;
        }
      }

      scope.action( this.name, e );

      e.stopPropagation();
      e.preventDefault();
    }, false );
  }
};

export {Button};
