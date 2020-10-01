'use strict';

const AWS = require('aws-sdk');
const sharp = require('sharp');
const { baseName, extname } = require('path');

const S3 = new AWS.S3();

module.exports.handle = async ({ Records: records }, context ) => {
  try {
    await Promise.all(records.map(async record => {
      const { key } = record.S3.object;
      
      const image = await S3.getObject({
        Bucket: process.env.bucket,
        Key: key,
      }).promise();

      const resizeImage = await sharp(image.Body)
        .resize(860, 640, { fit: 'inside', withoutEnlargement: true })
        .toFormat('jpeg', { progressive: true, quality: 50 })
        .toBuffer();

        await S3.putObject({
          Body: resizeImage,
          Bucket: process.env.bucket,
          ContentType: 'image/jpeg',
          Key: `compressed/${baseName(key, extname(key))}.jpg`
        }).promise()
    }));

    return {
      statusCode: 201,
      body: {},
    }
  } catch (error) {
    return error;
  }
};
