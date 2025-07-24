("use strict");

import { compareDesc, isValid } from "date-fns";
import fs from "fs";
import path from "path";
import { assert, beforeAll, test } from "vitest";
import xml2js from "xml2js";

const { parseString: parser } = xml2js;

let allBookmarks = [];

const processXMLFiles = async (inputFolder) => {
  const pathToFiles = (folder) => {
    return path.join(__dirname, folder);
  };
  let bookmarksArray = [];

  // Loop through files in folder
  const files = fs.readdirSync(inputFolder);
  for (const file of files) {
    if (file.includes(".kml") || file.includes(".KML")) {
      const filePath = `${pathToFiles(inputFolder)}${file}`;
      const dataFile = await fs.promises.readFile(filePath, "utf8");
      const result = await new Promise((resolve, reject) => {
        parser(dataFile, (err, result) => {
          if (err) reject(err);
          resolve(result);
        });
      });
      const parsedData = result.kml.Document[0];
      if (typeof parsedData.Placemark !== "undefined") {
        bookmarksArray.push(parsedData);
      }
    }
  }

  return bookmarksArray;
};

beforeAll(async () => {
  allBookmarks = await processXMLFiles("./KML/");
});

test("Placemarks have valid data", () => {
  allBookmarks.forEach((bookmark) => {
    for (let i = 1; i < bookmark.Placemark.length; i++) {
      const dateToValidate = new Date(
        bookmark.Placemark[i - 1].TimeStamp[0].when[0],
      );
      assert.isTrue(
        isValid(dateToValidate),
        `Invalid date ${bookmark.Placemark[i - 1].TimeStamp[0].when[0]} of ${bookmark.Placemark[i - 1].name} in ${bookmark.name}`,
      );
    }
  });
});

test("Placemarks have chronological order", () => {
  allBookmarks.forEach((bookmark) => {
    for (let i = 1; i < bookmark.Placemark.length - 1; i++) {
      const previouseDate = new Date(
        bookmark.Placemark[i - 1].TimeStamp[0].when[0],
      );
      const followingDate = new Date(
        bookmark.Placemark[i].TimeStamp[0].when[0],
      );
      assert.isAbove(
        compareDesc(previouseDate, followingDate),
        0,
        `Invalid chronological order between ${bookmark.Placemark[i - 1].TimeStamp[0].when[0]} of ${bookmark.Placemark[i - 1].name} and ${bookmark.Placemark[i].TimeStamp[0].when[0]} of ${bookmark.Placemark[i].name} in ${bookmark.name}`,
      );
    }
  });
});

test("Placemarks have the same scale", () => {
  allBookmarks.forEach((bookmark) => {
    for (let i = 1; i < bookmark.Placemark.length; i++) {
      assert(
        Number(bookmark.Placemark[i].ExtendedData[0]["mwm:scale"][0]) === 17,
        `Invalid scale of ${bookmark.Placemark[i].name} in ${bookmark.name}`,
      );
    }
  });
});

test("Placemarks have unique coordinates", () => {
  allBookmarks.forEach((bookmark) => {
    const coordinates = new Set();
    for (let i = 0; i < bookmark.Placemark.length; i++) {
      const pointCoordinates = bookmark.Placemark[i].Point[0].coordinates[0];

      if (coordinates.has(pointCoordinates)) {
        assert.fail(
          `Duplicate coordinates ${pointCoordinates} of ${bookmark.Placemark[i].name} in ${bookmark.name}`,
        );
      }
      coordinates.add(pointCoordinates);
    }
  });
});

test("Placemarks have valid coordinates", () => {
  allBookmarks.forEach((bookmark) => {
    for (let i = 0; i < bookmark.Placemark.length; i++) {
      const pointCoordinates = bookmark.Placemark[i].Point[0].coordinates[0];

      // Coordinates are separated by comma
      assert.include(
        pointCoordinates,
        ",",
        `Invalid coordinates format ${pointCoordinates} of ${bookmark.Placemark[i].name} in ${bookmark.name}`,
      );

      const [longitude, latitude] = pointCoordinates.split(",").map(Number);

      if (longitude > 180 || longitude < -180) {
        assert.fail(
          `Invalid longitude ${longitude} of ${bookmark.Placemark[i].name} in ${bookmark.name}`,
        );
      }

      if (latitude > 90 || latitude < -90) {
        assert.fail(
          `Invalid latitude ${latitude} of ${bookmark.Placemark[i].name} in ${bookmark.name}`,
        );
      }
    }
  });
});
