import ShopItem from '../../../models/Shop.js';

/**
 * Finds a user's ShopItem doc or creates a new one if not found.
 * By default networth=0 if new.
 */
export async function getOrCreateShopDoc(userId) {
  let doc = await ShopItem.findOne({ userId });
  if (!doc) {
    doc = new ShopItem({
      userId,
      networth: 0,
      rings: [],
      necklaces: [],
      watches: [],
      strips: []
    });
    await doc.save();
  }
  return doc;
}