"use strict";

const compareDesc = require("date-fns/compareDesc");
const isValid = require("date-fns/isValid");
const fs = require("fs");
const path = require("path");
const xml2js = require("xml2js");

const parser = xml2js.parseString;
const inputFolder = "./KML/";

const pathToFiles = (folder) => {
  return path.join(__dirname, folder);
};

// Loop through files in folder
fs.readdirSync(inputFolder).forEach((file) => {
  if (file.includes(".kml") || file.includes(".KML")) {
    const filePath = `${pathToFiles(inputFolder)}${file}`;
    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) throw err;

      parser(data, (err, result) => {
        if (err) throw err;

        const bookmarkFile = result.kml.Document[0];

        if (typeof bookmarkFile.Placemark !== "undefined") {
          // Loop through bookmarks to validate dates
          for (let i = 1; i < bookmarkFile.Placemark.length - 1; i++) {
            const dateToValidate = new Date(
              bookmarkFile.Placemark[i - 1].TimeStamp[0].when[0],
            );

            if (!isValid(dateToValidate)) {
              console.log(
                `${file} / ${
                  bookmarkFile.Placemark[i - 1].name
                } -- has invalid date`,
              );
            }
          }

          // Loop through bookmarks to validate dates order
          for (let i = 1; i < bookmarkFile.Placemark.length - 1; i++) {
            const previouseDate = new Date(
              bookmarkFile.Placemark[i - 1].TimeStamp[0].when[0],
            );
            const followingDate = new Date(
              bookmarkFile.Placemark[i].TimeStamp[0].when[0],
            );

            const compareDates = compareDesc(previouseDate, followingDate);

            if (compareDates < 0) {
              console.log(
                `${file} / ${bookmarkFile.Placemark[i].name} -- is not in chronological order`,
              );
            }
          }
        }
      });
    });
  }
});
