//   Recent items search provider for gnome shell
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
const Gtk = imports.gi.Gtk;

let RSearchProvider = null;

function RecentSearchProvider() {
    this._init();
}


RecentSearchProvider.prototype = {
    __proto__: Search.SearchProvider.prototype,

    _init: function(name) {
        Search.SearchProvider.prototype._init.call(this, "RECENT ITEMS");

        this._recentManager = Gtk.RecentManager.get_default();

        return true;
    },

    destroy: function () {
    },
    
    getResultMetas: function(resultIds) {

        let metas = [];
        
        for (var i = 0; i < resultIds.length; i++)
        {
            let resultId = resultIds[i];

            metas.push({ 'id': resultId,
                     'name': resultId.item.get_display_name(),
                     'createIcon': Lang.bind(resultId,function(size) {
                            let icon = Shell.util_get_icon_for_uri(this.item.get_uri());
                            return St.TextureCache.get_default().load_gicon(null, icon, size);})
            });
        }
        
        return metas;
    },

    activateResult: function(id) {
        Gio.app_info_launch_default_for_uri(id.item.get_uri(), global.create_app_launch_context());
    },

    getInitialResultSet: function(terms) {
        // check if a found host-name begins like the search-term
        let searchResults = [];
        
        let items = this._recentManager.get_items();
        
        for (var i = 0; i < items.length; i++)
        {
            let searchString = items[i].get_uri();
            let ismatch = false;
            
            for (var j = 0; j < terms.length; j++)
            {
                if (searchString.toUpperCase().match(terms[j].toUpperCase()) != null)
                {
                    ismatch = true;
                }
                
                if ("recent" == terms[j])
                {
                    ismatch = true;
                }
            }
            
            if (ismatch) searchResults.push({"item": items[i]});
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
        RSearchProvider = new RecentSearchProvider();
        Main.overview.addSearchProvider(RSearchProvider);
    }
}

function disable() {
    if (RSearchProvider!=null) {
        Main.overview.removeSearchProvider(RSearchProvider);
        RSearchProvider = null;
    }

}

