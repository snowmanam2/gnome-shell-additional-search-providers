//   Remote locations search provider for gnome shell
//   Bill Smith <snowmanam2@gmail.com>
//
//   This library is free software; you can redistribute it and/or
//   modify it under the terms of the GNU Library General Public
//   License as published by the Free Software Foundation; either
//   version 2 of the License, or (at your option) any later version.
//
//   This library is distributed in the hope that it will be useful,
//   but WITHOUT ANY WARRANTY; without even the implied warranty of
//   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
//   Library General Public License for more details.
//
//   You should have received a copy of the GNU Library General Public
//   License along with this library; if not, write to the Free Software
//   Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA

const Main = imports.ui.main;
const Search = imports.ui.search;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Lang = imports.lang;
const Shell = imports.gi.Shell;
const Util = imports.misc.util;
const St = imports.gi.St;
const PlaceDisplay = imports.ui.placeDisplay;

let RSearchProvider = null;

function RemoteSearchProvider() {
    this._init();
}


RemoteSearchProvider.prototype = {
    __proto__: Search.SearchProvider.prototype,

    _init: function(name) {
        Search.SearchProvider.prototype._init.call(this, "REMOTE LOCATIONS");

        let bookmarksPath = GLib.build_filenamev([GLib.get_home_dir(), '.gtk-bookmarks']);
        let bookmarksFile = Gio.file_new_for_path(bookmarksPath);
        this._mon = bookmarksFile.monitor_file(0, null);
        this._monChangedId = this._mon.connect("changed", 
            Lang.bind(this,function(){this._places = this._getBookmarks();}));

        this._places = this._getBookmarks();

        return true;
    },

    destroy: function () {
        this._mon.disconnect(this._monChangedId);
        this._mon.cancel();
    },

    _getBookmarks : function() {
        let bookmarksPath = GLib.build_filenamev([GLib.get_home_dir(), '.gtk-bookmarks']);
        let bookmarksFile = Gio.file_new_for_path(bookmarksPath);
        
        let bookmarks = [];

        if (!GLib.file_test(bookmarksPath, GLib.FileTest.EXISTS))
            return [];

        let bookmarksContent = Shell.get_file_contents_utf8_sync(bookmarksPath);

        let bookmarks = bookmarksContent.split('\n');

        let bookmarksToLabel = {};
        let bookmarksOrder = [];
        
        let book_places = [];
        for (let i = 0; i < bookmarks.length; i++) {
            let bookmarkLine = bookmarks[i];
            let components = bookmarkLine.split(' ');
            let bookmark = components[0];
            let label = null;
            if (components.length > 1) label = components.slice(1).join(' ');

            if (label == null)
                label = Shell.util_get_label_for_uri(bookmark);
            if (label == null)
                label = bookmark;
            
            if (bookmark == "") continue;
            
            if (bookmark.substring(0,4) != 'file') {
                let icon = Shell.util_get_icon_for_uri("network:///");
                let item = new PlaceDisplay.PlaceInfo('bookmark:' + bookmark, label,
                function(size) {
                    return St.TextureCache.get_default().load_gicon(null, icon, size);
                },
                function(params) {
                    GLib.spawn_command_line_async ("nautilus "+bookmark);
                });
                book_places.push(item);
            }
        }
        
        //global.log ("length: "+book_places.length);
        
        return book_places;
    },

    getResultMetas: function(resultIds) {

        let metas = [];
        
        for (var i = 0; i < resultIds.length; i++)
        {
            let resultId = resultIds[i];

            metas.push({ 'id': resultId,
                     'name': resultId.place.name,
                     'createIcon': function(size) {
                                 let icon = Shell.util_get_icon_for_uri("network:///");
                                 return St.TextureCache.get_default().load_gicon(null, icon, size);
                             }
            });
        }
            
        return metas;
    },

    activateResult: function(id) {
        id.place.launch();
    },

    getInitialResultSet: function(terms) {
        // check if a found host-name begins like the search-term
        let searchResults = [];
        
        for (var i = 0; i < this._places.length; i++)
        {
            let ismatch = false;
            for (var j = 0; j < terms.length; j++)
            {
                if (this._places[i].name.toUpperCase().match(terms[j].toUpperCase()) != null)
                {
                    ismatch = true;
                }
            }
            
            if (ismatch) 
            { 
                searchResults.push({ 'place': this._places[i]
                });
                global.log("match");
            }
        }

        return searchResults;
    },

    getSubsearchResultSet: function(previousResults, terms) {
        return this.getInitialResultSet(terms);
    }
};

function init(meta) {
}

function enable() {
    if (RSearchProvider==null) {
        RSearchProvider = new RemoteSearchProvider();
        Main.overview.addSearchProvider(RSearchProvider);
    }
}

function disable() {
    if (RSearchProvider!=null) {
        Main.overview.removeSearchProvider(RSearchProvider);
        RSearchProvider.destroy();
        RSearchProvider = null;
    }

}

