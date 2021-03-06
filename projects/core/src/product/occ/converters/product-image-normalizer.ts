import { Injectable } from '@angular/core';
import { OccConfig } from '../../../occ/config/occ-config';
import { Image } from '../../../occ/occ-models';
import { Product } from '../../../occ/occ-models/occ.models';
import { Converter } from '../../../util/converter.service';
import { UIImages, UIProduct } from '../../model/product';

@Injectable()
export class ProductImageNormalizer implements Converter<Product, UIProduct> {
  constructor(protected config: OccConfig) {}

  convert(source: Product, target?: UIProduct): UIProduct {
    if (target === undefined) {
      target = { ...(source as any) };
    }
    if (source.images) {
      target.images = this.normalize(source.images);
    }
    return target;
  }

  /**
   * @desc
   * Creates the image structure we'd like to have. Instead of
   * having a single list with all images despite type and format
   * we create a proper structure. With that we can do:
   * - images.primary.thumnail.url
   * - images.GALLERY[0].thumnail.url
   */
  normalize(source: Image[]): UIImages {
    const images = {};
    if (source) {
      for (const image of source) {
        const isList = image.hasOwnProperty('galleryIndex');
        if (!images.hasOwnProperty(image.imageType)) {
          images[image.imageType] = isList ? [] : {};
        }

        let imageContainer;
        if (isList && !images[image.imageType][image.galleryIndex]) {
          images[image.imageType][image.galleryIndex] = {};
        }

        if (isList) {
          imageContainer = images[image.imageType][image.galleryIndex];
        } else {
          imageContainer = images[image.imageType];
        }

        /**
         * Traditionally, in an on-prem world, medias and other backend related calls
         * are hosted at the same platform, but in a cloud setup, applications are are
         * typically distributed cross different environments. For media, we use the
         * `backend.media.baseUrl` by default, but fallback to `backend.occ.baseUrl`
         * if none provided.
         */
        image.url =
          (this.config.backend.media.baseUrl ||
            this.config.backend.occ.baseUrl ||
            '') + image.url;

        imageContainer[image.format] = image;
      }
    }
    return images;
  }
}
