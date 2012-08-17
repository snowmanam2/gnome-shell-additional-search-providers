//   Web search provider for gnome shell
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

let WSearchProvider = null;

function WebSearchProvider() {
    this._init();
}


WebSearchProvider.prototype = {
    __proto__: Search.SearchProvider.prototype,

    _init: function(name) {
        Search.SearchProvider.prototype._init.call(this, "WEB LOCATIONS");

        return true;
    },

    getResultMetas: function(resultIds) {

        let metas = [];
        
        let resultId = resultIds[0];

        let appSys = Shell.AppSystem.get_default();
        let app = appSys.lookup_heuristic_basename('firefox.desktop');

        metas.push({ 'id': resultId,
                     'name': resultId.name,
                     'createIcon': function(size) {
                            let xicon = new Gio.ThemedIcon({name: 'firefox'});
                            return new St.Icon({icon_size: size, gicon: xicon});
                   }
        });
        return metas;
    },

    activateResult: function(id) {
        Util.spawn(['/usr/bin/firefox', '--new-tab', id.name]);
    },

    getInitialResultSet: function(terms) {
        // check if a found host-name begins like the search-term
        let searchResults = [];
        
        if (terms[0].indexOf("www") == 0 || terms[0].indexOf("http") == 0 || terms[0].match(/[.]/g) != null)
        {
            searchResults.push({
                'name': terms[0]
            });
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
    if (WSearchProvider==null) {
        WSearchProvider = new WebSearchProvider();
        Main.overview.addSearchProvider(WSearchProvider);
    }
}

function disable() {
    if (WSearchProvider!=null) {
        Main.overview.removeSearchProvider(WSearchProvider);
        WSearchProvider = null;
    }

}

