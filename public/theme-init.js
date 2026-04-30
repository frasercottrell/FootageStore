(function () {
  var t = localStorage.getItem("fg-theme") || "light";
  document.documentElement.setAttribute("data-theme", t);
})();
