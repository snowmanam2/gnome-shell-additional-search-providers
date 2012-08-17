//   Volume search provider for gnome shell
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

let VSearchProvider = null;

function VolumeSearchProvider() {
    this._init();
}


VolumeSearchProvider.prototype = {
    __proto__: Search.SearchProvider.prototype,

    _init: function(name) {
        Search.SearchProvider.prototype._init.call(this, "UNMOUNTED VOLUMES");

        this._mountsUpdatedId = Main.placesManager.connect('mounts-updated',
            Lang.bind(this,function() {
                this._volumes = this._getVolumes();
            }
        ));

        this._volumes = this._getVolumes();

        return true;
    },

    destroy: function () {
        Main.placesManager.disconnect (this._mountsUpdatedId); 
    },

    _getVolumes: function () {
        let vol = [];
        
        let vm = Gio.VolumeMonitor.get();
        
        let drives = vm.get_connected_drives();
        
        for (let i = 0; i < drives.length; i++) {
            let volumes = drives[i].get_volumes();
            for (let j = 0; j < volumes.length; j++) {
                if (volumes[j].can_mount()) {
                    vol.push(volumes[j]);
                }
            }
        }
        
        return vol;
    },
    
    _mountVolume: function(volume) {
        volume.mount(0, null, null,
                     Lang.bind(this, this._onVolumeMounted));
    },
    
    _onVolumeMounted: function (volume, res) {

        try {
            volume.mount_finish(res);
            let launcher = new PlaceDisplay.PlaceDeviceInfo(volume.get_mount());
            launcher.launch();
        } catch (e) {
            let string = e.toString();

            if (string.indexOf('No key available with this passphrase') != -1)
                this._reaskPassword(volume);
            else
                log('Unable to mount volume ' + volume.get_name() + ': ' + string);
        }
    },

    getResultMetas: function(resultIds) {

        let metas = [];
        
        for (var i = 0; i < resultIds.length; i++)
        {
            let resultId = resultIds[i];

            metas.push({ 'id': resultId,
                     'name': resultId.volume.get_name(),
                     'createIcon': Lang.bind(resultId,function(size) {
                            let gicon = this.volume.get_icon();
                            return St.TextureCache.get_default().load_gicon(null, gicon, size);})
            });
        }
        
        return metas;
    },

    activateResult: function(id) {
        this._mountVolume (id.volume);
    },

    getInitialResultSet: function(terms) {
        // check if a found host-name begins like the search-term
        let searchResults = [];
        
        for (var i = 0; i < this._volumes.length; i++)
        {
            let searchString = this._volumes[i].get_drive().get_name() + " : " + this._volumes[i].get_name();
            let ismatch = false;
            
            for (var j = 0; j < terms.length; j++)
            {
                if (searchString.toUpperCase().match(terms[j].toUpperCase()) != null)
                {
                    ismatch = true;
                }
            }
            
            if (ismatch && this._volumes[i].get_mount() == null)
            {
                searchResults.push({"volume": this._volumes[i]});
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
    if (VSearchProvider==null) {
        VSearchProvider = new VolumeSearchProvider();
        Main.overview.addSearchProvider(VSearchProvider);
    }
}

function disable() {
    if (VSearchProvider!=null) {
        Main.overview.removeSearchProvider(VSearchProvider);
        VSearchProvider.destroy();
        VSearchProvider = null;
    }

}

