'use strict';

const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');
const parser = xml2js.parseString;

const folder = './KML/';
const pathTofolder = path.join(__dirname, folder);

// https://nodejs.org/api/fs.html#fs_fs_readdirsync_path_options
fs.readdirSync(folder).forEach(file => {

    if (file.includes('.kml')) {
        // https://nodejs.org/api/fs.html#fs_fs_readfile_path_options_callback
        fs.readFile(`${pathTofolder}${file}`, 'utf8', (err, data) => {
            if (err) throw err;

            // Start of the file
            let content = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<gpx version="1.1" creator="OsmAnd" xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">\n'

            parser(data, (err, result) => {
                if (err) throw err;

                result.kml.Document[0].Placemark.forEach(elem => {

                    let coordinatesToLatLon = (coordinates) => {
                        let array = coordinates.split(',');
                        // Lat = 1, Lon = 0
                        return array
                    };

                    let styleToColor = (style) => {
                        if (style == '#placemark-brown') {
                            // OsmAnd Magenta
                            return '#9c27b0'
                        } else if (style == '#placemark-green') {
                            // OsmAmd Green
                            return '#3f51b5'
                        } else if (style == '#placemark-orange') {
                            // OsmAmd Orange
                            return '#ff5722'
                        } else if (style == '#placemark-pink') {
                            // OsmAmd Gray
                            return '#607d8b'
                        } else if (style == '#placemark-purple') {
                            // OsmAmd Purple
                            return '#3f51b5'
                        } else if (style == '#placemark-red') {
                            // OsmAnd Red
                            return '#e91e63'
                        } else if (style == '#placemark-yellow') {
                            // OsmAnd Yellow
                            return '#ffb300'
                        } else {
                            // OsmAnd Blue
                            return '#2196f3'
                        }
                    };

                    const placemark = {
                        wpt: {
                            '$': {
                                lat: coordinatesToLatLon(elem.Point[0].coordinates[0])[1],
                                lon: coordinatesToLatLon(elem.Point[0].coordinates[0])[0]
                            },
                            name: elem.name,
                            time: elem.TimeStamp[0].when[0],
                            extensions: [{
                                color: [styleToColor(elem.styleUrl[0])]
                            }]
                        }
                    }

                    if (elem.description) {
                        placemark.wpt.desc = elem.description;
                    }

                    // https://github.com/Leonidas-from-XIV/node-xml2js#options-for-the-builder-class
                    let builder = new xml2js.Builder({
                        headless: true
                    });
                    let jsonToXml = builder.buildObject(placemark);

                    content += `${jsonToXml}
`;
                });

                // End of the file
                content += '</gpx>';

                // https://nodejs.org/api/fs.html#fs_fs_writefile_file_data_options_callback
                fs.writeFile(`${pathTofolder}${result.kml.Document[0].name}.gpx`, content, (err) => {
                    if (err) throw err;
                });
            });
        });
    }
});