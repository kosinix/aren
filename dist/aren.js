/*
 * AREN - Accessible Responsive Nav
 * https://github.com/kosinix/aren
 *
 * Copyright 2015, Nico Amarilla
 * GPL Version 2 License.
 * http://www.gnu.org/licenses/gpl.html
 */
(function ($) {
    var timers = {},
        methods = {
        init: function (settings) {
            /* Default plugin settings */
            var defaults = {
                cssClass: {
                    nav: 'aren-nav',
                    expander: 'aren-expander',
                    showNav: 'aren-nav-show',
                    collapsed: 'aren-nav-collapsed',
                    expanded: 'aren-nav-expanded',
                    parent: 'aren-nav-parent',
                    breakout: 'aren-breakout',
                    toggle: 'aren-nav-toggle',
                    toggleActive: 'aren-toggle-active',
                    subMenu: 'aren-sub-menu'
                },
                markup: {
                    expander: '<span tabindex="0" class="%s"></span>',
                    breakout: '<div class="%s"></div>'
                },
                breakout: [
                    {
                        callback: {
                            onResize: function(css, nav){
                                nav.children('ul').children('li').each(function () {
                                    _fixExpanderHeight(css, $(this), 0); /* Adjust expander height */
                                });
                            },
                            onDocumentClick: function (e, css) {

                            },
                            onNavClick: function(e, css, nav){
                                e.stopPropagation();
                            },
                            onExpanderClick: function (e, css, expander) {
                                _expandCollapseMobile(css, expander);
                            },
                            onExpanderKeyDown: function (e, css, expander) {

                                e = e || window.event; /* Use param e if it exists. use window.event otherwise (for <=IE8) */

                                var key = e.keyCode; /* Key pressed */

                                if (13 === key || 32 == key ) { /* Enter and space key */

                                    _expandCollapseMobile(css, expander);
                                }
                            },
                            onToggleClick: function(e, css, toggle){
                                var nav = $(toggle.data('target'));
                                if (nav.hasClass(css.showNav)) { /* Nav visible, hide it */
                                    nav.removeClass(css.showNav);
                                } else { /* Nav hidden, show it */
                                    nav.addClass(css.showNav);
                                    nav.children('ul').children('li').each(function (i) {
                                        _fixExpanderHeight(settings.cssClass, $(this), 0); /* Adjust expander height */
                                    });
                                }
                                toggle.toggleClass(css.toggleActive);
                            }
                        }
                    } ,
                    {
                        callback: {
                            onResize: function(css, nav){
                                nav.children('ul').children('li').each(function (i) {
                                    _fixExpanderHeight(css, $(this), 0); /* Adjust expander height */
                                });
                            },
                            onDocumentClick: function (e, css) {
                                $('.'+css.expanded).removeClass(css.expanded);
                            },
                            onNavClick: function(e, css, nav){
                                e.stopPropagation();
                            },
                            onExpanderClick: function (e, css, expander) {
                                _expandCollapseDesktop(css, expander);
                            },
                            onExpanderKeyDown: function (e, css, expander) {

                                e = e || window.event; /* Use param e if it exists. use window.event otherwise (for <=IE8) */

                                var key = e.keyCode; /* Key pressed */

                                if (13 === key || 32 === key) { /* Enter and space key */

                                    _expandCollapseDesktop(css, expander)

                                }
                            },
                            onToggleClick: function(e, css, toggle){

                            }
                        }
                    }
                ]
            };
            settings = $.extend(true, {}, defaults, settings); /* Combine defaults and user-provided settings */

            return this.each(function () {
                var nav = $(this); /* jQuery object of our selected element */

                /* Add nav class */
                nav.addClass(settings.cssClass.nav);

                nav.children('ul').children('li').each(function (i) {
                    _listItemInit(settings, $(this), 0); /* Initialize each <li> element */
                });

                nav.append(settings.markup.breakout.replace('%s', settings.cssClass.breakout)); /* Add breakout markup to nav */

                /* User interaction */
                $(document).on('click', function(e){

                    settings.breakout[$.fn.arenBreakout].callback.onDocumentClick(e, settings.cssClass);

                }).on('click', '.' + settings.cssClass.nav, function (e) { /* Do not close sub nav if aren-nav was clicked */

                    settings.breakout[$.fn.arenBreakout].callback.onNavClick(e, settings.cssClass);

                }).on('click', '.' + settings.cssClass.expander, function (e) { /* Expand/collapse sub nav */

                    settings.breakout[$.fn.arenBreakout].callback.onExpanderClick(e, settings.cssClass, $(this));

                }).on('keydown', '.' + settings.cssClass.expander, function (e) { /* Expand/collapse sub nav with keyboard */

                    settings.breakout[$.fn.arenBreakout].callback.onExpanderKeyDown(e, settings.cssClass, $(this));

                }).on('click', '.' + settings.cssClass.toggle, function (e) {

                    settings.breakout[$.fn.arenBreakout].callback.onToggleClick(e, settings.cssClass, $(this));

                });

                /* Do something on browser resize */
                $(window).on('resize', function(){
                    /* Limit firing of resize */
                    _waitForFinalEvent(function(){
                        $.fn.arenBreakout = _currentBreakout(nav, settings);
                        settings.breakout[$.fn.arenBreakout].callback.onResize(settings.cssClass, nav);
                    }, 100, "aren");
                });
                $.fn.arenBreakout = _currentBreakout(nav, settings);
            });
        }
    };


    /* Initialize list item */
    function _listItemInit(settings, currentListItem, level) {
        var subNav = currentListItem.children('ul'),
            anchor = currentListItem.children('a');

        if (subNav.length > 0) {
            subNav.addClass(settings.cssClass.subMenu); /* Add sub menu class */
            currentListItem.addClass(settings.cssClass.parent); /* Add parent class to item */
            if (subNav.is(':visible')) {
                currentListItem.addClass(settings.cssClass.expanded);
            } else {
                currentListItem.addClass(settings.cssClass.collapsed);
            }
            anchor.after(settings.markup.expander.replace('%s', settings.cssClass.expander)); /* Add expander after <a> */
            _fixExpanderHeight(settings.cssClass, currentListItem); /* Fix expander height */
            /* Initialize children items recursively */
            subNav.children('li').each(function (i) {
                _listItemInit(settings, $(this), ++level);
            });

        }
    }

    /* Fix expander height base on its neighboring <a> height */
    function _fixExpanderHeight(css, currentListItem) {
        var subNav = currentListItem.children('ul'),
            anchor = currentListItem.children('a');

        if (subNav.length > 0 && anchor.outerHeight() > 0) {
            currentListItem.children('.' + css.expander).height(anchor.outerHeight());
        }
    }

    /* Expand or collapse on mobile */
    function _expandCollapseMobile(css, expander) {

        var subNav = expander.siblings('ul'),
            listItem = expander.parent();

        if (subNav.is(':visible')) { /* If visible, hide it */
            listItem.removeClass(css.expanded).addClass(css.collapsed); /* Update parent classes */
        } else { /* If hidden, show it */
            listItem.removeClass(css.collapsed).addClass(css.expanded); /* Update parent classes */
        }
    }

    /* Expand or collapse on desktop */
    function _expandCollapseDesktop(css, expander) {
        var subNav = expander.siblings('ul'),
            listItem = subNav.parent();

        if (subNav.is(':visible')) { /* If visible, hide it */
            /* Collapse current list */
            listItem.removeClass(css.expanded)
                .addClass(css.collapsed);
            /* Collapse all expanded children */
            subNav.find('.'+css.expanded)
                .removeClass(css.expanded)
                .addClass(css.collapsed);
        } else { /* Show subNav. Use CSS */
            listItem.removeClass(css.collapsed)
                .addClass(css.expanded);
            /* Expand it */
            listItem.siblings('.'+css.expanded).each(function(i, el){
                $(el).removeClass(css.expanded)
                    .addClass(css.collapsed)
                    .find('.'+css.expanded)
                    .removeClass(css.expanded)
                    .addClass(css.collapsed);
            })
        }
    }

    /* Get current breakout from HTML */
    function _currentBreakout(nav, settings){
        return nav.find('.'+settings.cssClass.breakout).width();
    }

    /* Wait on resize done */
    function _waitForFinalEvent (callback, ms, uniqueId) {
        if (!uniqueId) {
            uniqueId = "Don't call this twice without a uniqueId";
        }
        if (timers[uniqueId]) {
            clearTimeout (timers[uniqueId]);
        }
        timers[uniqueId] = setTimeout(callback, ms);
    }

    /* Plugin main */
    $.fn.aren = function (method) {

        /* Method calling logic */
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        }
        return false;
    };

    /* Always start at 0 */
    $.fn.arenBreakout = 0;

})(jQuery);



