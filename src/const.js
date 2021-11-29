// Some constants to handle AR

const HAS_AR_QUICKLOOK = (() => {
  const a = document.createElement('a');

  return (a.relList && a.relList.supports && a.relList.supports('ar'));
})();

const HAS_WEBXR = (() => {
  return (navigator.xr != null && navigator.xr.isSessionSupported != null);
})();

export {HAS_AR_QUICKLOOK, HAS_WEBXR};
