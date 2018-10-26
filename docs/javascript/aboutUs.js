window.onscroll = function() {
    var navbar = document.querySelector('nav');
    var sticky = navbar.offsetTop;
    (() => {
        if (window.pageYOffset > sticky) {
            navbar.classList.add('following');
            navbar.querySelector('.ui.massive.borderless.menu').classList.add('inverted');
        } else {
            navbar.classList.remove('following');
            navbar.querySelector('.ui.massive.borderless.menu').classList.remove('inverted');
        }
    })();
}