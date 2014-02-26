var searchString = '';
var hideWatched = 0;

var movieLoad = {
    last: 0,
    request: null,
    limit: 50,
    options: null
}

$(document).ready(function() {

    // Load data on tab display
    $('a[data-toggle=\'tab\']').click(function(e) {
        $('#search').val('');
        searchString = '';
    }).on('shown', reloadTab);
    $(window).trigger('hashchange')

     // Load more titles on scroll
    $(window).scroll(function() {
        if($(window).scrollTop() + $(window).height() >= $(document).height() - 10) {
            reloadTab();
        }
    });
    playerLoader = setInterval('loadNowPlaying()', 5000);

});

function loadMovies(options) {
    var optionstr = JSON.stringify(options) + hideWatched;
    if (movieLoad.options != optionstr) {
        movieLoad.last = 0;
        $('#movie-grid').empty();
    }
    movieLoad.options = optionstr;

    var active = (movieLoad.request != null && movieLoad.request.readyState != 4);
    if (active || movieLoad.last == -1) return;

    var sendData = {
        start: movieLoad.last,
        end: (movieLoad.last + movieLoad.limit),
    };

    $.extend(sendData, options);

    $('.spinner').show();
    movieLoad.request = $.ajax({
        url: WEBDIR + 'plex/GetMovies',
        type: 'get',
        data: sendData,
        dataType: 'json',
        success: function (data) {
            var parsedJson = JSON.parse(data);
            if (parsedJson === null) return errorHandler();

            movieLoad.last += movieLoad.limit;

            if (parsedJson.limits.end == parsedJson.limits.total) {
                movieLoad.last = -1;
            } else {
                movieLoad.last += movieLoad.limit;
            }

            if (parsedJson.movies != undefined) {
                $.each(parsedJson.movies, function (i, movie) {
                    var movieItem = $('<li>').attr('title', movie.title);

                    var movieAnchor = $('<a>').attr('href', '#').click(function(e) {
                        e.preventDefault();
                        loadMovie(movie);
                    });

                    var src = 'holder.js/100x150/text:No artwork';
                    if (movie.thumbnail != undefined) {
                        src = WEBDIR + 'plex/GetThumb?w=100&h=150&thumb='+encodeURIComponent(movie.thumbnail);
                    }
                    movieAnchor.append($('<img>').attr('src', src).addClass('thumbnail'));

                    if (movie.playcount >= 1) {
                        movieAnchor.append($('<i>').attr('title', 'Watched').addClass('icon-white icon-ok-sign watched'));
                    }

                    movieAnchor.append($('<h6>').addClass('title').html(shortenText(movie.title, 12)));

                    movieItem.append(movieAnchor);

                    $('#movie-grid').append(movieItem);
                });
            }
            Holder.run();
        },
        complete: function() {
            $('.spinner').hide();
        }
    });
}

function loadMovie(movie) {
    var poster = WEBDIR + 'plex/GetThumb?w=200&h=300&thumb='+encodeURIComponent(movie.thumbnail)
    var info = $('<div>').addClass('modal-movieinfo');
    if (movie.runtime) {
    info.append($('<p>').html('<b>Runtime:</b> ' + movie.runtime + ' min'));
    }
    if (movie.plot) {
    info.append($('<p>').html('<b>Plot:</b> ' + movie.plot));
    }
    if (movie.genre) {
        info.append($('<p>').html('<b>Genre:</b> ' + movie.genre));
    }
    if (movie.studio) {
        info.append($('<p>').html('<b>Studio:</b> ' + movie.studio));
    }
    if (movie.rating) {
        info.append($('<span>').raty({
            readOnly: true,
            path: WEBDIR + 'img',
            score: (movie.rating / 2),
        }));
    }
    var buttons = {

    }
    showModal(movie.title + ' ('+movie.year+')', $('<div>').append(
        $('<img>').attr('src', poster).addClass('thumbnail movie-poster pull-left'),
        info
    ), buttons);
    $('.modal-fanart').css({
        'background-image' : 'url('+WEBDIR+'plex/GetThumb?w=675&h=400&o=10&thumb='+encodeURIComponent(movie.fanart)+')'
    });
}


var showLoad = {
    last: 0,
    request: null,
    limit: 50,
    options: null
};
var currentShow = null;

function loadShows(options) {
    console.log("Loading shows");
    var optionstr = JSON.stringify(options) + hideWatched;
    if (showLoad.options != optionstr) {
        showLoad.last = 0;
        $('#show-grid').empty();
    }
    showLoad.options = optionstr;

    var active = (showLoad.request!=null && showLoad.request.readyState!=4);
    if (active || showLoad.last == -1) return;

    var sendData = {
        start: showLoad.last,
        end: (showLoad.last + showLoad.limit)
    };
    $.extend(sendData, options);

    $('.spinner').show();
    showLoad.request = $.ajax({
        url: WEBDIR + 'plex/ListShows',
        type: 'get',
        data: sendData,
        dataType: 'json',
        success: function (data) {
            data = JSON.parse(data);
            if (data === null) return errorHandler();

            if (data.limits.end == data.limits.total) {
                showLoad.last = -1;
            } else {
                showLoad.last += showLoad.limit;
            }

            if (data.tvShows !== undefined) {
                $.each(data.tvShows, function (i, show) {
                    var showItem = $('<li>').attr('title', show.title);

                    var showAnchor = $('<a>').attr('href', '#').click(function(e) {
                        e.preventDefault();
                        loadEpisodes({'tvshowid':show.tvshowid})
                    });

                    var src = 'holder.js/100x150/text:No artwork';
                    if (show.thumbnail != '') {
                        src = WEBDIR + 'plex/GetThumb?w=100&h=150&thumb='+encodeURIComponent(show.thumbnail);
                    }
                    showAnchor.append($('<img>').attr('src', src).addClass('thumbnail'));

                    if (show.playcount >= 1) {
                        showAnchor.append($('<i>').attr('title', 'Watched').addClass('icon-white icon-ok-sign watched'));
                    }

                    showAnchor.append($('<h6>').addClass('title').html(shortenText(show.title, 11)));

                    showItem.append(showAnchor);

                    $('#show-grid').append(showItem);
                });
            }
            Holder.run();
        },
        complete: function() {
            $('.spinner').hide();
        }
    });
}

var episodeLoad = {
    last: 0,
    request: null,
    limit: 50,
    options: null
}
var currentShow = null;
function loadEpisodes(options) {
    currentShow = options.tvshowid;
    var optionstr = JSON.stringify(options) + hideWatched;
    if (episodeLoad.options != optionstr) {
        episodeLoad.last = 0;
        $('#episode-grid').empty();
    }
    episodeLoad.options = optionstr;

    var active = (episodeLoad.request!=null && episodeLoad.request.readyState!=4);
    if (active || episodeLoad.last == -1) return;

    var sendData = {
        start: episodeLoad.last,
        end: (episodeLoad.last + episodeLoad.limit),
        hidewatched: hideWatched
    }
    $.extend(sendData, options);

    $('.spinner').show();
    episodeLoad.request = $.ajax({
        url: WEBDIR + 'plex/GetEpisodes',
        type: 'get',
        data: sendData,
        dataType: 'json',
        success: function (data) {
            data = JSON.parse(data);
            if (data==null || data.limits.total==0) return errorHandler();

            if (data.limits.end == data.limits.total) {
                episodeLoad.last = -1;
            } else {
                episodeLoad.last += episodeLoad.limit;
            }

            if (data.episodes != undefined) {
                $.each(data.episodes, function (i, episode) {
                    var episodeItem = $('<li>').attr('title', episode.plot);

                    var episodeAnchor = $('<a>').attr('href', '#').click(function(e) {
                        e.preventDefault();
                        playItem(episode.episodeid, 'episode');
                    });

                    var src = 'holder.js/150x85/text:No artwork';
                    if (episode.thumbnail != '') {
                        src = WEBDIR + 'plex/GetThumb?w=150&h=85&thumb='+encodeURIComponent(episode.thumbnail);
                    }
                    episodeAnchor.append($('<img>').attr('src', src).addClass('thumbnail'));

                    if (episode.playcount >= 1) {
                        episodeAnchor.append($('<i>').attr('title', 'Watched').addClass('icon-white icon-ok-sign watched'));
                    }

                    episodeAnchor.append($('<h6>').addClass('title').html(shortenText(episode.label, 18)));

                    episodeItem.append(episodeAnchor);

                    $('#episode-grid').append(episodeItem);
                });
            }
            Holder.run();
        },
        complete: function() {
            $('.spinner').hide();
            $('a[href=#episodes]').tab('show');
        }
    });
    $('#episode-grid').slideDown()
}

var nowPlayingId = false
function loadNowPlaying() {
    $.ajax({
        url: WEBDIR + 'plex/NowPlaying',
        type: 'get',
        dataType: 'json',
        success: function(data) {
            data = JSON.parse(data);
            if (data.playing_items.length == 0) {
                $('#nowplaying').hide();
                $('a[href=#playlist]').parent().hide();
                return;
            }
            if (data.playing_items.length !== 0) {
                $.each(data.playing_items, function (i, item) {
                                var nowPlayingThumb = encodeURIComponent(item.thumbnail);
                var thumbnail = $('#nowplaying .thumb img').attr('alt', item.label);
                if (nowPlayingThumb == '') {
                    thumbnail.attr('src', 'holder.js/140x140/text:No artwork');
                    thumbnail.attr('width', '140').attr('height', '140');
                    Holder.run();
                } else {
                    switch(item.type) {
                        case 'episode':
                            thumbnail.attr('src', WEBDIR + 'plex/GetThumb?w=150&h=75&thumb='+nowPlayingThumb);
                            thumbnail.attr('width', '150').attr('height', '75');
                            break;
                        case 'movie':
                            thumbnail.attr('src', WEBDIR + 'plex/GetThumb?w=100&h=150&thumb='+nowPlayingThumb);
                            thumbnail.attr('width', '100').attr('height', '150');
                            break;
                        default:
                            thumbnail.attr('src', WEBDIR + 'plex/GetThumb?w=140&h=140&thumb='+nowPlayingThumb);
                            thumbnail.attr('width', '140').attr('height', '140');
                    }
                }
                    //console.log(item)
                    var itemTime = $('#nowplaying #player-item-time').html((item.viewOffset/1000).toString().toHHMMSS() + ' / ' + (item.duration/1000).toString().toHHMMSS());
                    var itemTitel = $('#nowplaying #player-item-title')
                    var itemSubtitel = $('#nowplaying #player-item-subtitle')
                    var playingTitle = '';
                    var playingSubtitle = '';
            if (item.type == 'episode') {
                playingTitle = item.show;
                playingSubtitle = item.title + ' ' +
                                  item.season + 'x' +
                                  item.episode;
            }
            else if (item.type == 'movie') {
                playingTitle = item.title;
                playingSubtitle  = item.year;
            } else {
                playingTitle = item.title;
            }
            itemTitel.html(playingTitle);
            itemSubtitel.html(playingSubtitle);
            
            var progressBar = $('#nowplaying #player-progressbar .bar');
            progressBar.css('width', (item.viewOffset / item.duration)*100 + '%');
        });
                 $('#nowplaying').slideDown();
    }
}
});
}



function reloadTab() {
    var options = {};

    if ($('#movies').is(':visible')) {
        loadMovies(options);
    } else if ($('#shows').is(':visible')) {
        loadShows(options);
    } else if ($('#episodes').is(':visible')) {
        options = $.extend(options, {'tvshowid': currentShow});
        loadEpisodes(options);
}
}

function hideWatched() {

}

function errorHandler() {
    $('.spinner').hide();
    notify('Error','Error connecting to Plex','error');
    moviesLoading = false;
    return false;
}


String.prototype.toHHMMSS = function () {
    var sec_num = parseInt(this, 10); // don't forget the second param
    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    var time    = hours+':'+minutes+':'+seconds;
    return time;
}