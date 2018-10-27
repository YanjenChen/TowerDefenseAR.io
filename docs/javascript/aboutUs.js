$(() => {
    $('#sidebar-icon').click(() => {
        $('.ui.sidebar').sidebar('toggle');
    });
});

window.onload = () => {
    $('.ui.dimmer').removeClass('active');
    $('body').removeClass('loading');
};

window.onscroll = () => {
    if (window.pageYOffset > 0) {
        $('.bar').addClass('following');
        $('.bar .ui.massive.menu').addClass('inverted');
    } else {
        $('.bar').removeClass('following');
        $('.bar .ui.massive.menu').removeClass('inverted');
    }
}