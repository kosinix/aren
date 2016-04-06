/*
 * AREN - Accessible Responsive Nav
 * https://github.com/kosinix/aren
 *
 * Copyright 2015, Nico Amarilla
 * License: GPLv3
 * http://www.gnu.org/licenses/gpl-3.0.txt
 */
(function ($) {
    var timers = {},
        eventAttached = false, /* Flag if events are added */
        currentBreakout = 0, /* Default breakout */
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
                        expander: '<button class="%s" aria-haspopup="true" aria-expanded="false"></button>',
                        breakout: '<div class="%s"></div>'
                    },
                    breakout: [
                        {
                            callback: {
                                onResize: function(css, nav){

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
                                    }
                                    toggle.toggleClass(css.toggleActive);
                                }
                            }
                        } ,
                        {
                            callback: {
                                onResize: function(css, nav){

                                },
                                onDocumentClick: function (e, css) {
                                    $('.'+css.expanded).removeClass(css.expanded).find('.'+css.expander).attr('aria-expanded','false');
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
                                        e.preventDefault(); /* Prevent default button actions */
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

                    nav.data('aren.settings', settings); /* Save settings per instance on nav */

                    /* Save settings per instance on expanders */
                    nav.find('.' + settings.cssClass.expander).each(function (i) {
                        $(this).data('aren.settings', settings);
                    });

                    /* Attached our events once */
                    if(!eventAttached) {
                        $(document).on('click.aren', function (e) {
                            // TODO: Refactor
                            settings.breakout[_currentBreakout(nav, settings)].callback.onDocumentClick(e, settings.cssClass);

                        }).on('click.aren', '.' + settings.cssClass.nav, function (e) { /* Do not close sub nav if aren-nav was clicked */
                            var nav = $(this),
                                s = nav.data('aren.settings');
                            s.breakout[_currentBreakout(nav, s)].callback.onNavClick(e, s.cssClass);

                        }).on('click.aren', '.' + settings.cssClass.expander, function (e) { /* Expand/collapse sub nav */
                            var s = $(this).data('aren.settings'),
                                nav = $(this).parents('.' + s.cssClass.nav);

                            s.breakout[_currentBreakout(nav, settings)].callback.onExpanderClick(e, s.cssClass, $(this));

                        }).on('keydown.aren', '.' + settings.cssClass.expander, function (e) { /* Expand/collapse sub nav with keyboard */
                            var s = $(this).data('aren.settings'),
                                nav = $(this).parents('.' + s.cssClass.nav);

                            s.breakout[_currentBreakout(nav, settings)].callback.onExpanderKeyDown(e, s.cssClass, $(this));

                        }).on('click.aren', '.' + settings.cssClass.toggle, function (e) {
                            var nav = $( $(this).attr('data-target')),
                                s = nav.data('aren.settings');

                            s.breakout[_currentBreakout(nav, s)].callback.onToggleClick(e, s.cssClass, $(this));

                        });

                        /* Do something on browser resize */
                        $(window).on('resize.aren', function () {
                            /* Limit firing of resize */
                            _waitForFinalEvent(function () {
                                currentBreakout = _currentBreakout(nav, settings);
                                settings.breakout[currentBreakout].callback.onResize(settings.cssClass, nav);
                            }, 100, "aren");
                        });
                        currentBreakout = _currentBreakout(nav, settings);

                        eventAttached = true;
                    }
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
            expander.attr('aria-expanded', 'false');
        } else { /* If hidden, show it */
            listItem.removeClass(css.collapsed).addClass(css.expanded); /* Update parent classes */
            expander.attr('aria-expanded', 'true');
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
            expander.attr('aria-expanded', 'false');

            /* Collapse all expanded children */
            subNav.find('.'+css.expanded)
                .removeClass(css.expanded)
                .addClass(css.collapsed)
                .find('.'+css.expander).attr('aria-expanded', 'false');

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

            });
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

})(jQuery);



