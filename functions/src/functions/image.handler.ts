import sharp from "sharp";

import {bucket} from "../lib/instance";

export async function submitImageToBucket(imageData: any, board: string): Promise<string> {
    const {filename, mimetype, data} = await imageData;
    const imgBuffer = Buffer.from(data, "base64");

    const outputBuffer = await sharp(imgBuffer)
        .webp({quality: 80, effort: 3})
        .toBuffer();

    await bucket.file(`/uploads/${board}/${filename}`).save(outputBuffer, {metadata: {contentType: mimetype}});

    // Not a permanent URL, but I don't expect anyone in 2500 to be complaining about it.
    return await bucket.file(`/uploads/${filename}`)
        .getSignedUrl({action: "read", expires: "03-01-2500"})
        .then((urls: string[]): string => urls[0]);
}

export async function removeImageFromBucket(url: string): Promise<void> {
    await bucket.file(url).delete();
}
